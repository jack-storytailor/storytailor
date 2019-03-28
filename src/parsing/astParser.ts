import { ICodeToken } from "../shared/ICodeToken";
import * as ts from 'typescript';
import { ISymbolPosition } from "../shared/ISymbolPosition";
import { IParsingError } from "../shared/IParsingError";
import { IHash } from "../shared/IHash";
import { CodeTokenType } from "../shared/CodeTokenType";
import Unescape from './unescape';
import { IStsConfig } from "../shared/IStsConfig";
import * as path from 'path';
// import { Operators } from "../shared/Operators";

export interface IParserState {
  tokens: ICodeToken[];
  cursor: number;
  sourceFile: ts.SourceFile;
  /**
   * this is a variable's full name. 
   * when user types header (object name), 
   * scope changes to new var name. 
   * for example 
   * Characters 
    * Protagonist
      // and scope for the children will be [Characters, Protagonist]
   */
  scope: string[];
  errors: IParsingError[];
  indent: number;
}

export interface IParseResult<TResult = any> {
  state: IParserState;
  result: TResult;
}

const config = {
  environmentName: '__env',
  environmentPath: 'storyscript/out/environment',
  defaultEnvironmentPath: 'storyscript/out/environment',
  contextName: 'context',
  requireName: 'require',
  moduleName: 'module',
  exportsName: 'exports',
  textName: 'text',
  toStringName: 'objectToString',
  joinName: 'join',
  storyName: 'story',
  serializerName: 'serializer',
  serializeName: 'serialize',
  createStoryName: 'createStory',
  getSerializerName: 'getSerializer',
  
  thisName: 'this',
  
  objectName: 'Object',
  functionName: 'Function',
  booleanName: 'Boolean',
  symbolName: 'Symbol',
  errorName: 'Error',
  evanErrorName: 'EvalError',
  internalError: 'InternalError',
  rangeError: 'RangeError',
  referenceError: 'ReferenceError',
  syntaxError: 'SyntaxError',
  typeError: 'TypeError',
  uriError: 'URIError',

  numberName: 'Number',
  mathName: 'Math',
  dateName: 'Date',

  stringName: 'String',
  regexpName: 'RegExp',

  array: 'Array',
  int8Array: 'Int8Array',
  uint8Array: 'Uint8Array',
  uint8ClampedArray : 'Uint8ClampedArray',
  int16Array: 'Int16Array',
  uint16Array: 'Uint16Array',
  int32Array: 'Int32Array',
  uint32Array: 'Uint32Array',
  float32Array: 'Float32Array',
  float64Array: 'Float64Array',

  nanName: 'NaN',
  infinityName: 'Infinity',
  undefinedName: 'undefined',
  nullName: 'null',

  evalName: 'eval',
  isFinite: 'isFinite',
  isNan: 'isNaN',
  parseFloat: 'parseFloat',
  parseInt: 'parseInt',
  decodeUri: 'decodeURI',
  encodeUri: 'encodeURI',
  decodeUriComponent: 'decodeURIComponent',
  encodeUriComponent: 'encodeURIComponent',

  jsonName: 'JSON',
}

const gloablFunctions = [
  config.evalName,
  config.isFinite,
  config.isNan,
  config.parseFloat,
  config.parseInt,
  config.decodeUri,
  config.decodeUriComponent,
  config.encodeUri,
  config.encodeUriComponent
];

const globalObjects = [
  config.objectName,
  config.functionName,
  config.booleanName,
  config.symbolName,
  config.errorName,
  config.evanErrorName,
  config.internalError,
  config.rangeError,
  config.referenceError,
  config.syntaxError,
  config.typeError,
  config.uriError,

  config.numberName,
  config.mathName,
  config.dateName,

  config.stringName,
  config.regexpName,

  config.array,
  config.int8Array,
  config.uint8Array,
  config.uint8ClampedArray,
  config.int16Array,
  config.uint16Array,
  config.int32Array,
  config.uint32Array,
  config.float32Array,
  config.float64Array,

  config.jsonName,
  config.nullName,
  config.undefinedName
];

const globalNames = [
  ...gloablFunctions,
  ...globalObjects,
];

