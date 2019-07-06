/**
 * params:
 * configPath modulePath outputPath [-multifile]
 */

import * as configUtils from './configuration/configUtils';
import * as path from 'path';
import * as fsUtils from './fileSystem/fsUtils';
import * as fs from 'fs';

const printModule = (configPath: string, modulePath: string, outputPath: string, isMultifile: boolean): {isSuccess: boolean, errors: string[], log: string[]} => {

  let isSuccess = false;
  let errors = [];
  let log = [];

  try {
    
    do {

      log.push(`printing module started`);

      // load config
      let configResult = configUtils.loadConfig2(configPath);
      if (!configResult.isSuccess) {
        errors = [
          ...errors,
          ...(configResult.errors || [])
        ];

        // break execution
        break;
      }

      // chech config
      let config = configResult.config;
      if (!config) {
        errors = [
          ...errors,
          `error loading config`
        ];

        // break execution
        break;
      }

      log.push(`loading config done`);

      // module path
      modulePath = path.resolve(config.javascriptOutputRoot, modulePath);
      outputPath = path.resolve(config.sourceRoot, outputPath);

      log.push(`printing story from module "${modulePath}" to "${outputPath}`);

      // load storyModule
      let storyModule = require(modulePath);
      log.push(`story module is ${typeof storyModule}`);

      // check storyModule
      if (!storyModule) {
        errors.push(`story module is empty or not exists`);
        
        // break execution
        break;
      }

      // if we here that means we have some storyModule

      try {

        // try to load environment
        let environment: { getSerializer: ()=> {serialize: (obj: any, separator: string) => string } };
        if (config.environmentPath) {
          let envPath = path.resolve(config.javascriptOutputRoot, config.environmentPath);
          try {
            environment = require(envPath);
          } catch (error) {
            console.log('error during resolving environment module at path ', envPath);
          }
        }

        // use own environment if wasn't been able to load user defined one
        if (!environment) {
          environment = require('./environment');
        }

        try {
          // check serializer
          let serializer = environment.getSerializer();
          if (!serializer) {
            throw "can't get serializer";
          }
          
          // check target directory existance
          let outputDir = path.dirname(outputPath);
          log.push(`checking target directory existance at path "${outputDir}"`);
          fsUtils.mkDirByPathSync(outputDir);

          // print story

          // in a singlefile mode we print storyModule to outputPath

          if (!isMultifile) {
            // print story just to target file as usual

            log.push(`printing story in a single file mode`);
            let storyText = serializer.serialize(storyModule, '\n');
            log.push(`writing story to ${outputPath}`);
            fs.writeFileSync(outputPath, storyText);
          
            break;
          }

          /**
            if we here, that means we're in multifile mode

            in a multifile mode we take storyModule fields
            and all module fields that have their own field named 
            
            __printFileName
            
            we print to corresponding file in outputPath directory
            with file name equals to __printFileName value
          */

          
          // print multiline mode
          log.push(`printing story in a single file mode`);

          // for every root field in module...
          for (let moduleFieldName in storyModule) {

            // check if that field has __printFileName property that is string and is not empty
            try {

              let moduleField = storyModule[moduleFieldName];
              if (!moduleField) {
                continue;
              }

              // check for __printFileName field existance
              let fieldFileName = moduleField.__printFileName;
              if (typeof(fieldFileName) !== "string" || fieldFileName.length <= 0) {
                continue;
              }

              let targetFileName = path.resolve(outputDir, fieldFileName);
              // check target directory existance
              let targetOutputDir = path.dirname(targetFileName);
              log.push(`checking target directory existance at path "${targetOutputDir}"`);
              fsUtils.mkDirByPathSync(targetOutputDir);

              // print field value to file
              let fieldText = serializer.serialize(moduleField, '\n');
              log.push(`writing module field "${moduleFieldName}" to "${targetFileName}"`);
              fs.writeFileSync(targetFileName, fieldText);
              
            } catch (error) {
              errors = [
                ...(errors || []),
                `printing module field "${moduleFieldName}" error: "${error}"`
              ];

              continue;
            }

          }

        } catch (error) {
          console.log('error during serializing module at path ', modulePath, ' error is ', error);
        }

      } catch (error) {
        errors.push(`printing module error: ${error}`);

        // you shell not pass!
        break;
      }

      // you shell not pass!
      break;
    } while (false);

  } catch (error) {
    errors = [
      ...errors,
      `error printing module: ${error}`
    ];
  }

  // prepare result
  let result = {
    isSuccess,
    errors,
    log
  };

  return result;
}

