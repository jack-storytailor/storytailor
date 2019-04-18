import * as path from 'path';
import * as fs from 'fs';
import * as configUtils from '../configuration/configUtils';
import * as fsUtils from '../fileSystem/fsUtils';
import * as child_process from 'child_process';
import {stsTokenizer} from '../tokenizing/stsTokenizer';
import * as astParser2 from '../parsing/astParser2';
import * as jsCompiler from '../compilation/jsCompiler';
import { ICompileRequest } from '../shared/ICompileRequest';
import { ICompilerState, CompileStatus } from '../shared/ICompilerState';
import { IDiagnostic, ParsingErrorType } from '../shared/IParsingError';
import { ISymbolPosition } from '../shared/ISymbolPosition';

export const compile = (request: ICompileRequest): ICompilerState => {
  let state: ICompilerState = undefined;
  try {
    console.log(`storytailor compilation started`, request);
    state = createCompilerState(request);

    // compile storytailor
    state = compileProject(state);
    console.log('storytailor compilation finished with status ', state.status);
    
    // compile typescript if needed
    if (request.tsConfigPath) {
      // TODO: REFACTOR THIS TO GET POSSIBILITY OF COLLECTING ALL THE DIAGNOSTICS DATA OF TYPESCRIPT COMPILATION

      let commandText = "tsc -p " + request.tsConfigPath;
      console.log('typescript compilation started. executing ', commandText);
      let execResult = child_process.execSync(commandText);
      let execOutput = (execResult || "No Execution Result!").toString();
      console.log('typescript compilation done with output ', execOutput);
    }

    // execute compiled program to serialize requested module
    if (request.output) {
      let printerPath = require.resolve('../printer');
      let relativeSourceFileName = request.output.sourceFilePath;
      relativeSourceFileName = path.dirname(relativeSourceFileName) + '/' + path.basename(relativeSourceFileName, path.extname(relativeSourceFileName)) + '.js';
      let relativeOutputFileName = request.output.outputFilePath
      let command = `node "${printerPath}" "${request.configPath}" "${relativeSourceFileName}" "${relativeOutputFileName}"`;
      console.log('executing ', command);
      let execOutputResult = child_process.execSync(command);
      let execOuputText = execOutputResult.toString();
      console.log('executing ', command, ' done with result ', execOuputText);
    }

    state = {
      ...state,
      status: CompileStatus.Ok
    };

    console.log('compilation done with state', state.status);
    return state;
  }
  catch (error) {
    console.error();

    if (state) {
      addErrorAndLog(
        state,
        ParsingErrorType.Error,
        `error in attempt to compile ${error.message}; ${error}}`,
        undefined,
        undefined,
        1,
        "."
      );
    }
  }

  return state;
}