export const parseModule = (tokens: ICodeToken[], modulePath: string, stsConfig: IStsConfig): IParseResult<ts.SourceFile> => {
  if (stsConfig.environmentPath) {
    config.environmentPath = stsConfig.environmentPath || config.defaultEnvironmentPath;

    let envPath = path.resolve(stsConfig.sourceRoot, stsConfig.environmentPath + '.js');
    let moduleDir = path.dirname(modulePath);
    let envDir = path.dirname(envPath);
    let relativeModulePath = path.relative(moduleDir, envDir);
    if (relativeModulePath === '') {
      relativeModulePath = '.';
    }
    let envModulePath = relativeModulePath + '/' + stsConfig.environmentPath;
    config.environmentPath = envModulePath;
  }

  if (!config.environmentPath) {
    config.environmentPath = config.defaultEnvironmentPath;
  }

  let environmentPath = config.environmentPath;

  if (!tokens) {
    return undefined;
  }
  
  let result = ts.createSourceFile(modulePath, '', ts.ScriptTarget.Latest);

  let state: IParserState =
  {
    tokens: tokens,
    cursor: 0,
    sourceFile: result,
    scope: [],
    errors: [],
    indent: 0
  };

  /**
   * function createStory() {
   * this.environment = require('storyscript/environment');
   *  this.serializer = environment.getSerializer();
   *  this.text = [];
   *  // ... user code
   *  return this;
   * }
   * 
   * const story = createStory();
   * export default story;
   */

   // this.environment = require('storyscript/environment')
  let importEnvironment: ts.Statement = ts.createExpressionStatement(
    ts.createBinary(
      ts.createPropertyAccess(
        ts.createThis(),
        ts.createIdentifier(config.environmentName)
      ),
      ts.SyntaxKind.EqualsToken,
      ts.createCall(
        ts.createIdentifier('require'),
        undefined,
        [
          ts.createStringLiteral(environmentPath)
        ]
      )
    ),
  );

  // this.serializer = this.environment.getSerializer();
  let createSerializer: ts.Statement = ts.createExpressionStatement(
    ts.createBinary(
      ts.createElementAccess(
        ts.createThis(),
        ts.createStringLiteral(config.serializerName)
      ),
      ts.SyntaxKind.EqualsToken,
      ts.createCall(
        ts.createElementAccess(
          ts.createElementAccess(
            ts.createThis(),
            ts.createStringLiteral(config.environmentName)
          ),
          ts.createStringLiteral(config.getSerializerName)
        ),
        undefined,
        []
      )
    ),
  );

  // this.text = [];
  let createResultText: ts.Statement = ts.createExpressionStatement(
    ts.createBinary(
      ts.createElementAccess(
        ts.createThis(),
        ts.createStringLiteral(config.textName)
      ),
      ts.SyntaxKind.EqualsToken,
      ts.createArrayLiteral([])
    ),
  );

  let createStoryHeader: ts.Statement[] = [
    importEnvironment,
    createSerializer,
    // createResultText,
  ];
  
  let userCode: ts.Statement[] = [];
  while (!isEndOfFile(state)) {
    // skip comment line
    let commentResult;
    while (commentResult = parseEndlineComment(state, true)) {
      state = commentResult.state;
    }

    // check statement
    let statementResult = parseStatement(state);
    if (statementResult) {
      state = statementResult.state;
      userCode = [...userCode, ...statementResult.result];
      continue;
    }

    // if we here, skip unparsed token
    state = skipTokens(state, 1);
  }

  let createStoryFooter: ts.Statement[] = [
    ts.createReturn(ts.createThis())
  ];

  let createStoryFunction: ts.Statement = ts.createFunctionDeclaration(
    undefined,
    undefined,
    undefined,
    ts.createIdentifier(config.createStoryName),
    undefined,
    undefined,
    undefined,
    ts.createBlock(
      [
        ...createStoryHeader,
        ...userCode,
        ...createStoryFooter
      ],
      true
    )
  );

  createStoryFunction = ts.createVariableStatement(
    undefined,
    ts.createVariableDeclarationList([
      ts.createVariableDeclaration(
        ts.createIdentifier(config.createStoryName),
        undefined,
        ts.createArrowFunction(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          ts.createBlock(
            [
              ...createStoryHeader,
              ...userCode,
              ...createStoryFooter
            ],
            true
          )
        )
      )
    ], ts.NodeFlags.Const)
  );

  // const story = createStory.call({});
  let createStoryCall: ts.Statement = ts.createVariableStatement(
    undefined,
    ts.createVariableDeclarationList([
      ts.createVariableDeclaration(
        ts.createIdentifier(config.storyName),
        undefined,
        ts.createCall(
          ts.createPropertyAccess(
            ts.createIdentifier(config.createStoryName),
            ts.createIdentifier('call')
          ),
          undefined,
          [
            ts.createObjectLiteral()
          ]
        )
      )
    ], ts.NodeFlags.Const)
  );

  //export default story;
  let defaultExport = ts.createExportDefault(ts.createIdentifier(config.storyName));
  
  // module.exports = story;
  let moduleExport: ts.Statement = ts.createExpressionStatement(
    ts.createBinary(
      ts.createPropertyAccess(
        ts.createIdentifier('module'),
        ts.createIdentifier('exports')
      ),
      ts.SyntaxKind.EqualsToken,
      ts.createIdentifier(config.storyName)
    )
  );

  let moduleStatements: ts.Statement[] = [
    createStoryFunction,
    createStoryCall,
    defaultExport,
    moduleExport
  ];
  result.statements = ts.createNodeArray(moduleStatements);

  return {
    state, 
    result
  }
};

export const parseStatement = (state: IParserState): IParseResult<ts.Statement[]> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // it can be import declaration
  const importResult = parseImportDeclaration(state);
  if (importResult) {
    state = importResult.state;
    let result = [importResult.result];

    return {
      state,
      result
    }
  }

  // it can be variable declaration
  let variableResult = parseVariableDeclaration(state);
  if (variableResult) {
    state = variableResult.state;
    let result = [variableResult.result];

    return {
      state,
      result
    }
  }

  // it can be code block
  let codeblockResult = parseCodeblock(state);
  if (codeblockResult) {
    state = codeblockResult.state;
    let result = codeblockResult.result;

    return {
      state,
      result
    }
  }

  // it can be add text line
  let addtextResult = parseAddTextLine(state);
  if (addtextResult) {
    state = addtextResult.state;
    let result = [addtextResult.result];

    return {
      state,
      result
    }
  }

  return undefined;
}