let argv = process.argv;
if (argv.length < 4) {
  console.error("incorrect params: ", process.argv, " correct format: 'configPath modulePath outputPath [-multifile]'");
}

// console.log('story rendering starting with params ', process.argv);

let log = [];
let errors = [];

try {
  
  do {

    let configPath = argv[2];
    let modulePath = argv[3];
    let outputPath = argv[4];
    let isMultifile = false;

    if (argv.length > 5) {
      let paramStr = argv[5] || "";
      paramStr = paramStr.trim();
      isMultifile = (paramStr === "-multifile")
    }

    log.push(`printing story. config: "${configPath}"; modulePath: "${modulePath}"; outputPath: "${outputPath}"; isMultifile: "${isMultifile}"`);

    let printResult = printModule(configPath, modulePath, outputPath, isMultifile);
    if (!printResult) {
      throw `printing error: print result is incorrect`;
    }

    // sync log
    log = [
      ...log,
      ...(printResult.log || [])
    ];

    // sync errors
    errors = [
      ...errors,
      ...(printResult.errors || [])
    ];

    // you shell not pass!
    break;
  } while (false);

} catch (error) {
  errors = [
    ...(errors || []),
    error
  ];
}

// write errors in the console
console.log(`errors`, errors);
// write log in the console
console.log(`log`, log);

// LEGACY


// if (process.argv.length > 2) {
//   let configPath = process.argv[2];
//   console.log('config path ', configPath);

//   let config = configUtils.loadConfig(configPath);
//   if (!config) {
//     console.error("Can't load config at path ", configPath);
//   }
//   else if (process.argv.length > 3) {
//     console.log('config loaded at path ', configPath, ' is ', config, ' js output path: ', config.javascriptOutputRoot);
//     let modulePath = process.argv[3];
//     modulePath = path.resolve(config.javascriptOutputRoot, modulePath);
//     console.log('rendering story module at path ', modulePath);
//     if (process.argv.length > 4) {
//       let outputPath = process.argv[4];
//       outputPath = path.resolve(config.sourceRoot, outputPath);
//       console.log('rendering story module to ', outputPath);

//       try {
//         let storyModule = require(modulePath);
//         console.log('story module is ', typeof storyModule);
//         if (storyModule) {
//           // try to load environment
//           let environment: { getSerializer: ()=> {serialize: (obj: any, separator: string) => string } };
//           if (config.environmentPath) {
//             let envPath = path.resolve(config.javascriptOutputRoot, config.environmentPath);
//             try {
//               environment = require(envPath);
//             } catch (error) {
//               console.log('error during resolving environment module at path ', envPath);
//             }
//           }

//           // use own environment if wasn't been able to load user defined one
//           if (!environment) {
//             environment = require('./environment');
//           }

//           try {
//             let storyText = environment.getSerializer().serialize(storyModule, '\n');
//             let outputDir = path.dirname(outputPath);
//             console.log('checking directory existance at path ', outputDir);
//             fsUtils.mkDirByPathSync(outputDir);
//             fs.writeFileSync(outputPath, storyText);
//           } catch (error) {
//             console.log('error during serializing module at path ', modulePath, ' error is ', error);
//           }

//           console.log('rendering story finished');
//         }

//       } catch (error) {
//         console.error(error);
//       }
//     }
//   }
//   else {
//     console.error("incorrect params: ", process.argv, " correct format: configPath sourceFileName outputFileName");
//   }

//   console.log('rendering story done');
// }