export const compileProject = (state: ICompilerState): ICompilerState => {
  if (!state) {
    return undefined;
  }

  if (!state.config) {
    return state;
  }

  let sourceFileNames = state.sourceFileNames;
  let jsFileNames = state.javascriptFileNames;
  let tsFileNames = state.typescriptFileNames;
  let config = state.config;
  let sourceFileName: string = undefined;

  // for each file read file content, tokenize, parse and save as js/ts
  for (let i = 0; i < sourceFileNames.length; i++) {
    try {
      // check source file existence
      sourceFileName = sourceFileNames[i];
      if (!fs.existsSync(sourceFileName)) {
        state = addErrorAndLog(
          state,
          ParsingErrorType.Warning,
          `file ${sourceFileName} doesn't exists`,
          undefined,
          undefined,
          1,
          sourceFileName
        );
        continue;
      }

      // read source file
      let sourceFileContent = fs.readFileSync(sourceFileName).toString();

      // tokenize source file
      let tokens = stsTokenizer.tokenizeCode(sourceFileContent);
      if (!tokens) {
        state = addErrorAndLog(
          state,
          ParsingErrorType.Warning,
          `can't tokenize ${sourceFileName} file`,
          undefined,
          undefined,
          1,
          sourceFileName
        );
        continue;
      }

      // print compiled
      let outputFileContent: string = '';
      
      // parse sts2
      let parseResult2 = astParser2.parseModule(tokens, sourceFileName);
      const targetFileName = jsFileNames && jsFileNames.length > i ? jsFileNames[i] : undefined;
      if (parseResult2) {
        let astModule = parseResult2.result;
        let parsingState = parseResult2.state;

        // check if there was parsing errors
        if (parsingState.errors) {
          let parsingErrors = parsingState.errors;
          for (let i = 0; i < parsingErrors.length; i++) {
            let diagnostic: IDiagnostic = parsingErrors[i];
            diagnostic = {...diagnostic, source: sourceFileName};
            state = addDiagnostic(state, diagnostic);
          }
        }

        // compile ast
        let compileResult = jsCompiler.compile({
          ast: [astModule],
          environmentPath: config.environmentPath,
          outputRoot: config.javascriptOutputRoot,
          sourceFileName: sourceFileName,
          sourceRoot: config.sourceRoot,
          targetFileName: targetFileName 
        });
        if (compileResult) {
          outputFileContent = compileResult.javascript;
        }
      }

      // save typescript file if needed
      if (config.isEmitTypescript) {
        let outputFileName = tsFileNames && tsFileNames.length > i ? tsFileNames[i] : undefined;
        if (config.typescriptExtension) {
          let newFileName = path.basename(outputFileName, path.extname(outputFileName)) + config.typescriptExtension;
          let newDirName = path.dirname(outputFileName);
          outputFileName = path.resolve(newDirName, newFileName);
        }
        if (!outputFileName) {
          state = addErrorAndLog(
            state,
            ParsingErrorType.Error,
            `can't create corresponding typescript file name for the file ${sourceFileName}`,
            undefined,
            undefined,
            1,
            sourceFileName
          );

          continue;
        }

        try {
          const outputDir = path.dirname(outputFileName);
          fsUtils.mkDirByPathSync(outputDir);

          fs.writeFileSync(outputFileName, outputFileContent);
        } catch (error) {
          state = addErrorAndLog(
            state,
            ParsingErrorType.Error,
            `can't save file ${outputFileName}. error: ${error.message}; ${error}`,
            undefined,
            undefined,
            1,
            sourceFileName
          );
        }
      }

      // save javascript file if needed
      if (config.isEmitJavascript) {
        const outputFileName = jsFileNames && jsFileNames.length > i ? jsFileNames[i] : undefined;
        if (!outputFileName) {
          state = addErrorAndLog(
            state,
            ParsingErrorType.Error,
            `can't create corresponding javascript file name for the file ${sourceFileName}`,
            undefined,
            undefined,
            1,
            sourceFileName
          );

          continue;
        }

        try {
          const outputDir = path.dirname(outputFileName);
          fsUtils.mkDirByPathSync(outputDir);

          fs.writeFileSync(outputFileName, outputFileContent);
        } catch (error) {
          state = addErrorAndLog(
            state,
            ParsingErrorType.Error,
            `can't save file ${outputFileName}. error ${error.message}; ${error}`,
            undefined,
            undefined,
            1,
            sourceFileName
          );
        }
      }

    } catch (error) {
      state = addErrorAndLog(
        state,
        ParsingErrorType.Error,
        `error while compiling ${sourceFileName}. error ${error.message}; ${error}`,
        undefined,
        undefined,
        1,
        sourceFileName
      );
    }
  }

  return state;
}

export const createCompilerState = (request: ICompileRequest): ICompilerState => {
  if (!request) {
    return undefined;
  }

  let configPath = request.configPath;
  let state: ICompilerState = {
    config: undefined,
    diagnostics: [],
    request: request,
    status: CompileStatus.Failed,
    sortedDiagnostics: {}
  };

  let config = configUtils.loadConfig(configPath);
  if (!config) {
    state = addErrorAndLog(
      state,
      ParsingErrorType.Error,
      `can't load config file on path ${configPath}`,
      undefined,
      undefined,
      1,
      configPath
    );

    return state;
  }
  state = {
    ...state,
    config: config
  };

  let sourceFileNames: string[];
  let relativeFileNames: string[];
  
  // if filePath is specified in a request, compilation will affect only this certain file
  if (request.filePath) {
    let fullPath = path.resolve(config.sourceRoot, request.filePath);
    sourceFileNames = [fullPath];
    relativeFileNames = [request.filePath];
  }
  else {
    // if filePath is not specified in a request, compile files that will be found in a folders from a config
    sourceFileNames = fsUtils.getFileNamesAndFilter(config.sourceRoot, true, config.includeParsed, config.excludeParsed);
    relativeFileNames = sourceFileNames ? sourceFileNames.map((fileName: string) => fsUtils.getRelativeFileName(fileName, config.sourceRoot)) : undefined;
  }

  let javascriptFileNames = relativeFileNames ? relativeFileNames.map((fileName: string) => {
    let result = path.resolve(config.javascriptOutputRoot, fileName);
    result = path.resolve(path.dirname(result), path.basename(result, path.extname(result)) + '.js');
    return result;
  }) : undefined;
  let typescriptFileNames = relativeFileNames ? relativeFileNames.map((fileName: string) => {
    let result = path.resolve(config.typescriptOutputRoot, fileName);
    result = path.resolve(path.dirname(result), path.basename(result, path.extname(result)) + '.ts');
    return result;
  }) : undefined;

  state = {
    ...state,
    sourceFileNames,
    relativeFileNames,
    javascriptFileNames,
    typescriptFileNames
  };

  return state;
}