export const parseEndlineComment = (state: IParserState, skipEndline: boolean): IParseResult => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // if previous token was / then this is not a comment line
  if (getTokenOfType(state, [CodeTokenType.Backslash], -1)) {
    return undefined;
  }

  // state = skipWhitespace(state);
  if (checkTokenSequence(state, [CodeTokenType.CommentLine])) {
    let prevToken = getToken(state, -1);
    if (prevToken && prevToken.type === CodeTokenType.Backslash) {
      return undefined;
    }

    state = skipWhitespace(state);
    state = skipUntil(state, [CodeTokenType.Endline]);

    if (skipEndline && getTokenOfType(state, [CodeTokenType.Endline])) {
      state = skipTokens(state, 1);
    }

    return {
      state, 
      result:{}
    };
  }

  return undefined;
}

export const parseImportDeclaration = (state: IParserState): IParseResult<ts.Statement> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // skip empty line before if exists
  if (getTokenOfType(state, [CodeTokenType.Endline])) {
    state = skipTokens(state, 1);
  }

  // read indent
  let indent = 0;
  let whitespaceResult = readWhitespace(state);
  if (whitespaceResult) {
    state = whitespaceResult.state;
    indent = Math.floor((whitespaceResult.result || '').length / 2);
  }

  // read import mark *+
  const markSequence = [CodeTokenType.Star, CodeTokenType.Plus, CodeTokenType.Space];
  if (!checkTokenSequence(state, markSequence)) {
    return undefined;
  }
  state = skipTokens(state, markSequence.length);

  // read import name
  let varnameResult = readString(state, [CodeTokenType.Endline, CodeTokenType.CommentLine, CodeTokenType.Equals, CodeTokenType.Semicolon], true);
  if (!varnameResult) {
    return undefined;
  }
  state = varnameResult.state;
  let varname = varnameResult.result;

  // skip spaces
  state = skipWhitespace(state);

  // read import path
  if (getTokenOfType(state, [CodeTokenType.Equals])) {
    state = skipTokens(state, 1);
  }

  // skip comment line
  let skipCommentResult = parseEndlineComment(state, false);
  if (skipCommentResult) {
    state = skipCommentResult.state;
  }

  // read the rest of the line as module path
  let modulePath: string = '';
  let modulePathResult = readString(state, [CodeTokenType.Endline, CodeTokenType.Semicolon], true);
  if (modulePathResult) {
    state = modulePathResult.state;
    modulePath = modulePathResult.result;
  }
  
  // skip semicolon if any
  if (getTokenOfType(state, [CodeTokenType.Semicolon])) {
    state = skipTokens(state, 1);
  }

  // skip endline after import
  if (getTokenOfType(state, [CodeTokenType.Endline])) {
    state = skipTokens(state, 1);
  }

  // skip next line if it empty
  if (getTokenOfType(state, [CodeTokenType.Endline])) {
    state = skipTokens(state, 1);
  }

  // 1. check indent and prepare scope
  let parentsCount = Math.min(indent, state.scope.length);
  let scope = state.scope.slice(0, parentsCount);
  // add current varname to the scope so if next code line will be with greater indent, that will mean that line is a subline of mine
  scope = [...scope, varname];

  // 2. create variable full name starting with this
  let varName: ts.Expression = ts.createThis();
  for (let i = 0; i < scope.length; i++) {
    varName = ts.createElementAccess(
      varName,
      ts.createStringLiteral(scope[i])
    );
  }

  // this['varname'] = require('modulePath');
  let result = ts.createExpressionStatement(
    ts.createBinary(
      // this['varname]
      varName,
      // =
      ts.SyntaxKind.EqualsToken,
      // this['varname'] || {}
      ts.createCall(
        ts.createIdentifier(config.requireName),
        undefined,
        [
          ts.createStringLiteral(modulePath)
        ]
      )
    )
  );

  state = {
    ...state,
    scope: scope,
    indent: indent
  }

  return {
    state,
    result,
  }
}

export const parseVariableDeclaration = (state: IParserState): IParseResult<ts.Statement> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // skip empty line before if exists
  if (getTokenOfType(state, [CodeTokenType.Endline])) {
    state = skipTokens(state, 1);
  }

  // read indent
  let indent = 0;
  let whitespaceResult = readWhitespace(state);
  if (whitespaceResult) {
    state = whitespaceResult.state;
    indent = Math.floor((whitespaceResult.result || '').length / 2);
  }

  // read variiable mark *
  const markSequence = [CodeTokenType.Star, CodeTokenType.Space];
  if (!checkTokenSequence(state, markSequence)) {
    return undefined;
  }
  state = skipTokens(state, markSequence.length);

  // read variable name
  let varnameResult = readString(state, [CodeTokenType.Endline, CodeTokenType.CommentLine], true);
  if (!varnameResult) {
    return undefined;
  }
  state = varnameResult.state;
  let varname = varnameResult.result;

  // skip comment line
  let skipCommentResult = parseEndlineComment(state, false);
  if (skipCommentResult) {
    state = skipCommentResult.state;
  }

  /* skip endline token */ 
  if (getTokenOfType(state, [CodeTokenType.Endline])) {
    state = skipTokens(state, 1);
  }

  // 1. check indent and prepare scope
  let parentsCount = Math.min(indent, state.scope.length);
  let scope = state.scope.slice(0, parentsCount);
  // add current varname to the scope so if next code line will be with greater indent, that will mean that line is a subline of mine
  scope = [...scope, varname];

  // 2. create variable full name starting with this
  let varName: ts.Expression = ts.createThis();
  for (let i = 0; i < scope.length; i++) {
    varName = ts.createElementAccess(
      varName,
      ts.createStringLiteral(scope[i])
    );
  }

  // this['varname'] = this['varname'] || {};
  let result = ts.createExpressionStatement(
    ts.createBinary(
      // this['varname]
      varName,
      // =
      ts.SyntaxKind.EqualsToken,
      // this['varname'] || {}
      ts.createBinary(
        varName,
        ts.SyntaxKind.BarBarToken,
        ts.createObjectLiteral()
      )
    )
  );

  state = {
    ...state,
    scope: scope,
    indent: indent
  }

  return {
    state,
    result,
  }
}

export const parseCodeblock = (state: IParserState): IParseResult<ts.Statement[]> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // skip empty line before if exists
  if (getTokenOfType(state, [CodeTokenType.Endline])) {
    state = skipTokens(state, 1);
  }

  // read indent
  state = skipWhitespace(state, true);

  // read variiable mark *
  const markSequence = [CodeTokenType.Star, CodeTokenType.BraceOpen];
  if (!checkTokenSequence(state, markSequence)) {
    return undefined;
  }
  // skip star, but don't skip {
  state = skipTokens(state, 1);

  // parse {} scope
  let scopeResult = parseScope(state, [CodeTokenType.BraceOpen], [CodeTokenType.BraceClose]);
  if (!scopeResult) {
    return undefined;
  }

  state = scopeResult.state;
  let result = scopeResult.result.map((expr: ts.Expression): ts.Statement => {
    return ts.createExpressionStatement(expr);
  });

  // skip empty line after if exists
  if (getTokenOfType(state, [CodeTokenType.Endline])) {
    state = skipTokens(state, 1);
  }

  if (getTokenOfType(state, [CodeTokenType.Endline])) {
    state = skipTokens(state, 1);
  }

  return {
    result,
    state
  }
}

export const parseAddTextLine = (state: IParserState): IParseResult<ts.Statement> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // read indent
  let indent = 0;
  let whitespaceResult = readWhitespace(state);
  if (whitespaceResult) {
    indent = Math.floor((whitespaceResult.result || '').length / 2);
    indent = Math.min(state.scope.length, indent);

    for (let i = 0; i < indent * 2; i++) {
      if (getTokenOfType(state, [CodeTokenType.Space])) {
        state = skipTokens(state, 1);
      }
    }
  }

  // parse line text as template
  let templateResult = parseTemplate(state, [CodeTokenType.Endline]);
  let template: ts.Expression;
  if (templateResult) {
    state = templateResult.state;
    template = templateResult.result;
  }

  // skip endline
  if (getTokenOfType(state, [CodeTokenType.Endline])) {
    state = skipTokens(state, 1);
  }

  // 1. check indent and prepare parent
  let parentsCount = Math.min(indent, state.scope.length);
  let scope = state.scope.slice(0, parentsCount);

  state = {
    ...state,
    scope: scope,
  }

  // 2. create variable full name starting with this
  let varName: ts.Expression = ts.createThis();
  for (let i = 0; i < scope.length; i++) {
    varName = ts.createElementAccess(
      varName,
      ts.createStringLiteral(scope[i])
    );
  }

  // add ['text'] tp varname
  varName = ts.createElementAccess(
    varName,
    ts.createStringLiteral(config.textName)
  );

  // this['varname']['text'] = [...(this['varname']['text']), 'new line'];
  let result = ts.createExpressionStatement(
    ts.createBinary(
      // this['varname]
      varName,
      // =
      ts.SyntaxKind.EqualsToken,
      // [...(this['varname']['text']), 'new line']
      ts.createArrayLiteral([
        // ...(this['varname']['text'])
        ts.createSpread(
          ts.createParen(
            ts.createBinary(
              varName,
              ts.SyntaxKind.BarBarToken,
              ts.createArrayLiteral()
            )
          )
        ),
        // 'new line'
        template
      ])
    )
  );

  return {
    state,
    result
  }
}

export const parseTemplate = (state: IParserState, breakTokens: CodeTokenType[]): IParseResult<ts.Expression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  if (getTokenOfType(state, breakTokens)) {
    let result = ts.createStringLiteral('');
    state = skipTokens(state, 1);

    return {
      state,
      result
    }
  }

  // parse template items until break tokens
  let templateItemResult: IParseResult<ts.Expression>;
  let templateItems: ts.Expression[];
  while (templateItemResult = parseTemplateItem(state, breakTokens)) {
    state = templateItemResult.state;
    templateItems = addItemToArray(templateItems, templateItemResult.result);

    if (getTokenOfType(state, breakTokens)) {
      break;
    }
  }

  // create result
  let result: ts.Expression;
  templateItems.forEach((item: ts.Expression) => {
    if (!result) {
      result = item;
      return;
    }

    result = ts.createBinary(
      result,
      ts.SyntaxKind.PlusToken,
      item
    );
  });

  return {
    state,
    result
  }
}

export const parseTemplateItem = (state: IParserState, breakTokens: CodeTokenType[]): IParseResult<ts.Expression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // template item can be mention or string
  // parse mention
  let mentionResult = parseMention(state);
  if (mentionResult) {
    return mentionResult;
  }

  // parse string
  let stringResult = readString(state, [...breakTokens, CodeTokenType.Star, CodeTokenType.CommentLine]);
  if (stringResult) {
    state = stringResult.state;
    let resultText: string;
    try {
      resultText = stringResult.result || '';
      resultText = resultText.replace(/((?:^|[^\\])(?:\\\\)*)(\\\/)/, '$1/');
      resultText = Unescape(resultText);
    } catch (error) {
      console.error(error);
      resultText = stringResult.result;
    }

    let result = ts.createStringLiteral(resultText);
    
    return {
      result: result,
      state: state
    }
  }

  // if we here and we have * that means this is star without mention. don't skip it
  let nextToken = getTokenOfType(state, [CodeTokenType.Star]);
  if (nextToken) {
    let result = ts.createStringLiteral(nextToken.value || '*');
    state = skipTokens(state, 1);

    return {
      result,
      state
    }
  }

  return undefined;
}