/**
 * configPath
 * -f filePath
 * -ts tsconfigPath
 * -o sourceFile outFile
 */
export const parseCompileRequest = (args: string[]): ICompileRequest => {
  console.log('starting parsing compile request. args: ', args);

  if (!args || args.length === 0) {
    return undefined;
  }

  // first param is a config path
  let configPath = args[0]; 

  if (!path.isAbsolute(configPath)) {
    configPath = path.resolve(process.cwd(), configPath);
  }

  console.log('parsing compile request. config path: ', configPath);

  let request: ICompileRequest = {
    configPath,
    output: undefined,
    filePath: undefined,
    tsConfigPath: undefined
  }

  // read until params are expected
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    // file path
    if (arg === '-f') {
      if (args.length > i + 1) {
        let filePath = args[i + 1];
        i++;
        
        request = {
          ...request,
          filePath: filePath
        };
      }

      continue;
    }

    // -ts tsconfigPath
    if (arg === '-ts') {
      if (args.length > i + 1) {
        let tsConfigPath = args[i + 1];
        i++;

        request = {
          ...request,
          tsConfigPath: tsConfigPath
        };
      }

      continue;
    }

    // -o sourceFile outFile
    if (arg === '-o') {
      if (args.length > i + 1) {
        let sourceFile = args[i + 1];
        i++;
        if (args.length > i + 1) {
          let outFile = args[i + 1];

          request = {
            ...request,
            output: {
              sourceFilePath: sourceFile,
              outputFilePath: outFile
            }
          }
        }

        request = {
          ...request,
          tsConfigPath: sourceFile
        };
      }

      continue;
    }
  }

  console.log('parsing compile request done. request: ', request);

  return request;
}

const addError = (state: ICompilerState, severity: ParsingErrorType, message: string, start: ISymbolPosition, end: ISymbolPosition, code?: string|number, source?: string): ICompilerState => {
  if (!state) {
    return undefined;
  }

  let diagnostic: IDiagnostic = {
    severity,
    message,
    range: {
      start,
      end
    },
    code,
    source
  };

  return addDiagnostic(state, diagnostic);
}

const addErrorAndLog = (state: ICompilerState, severity: ParsingErrorType, message: string, start: ISymbolPosition, end: ISymbolPosition, code?: string|number, source?: string): ICompilerState => {
  let errorMessage = `${source}: ${message}`;

  if (severity == ParsingErrorType.Error) {
    console.error(errorMessage);
  }
  else if (severity == ParsingErrorType.Warning) {
    console.warn(errorMessage);
  }
  else if (severity == ParsingErrorType.Info) {
    console.info(errorMessage);
  }
  else {
    console.log(errorMessage);
  }
  switch (severity) {
    case ParsingErrorType.Error:
      break;
  
    default:
      break;
  }

  return addError(state, severity, message, start, end, code, source);
}

const addDiagnostic = (state: ICompilerState, diagnostic: IDiagnostic): ICompilerState => {
  if (!state || !diagnostic) {
    return state;
  }

  let sourcePath = diagnostic.source || ".";
  if (sourcePath) {
    let sortedDiagnostics = state.sortedDiagnostics || {};
    let diagArray = sortedDiagnostics[sourcePath] || [];
    diagArray = [
      ...diagArray,
      diagnostic
    ];

    sortedDiagnostics = {
      ...sortedDiagnostics,
      [sourcePath]: diagArray
    };

    state = {
      ...state,
      sortedDiagnostics: sortedDiagnostics
    };
  }


  state = {
    ...state,
    diagnostics: [
      ...state.diagnostics,
      diagnostic
    ]
  };

  return state;
}