export const parseMention = (state: IParserState): IParseResult<ts.Expression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // check * mark
  if (!getTokenOfType(state, [CodeTokenType.Star, CodeTokenType.Endline])) {
    return undefined;
  }
  state = skipTokens(state, 1);

  // parse mention target until ;
  let mtResult = parseExpression(state, false);
  if (!mtResult) {
    return undefined;
  }
  state = mtResult.state;
  let target = mtResult.result;

  // mention is a this.serializer.serialize(target, '\n') call
  let result = ts.createCall(
    // this.serializer.serialize
    ts.createPropertyAccess(
      // this.serializer
      ts.createElementAccess(
        ts.createThis(),
        ts.createStringLiteral(config.serializerName)
      ),
      // serialize
      ts.createIdentifier(config.serializeName)
    ),
    undefined,
    // target, separator (default is '\n')
    [
      target,
      ts.createStringLiteral('\n')
    ]
  );

  if (getTokenOfType(state, [CodeTokenType.Semicolon])) {
    state = skipTokens(state, 1);
  }

  return {
    result: result,
    state: state,
  }
}

export const parseExpression = (state: IParserState, isMultiline: boolean): IParseResult<ts.Expression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // parse expression start. it can be number, string, identifier, paren operation
  let expressionStartResult = parseOperand(state);
  if (!expressionStartResult) {
    return undefined;
  }

  state = expressionStartResult.state;
  let result = expressionStartResult.result;

  // parse operation
  let breakTokens = [CodeTokenType.Semicolon, CodeTokenType.Comma, CodeTokenType.BracketClose, CodeTokenType.ParenClose, CodeTokenType.BraceClose];
  if (!isMultiline) {
    breakTokens = [...breakTokens, CodeTokenType.Endline];
  }

  while (!getTokenOfType(state, breakTokens) && !isEndOfFile(state)) {
    // skip empty space
    state = skipWhitespace(state, isMultiline);
    if (getTokenOfType(state, breakTokens)) {
      break;
    }

    let operationResult = parseOperation(state, result, isMultiline);
    if (operationResult) {
      state = operationResult.state;
      result = operationResult.result;

      continue;
    }

    state = skipTokens(state, 1);
  }

  return {
    state,
    result
  }
}

export const parseOperation = (state: IParserState, leftOperand: ts.Expression, isMultiline: boolean): IParseResult<ts.Expression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // parse get operation
  let getOperationResult = parseGetOperation(state, leftOperand);
  if (getOperationResult) {
    return getOperationResult;
  }

  // parse call
  let callResult = parseCall(state, leftOperand);
  if (callResult) {
    return callResult;
  }

  // parse indexer
  let indexerResult = parseIndexer(state, leftOperand);
  if (indexerResult) {
    return indexerResult;
  }

  // parse binary
  let binaryResult = parseBinary(state, leftOperand, isMultiline);
  if (binaryResult) {
    return binaryResult;
  }

  return undefined;
}

export const parseBinary = (state: IParserState, leftOperand: ts.Expression, isMultiline: boolean): IParseResult<ts.Expression> => {
  if (isEndOfFile(state)) {
    return undefined;
  } 

  // parse operator
  let operatorResult = parseBinaryOperator(state);
  if (!operatorResult) {
    return undefined;
  }

  state = operatorResult.state;
  let operator = operatorResult.result;

  // skip empty space
  state = skipWhitespace(state, isMultiline);

  // parse right expression
  let rightOperand: ts.Expression;
  let rightOperandResult = parseExpression(state, isMultiline);
  if (rightOperandResult) {
    state = rightOperandResult.state;
    rightOperand = rightOperandResult.result;
  }

  // prepare result
  let result: ts.Expression = ts.createBinary(
    leftOperand,
    operator,
    rightOperand
  );

  return {
    state,
    result
  }
}

export const parseCall = (state: IParserState, leftOperand: ts.Expression): IParseResult<ts.Expression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // parse scope
  let scopeResult = parseScope(state, [CodeTokenType.ParenOpen], [CodeTokenType.ParenClose]);
  if (!scopeResult) {
    return undefined;
  }

  state = scopeResult.state;
  let result = ts.createCall(
    leftOperand,
    undefined,
    scopeResult.result
  );

  return {
    state,
    result
  }
}

export const parseIndexer = (state: IParserState, leftOperand: ts.Expression): IParseResult<ts.Expression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // parse all expressions between [ and ]
  let scopeResult = parseScope(state, [CodeTokenType.BracketOpen], [CodeTokenType.BracketClose]);
  if (!scopeResult) {
    return undefined;
  }
  state = scopeResult.state;

  // result is a first expression is a scope. or undefined in case this is an empty scope
  let expression: ts.Expression = scopeResult.result.length > 0 ? scopeResult.result[0] : undefined;
  let result = ts.createElementAccess(
    leftOperand,
    expression
  );

  return {
    state,
    result
  }
}

export const parseGetOperation = (state: IParserState, leftOperand: ts.Expression): IParseResult<ts.Expression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // parse get operator
  if (!getTokenOfType(state, [CodeTokenType.Dot])) {
    return undefined;
  }

  state = skipTokens(state, 1);

  // parse .'varname'
  let literalResult = parseStringLiteral(state, [CodeTokenType.Prime], [CodeTokenType.Prime]);
  if (literalResult) {
    state = literalResult.state;
    let result = ts.createElementAccess(
      leftOperand,
      ts.createStringLiteral(literalResult.result)
    );

    return {
      result,
      state
    }
  }

  // parse .varname
  let wordResult = parseWord(state);
  if (wordResult) {
    state = wordResult.state;
    let result = ts.createElementAccess(
      leftOperand,
      ts.createStringLiteral(wordResult.result)
    );

    return {
      result,
      state
    }
  }

  return undefined;
}

export const parseOperand = (state: IParserState): IParseResult<ts.Expression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // number
  let numberResult = parseNumber(state);
  if (numberResult) {
    state = numberResult.state;
    let result = ts.createNumericLiteral(numberResult.result.toString());
  
    return {
      state,
      result
    }
  }

  // template literal (text with *mentions)
  let templateLiteralResult = parseTemplateLiteral(state, [CodeTokenType.Quote], [CodeTokenType.Quote]);
  if (templateLiteralResult) {
    return templateLiteralResult;
  }

  // string literal
  let stringResult = parseStringLiteral(state, [CodeTokenType.Quote], [CodeTokenType.Quote]);
  if (stringResult) {
    state = stringResult.state;
    let result = ts.createStringLiteral(stringResult.result);
  
    return {
      state,
      result
    }
  }

  // identifier, quoted with prime, a.k. 'variable name'
  let quotedTextResult = parseStringLiteral(state, [CodeTokenType.Prime], [CodeTokenType.Prime]);
  if (quotedTextResult) {
    state = quotedTextResult.state;
    let result: ts.Expression = createCorrectIdentifierOperand(quotedTextResult.result);

    if (result) {
      return {
        state,
        result
      }
    }

    return undefined;
  }

  // identifier word, a.k. variableName
  let wordResult = parseWord(state);
  if (wordResult) {
    state = wordResult.state;
    let result: ts.Expression = createCorrectIdentifierOperand(wordResult.result);

    if (result) {
      return {
        state,
        result
      }
    }

    return undefined;
  }

  // paren expression
  let parenExpressionResult = parseParenthesizedExpression(state);
  if (parenExpressionResult) {
    state = parenExpressionResult.state;
    let result = parenExpressionResult.result;

    return {
      state,
      result
    }
  }

  let arrayLiteralResult = parseArrayLiteral(state);
  if (arrayLiteralResult) {
    state = arrayLiteralResult.state;
    let result = arrayLiteralResult.result;

    return {
      state,
      result
    }
  }

  return undefined;
}

export const createCorrectIdentifierOperand = (operandText: string): ts.Expression => {
  if (!operandText) {
    return undefined;
  }

  if (operandText === config.thisName) {
    let result = ts.createThis();
    return result;
  }

  if (globalNames.some((item) => item === operandText)) {
    let result = ts.createIdentifier(operandText);
    return result;
  }

  let result = ts.createElementAccess(
    ts.createThis(),
    ts.createStringLiteral(operandText)
  );

  return result;
}

export const parseTemplateLiteral = (state: IParserState, openTokens: CodeTokenType[], breakTokens: CodeTokenType[]): IParseResult<ts.Expression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // skip oepn token
  if (!getTokenOfType(state, openTokens)) {
    return undefined;
  }

  state = skipTokens(state, 1);

  // parse template items until break tokens
  let templateItemResult: IParseResult<ts.Expression>;
  let templateItems: ts.Expression[] = [];
  while (templateItemResult = parseTemplateItem(state, breakTokens)) {
    state = templateItemResult.state;
    templateItems = addItemToArray(templateItems, templateItemResult.result);

    if (getTokenOfType(state, breakTokens)) {
      break;
    }
  }

  if (templateItems.length === 0) {
    templateItems = [
      ts.createStringLiteral('')
    ];
  }

  // create result
  let result: ts.Expression;
  templateItems.forEach((item: ts.Expression) => {
    if (!result) {
      result = item;
      return;
    }

    result = ts.createBinary(
      result,
      ts.SyntaxKind.PlusToken,
      item
    );
  });

  // skip end token
  if (getTokenOfType(state, breakTokens)) {
    state = skipTokens(state, 1);
  }

  return {
    result: result,
    state: state
  }
}

export const parseParenthesizedExpression = (state: IParserState): IParseResult<ts.ParenthesizedExpression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // parse all expressions between ( and )
  let scopeResult = parseScope(state, [CodeTokenType.ParenOpen], [CodeTokenType.ParenClose]);
  if (!scopeResult) {
    return undefined;
  }
  state = scopeResult.state;

  // result is a first expression is a scope. or undefined in case this is an empty scope
  let expression: ts.Expression = scopeResult.result.length > 0 ? scopeResult.result[0] : undefined;
  let result = ts.createParen(
    expression
  );

  return {
    state,
    result
  }
}

export const parseArrayLiteral = (state: IParserState): IParseResult<ts.ArrayLiteralExpression> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // parse all expressions between ( and )
  let scopeResult = parseScope(state, [CodeTokenType.BracketOpen], [CodeTokenType.BracketClose]);
  if (!scopeResult) {
    return undefined;
  }
  state = scopeResult.state;

  // result is a first expression is a scope. or undefined in case this is an empty scope
  let result = ts.createArrayLiteral(
    scopeResult.result
  );

  return {
    state,
    result
  }
}

export const parseScope = (state: IParserState, openTokens: CodeTokenType[], closeTokens: CodeTokenType[]): IParseResult<ts.Expression[]> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // skip open token
  if (!getTokenOfType(state, openTokens)) {
    return undefined;
  }
  state = skipTokens(state, 1);

  let result: ts.Expression[] = [];

  // parse expressions until )
  while (!isEndOfFile(state) && !getTokenOfType(state, closeTokens)) {
    // skip empty space
    state = skipWhitespace(state, true);
    if (getTokenOfType(state, closeTokens)) {
      break;
    }

    // read expression
    let expressionResult = parseExpression(state, true);
    if (expressionResult) {
      state = expressionResult.state;
      result = [...(result || []), expressionResult.result];

      continue;
    }

    let commentsResult = parseEndlineComment(state, false);
    if (commentsResult) {
      state = commentsResult.state;
    
      continue;
    }

    // if we here, just skip token we weren't able to parse
    state = skipTokens(state, 1);
  }

  // skip close token
  if (getTokenOfType(state, closeTokens)) {
    state = skipTokens(state, 1);
  }

  return {
    state,
    result
  }
}

export const parseBinaryOperator = (state: IParserState): IParseResult<ts.BinaryOperator> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  if (getTokenOfType(state, [CodeTokenType.Plus])) {
    state = skipTokens(state, 1);
    let result = ts.SyntaxKind.PlusToken;

    return {
      state,
      result
    }
  }

  if (getTokenOfType(state, [CodeTokenType.Minus])) {
    state = skipTokens(state, 1);
    let result = ts.SyntaxKind.MinusToken;

    return {
      state,
      result
    }
  }

  if (getTokenOfType(state, [CodeTokenType.Slash])) {
    state = skipTokens(state, 1);
    let result = ts.SyntaxKind.SlashToken;

    return {
      state,
      result
    }
  }

  if (getTokenOfType(state, [CodeTokenType.Star])) {
    state = skipTokens(state, 1);
    let result = ts.SyntaxKind.AsteriskToken;

    return {
      state,
      result
    }
  }

  if (checkTokenSequence(state, [CodeTokenType.OrSign, CodeTokenType.OrSign])) {
    state = skipTokens(state, 2);
    let result = ts.SyntaxKind.BarBarToken;

    return {
      state,
      result
    }
  }

  if (checkTokenSequence(state, [CodeTokenType.Equals, CodeTokenType.Equals, CodeTokenType.Equals])) {
    state = skipTokens(state, 3);
    let result = ts.SyntaxKind.EqualsEqualsEqualsToken;

    return {
      state,
      result
    }
  }

  if (checkTokenSequence(state, [CodeTokenType.Equals, CodeTokenType.Equals])) {
    state = skipTokens(state, 2);
    let result = ts.SyntaxKind.EqualsEqualsToken;

    return {
      state,
      result
    }
  }

  if (getTokenOfType(state, [CodeTokenType.Equals])) {
    state = skipTokens(state, 1);
    let result = ts.SyntaxKind.EqualsToken;

    return {
      state,
      result
    }
  }

  if (getTokenOfType(state, [CodeTokenType.TupleOpen])) {
    state = skipTokens(state, 1);
    let result = ts.SyntaxKind.LessThanToken;

    return {
      state,
      result
    }
  }

  if (getTokenOfType(state, [CodeTokenType.TupleClose])) {
    state = skipTokens(state, 1);
    let result = ts.SyntaxKind.GreaterThanToken;

    return {
      state,
      result
    }
  }

  return undefined;
}

export const parseWord = (state: IParserState): IParseResult<string> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // identifier can be word or string literal
  let result: string;

  // if it's not quoted string
  let word = getTokenOfType(state, [CodeTokenType.Word]);
  if (word) {
    result = word.value;
    state = skipTokens(state, 1);

    return {
      state,
      result
    }
  }

  return undefined;
}

export const parseNumber = (state: IParserState): IParseResult<number> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  let word = getTokenOfType(state, [CodeTokenType.Word]);
  if (!word) {
    return undefined;
  }

  // parse first digit
  let firstDigit = Number(word.value);
  if (isNaN(firstDigit)) {
    return undefined;
  }
  state = skipTokens(state, 1);

  let stringResult = '' + firstDigit;

  if (getTokenOfType(state, [CodeTokenType.Dot])) {
    let substate = skipTokens(state, 1);
    // try parse next digit

    let nextToken = getTokenOfType(substate, [CodeTokenType.Word]);
    if (nextToken) {
      let nextDigit = Number(nextToken.value);
      if (!isNaN(nextDigit)) {
        stringResult += '.' + nextDigit;
      
        state = skipTokens(substate, 1);
      }
    }
  }

  let result = Number(stringResult);
  if (!isNaN(result)) {
    return {
      state,
      result
    }
  }

  return undefined;
}

export const parseStringLiteral = (state: IParserState, openTokens: CodeTokenType[], breakTokens: CodeTokenType[]): IParseResult<string> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  // skip oepn token
  if (!getTokenOfType(state, openTokens)) {
    return undefined;
  }

  state = skipTokens(state, 1);

  // read everything until end quote
  let stringResult = readString(state, breakTokens);
  let result = '';
  if (stringResult) {
    state = stringResult.state;
    result = stringResult.result || '';
  }

  try {
    result = Unescape(result);
  } catch (error) {
    console.error(error);
  }
  
  // skip end token
  if (getTokenOfType(state, breakTokens)) {
    state = skipTokens(state, 1);
  }

  return {
    result: result,
    state: state
  }
}

export const readString = (state: IParserState, breakTokens: CodeTokenType[], trimString: boolean = false): IParseResult<string> => {
  if (isEndOfFile(state)) {
    return undefined;
  }

  let result: string;
  let nextToken: ICodeToken;
  let offset = 0;

  while (nextToken = getToken(state, offset)) {
    if (!nextToken) {
      break;
    }

    if (breakTokens.indexOf(nextToken.type) >= 0) {
      let escapedRegexp: RegExp = /(^|^.*?[^\\](\\\\)*)\\$/;

      let testResult = escapedRegexp.test(result);
      if (!testResult) {
        break;
      }
    }

    result = (result || '') + nextToken.value;

    offset++;
  }

  if (!result) {
    return undefined;
  }

  state = skipTokens(state, offset);

  if (trimString) {
    result = result.trim();
  }

  if (!result) {
    return undefined;
  }

  return {
    result,
    state
  }
}

// single line!
export const readWhitespace = (state: IParserState) => {
  return readTokensAsString(state, [CodeTokenType.Space]);
}

export const readTokensAsString = (state: IParserState, tokenTypes: CodeTokenType[]): IParseResult<string> => {
  let value: string;
  let nextToken: ICodeToken;

  while (nextToken = getTokenOfType(state, tokenTypes)) {
    value = (value || '') + nextToken.value;
    state = skipTokens(state, 1);
  }

  if (!value) {
    return undefined;
  }

  return {
    state: state,
    result: value
  }
}

export const isEndOfFile = (state: IParserState, offset: number = 0): boolean => {
  if (!state || !state.tokens || state.tokens.length <= 0) {
    return true;
  }

  const cursor = state.cursor + offset;
  return state.tokens.length <= cursor;
}

export const addItemToArray = <T = any>(source: T[], item: T): T[] => {
  source = source || [];
  return [
    ...source,
    item
  ]
}
export const addItemToHash = <T = any>(source: IHash<T>, key: string, item: T): IHash<T> => {
  source = source || {};
  return {
    ...source,
    [key]: item
  }
}

export const getToken = (state: IParserState, offset: number = 0): ICodeToken => {
  if (isEndOfFile(state, offset)) {
    return undefined;
  }

  const cursor = state.cursor + offset;
  if (cursor < 0) {
    return undefined;
  }

  return state.tokens[cursor];
}
export const getTokenOfType = (state: IParserState, types: CodeTokenType[], offset: number = 0): ICodeToken => {
  if (isEndOfFile(state, offset)) {
    return undefined;
  }

  const cursor = state.cursor + offset;
  if (cursor < 0) {
    return undefined;
  }

  const token = state.tokens[cursor];
  if (!token) {
    return undefined;
  }

  if (types.indexOf(token.type) < 0) {
    return undefined;
  }

  return token;
}
export const getCursorPosition = (state: IParserState): ISymbolPosition => {
  if (!state) {
    return undefined;
  }

  if (isEndOfFile(state)) {
    if (state.tokens.length > 0) {
      let lastToken = state.tokens[state.tokens.length - 1];
      return lastToken.start;
    }
  }

  const nextToken = getToken(state);
  return nextToken.start;
}

export const skipWhitespace = (state: IParserState, multiline: boolean = false): IParserState => {
  const tokenTypes = multiline
    ? [CodeTokenType.Space, CodeTokenType.Endline]
    : [CodeTokenType.Space];
  return skipTokensOfType(state, tokenTypes);
}
export const skipTokenOfType = (state: IParserState, tokenTypes: CodeTokenType[]): IParserState => {
  let nextToken = getTokenOfType(state, tokenTypes);
  if (nextToken) {
    state = skipTokens(state, 1);
  }

  return state;
}
export const skipTokensOfType = (state: IParserState, tokenTypes: CodeTokenType[]): IParserState => {
  if (isEndOfFile(state)) {
    return state;
  }

  if (!tokenTypes || tokenTypes.length <= 0) {
    return state;
  }

  let nextToken: ICodeToken;
  while (nextToken = getToken(state)) {
    if (tokenTypes.indexOf(nextToken.type) < 0) {
      return state;
    }

    state = skipTokens(state, 1);
  }

  return state;
}
export const skipUntil = (state: IParserState, tokenTypes: CodeTokenType[]): IParserState => {
  if (isEndOfFile(state)) {
    return state;
  }

  if (!tokenTypes || tokenTypes.length <= 0) {
    return state;
  }

  let nextToken: ICodeToken;
  while (nextToken = getToken(state)) {
    if (tokenTypes.indexOf(nextToken.type) >= 0) {
      return state;
    }

    state = skipTokens(state, 1);
  }

  return state;
}

export const checkTokenSequence = (state: IParserState, tokenTypes: CodeTokenType[]): boolean => {
  if (isEndOfFile(state)) {
    return false;
  }

  if (!tokenTypes || tokenTypes.length <= 0) {
    return true;
  }

  for (let i = 0; i < tokenTypes.length; i++) {
    const tokenType = tokenTypes[i];
    const token = getToken(state, i);
    if (!token || token.type !== tokenType) {
      // broken sequence
      return undefined;
    }
  }

  return true;
}

export const skipTokens = (state: IParserState, tokensCount: number): IParserState => {
  if (isEndOfFile(state)) {
    if (tokensCount === 0)
      return state;

    return undefined;
  }

  const cursor = state.cursor + tokensCount;
  if (state.tokens.length < cursor) {
    return undefined;
  }

  state = {
    ...state,
    cursor: cursor,
  }

  return state;
}
