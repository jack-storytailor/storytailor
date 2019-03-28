/**
 * params:
 * configpath modulePath outputPath
 */

import * as configUtils from './configuration/configUtils';
import * as path from 'path';
import * as fsUtils from './fileSystem/fsUtils';
import * as fs from 'fs';

console.log('story rendering starting with params ', process.argv);

if (process.argv.length > 2) {
  let configPath = process.argv[2];
  console.log('config path ', configPath);

  let config = configUtils.loadConfig(configPath);
  if (!config) {
    console.error("Can't load config at path ", configPath);
  }
  else if (process.argv.length > 3) {
    console.log('config loaded at path ', configPath, ' is ', config, ' js output path: ', config.javascriptOutputRoot);
    let modulePath = process.argv[3];
    modulePath = path.resolve(config.javascriptOutputRoot, modulePath);
    console.log('rendering story module at path ', modulePath);
    if (process.argv.length > 4) {
      let outputPath = process.argv[4];
      outputPath = path.resolve(config.sourceRoot, outputPath);
      console.log('rendering story module to ', outputPath);

      try {
        let storyModule = require(modulePath);
        console.log('story module is ', typeof storyModule);
        if (storyModule) {
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
            let storyText = environment.getSerializer().serialize(storyModule, '\n');
            let outputDir = path.dirname(outputPath);
            console.log('checking directory existance at path ', outputDir);
            fsUtils.mkDirByPathSync(outputDir);
            fs.writeFileSync(outputPath, storyText);
          } catch (error) {
            console.log('error during serializing module at path ', modulePath, ' error is ', error);
          }

          console.log('rendering story finished');
        }

      } catch (error) {
        console.error(error);
      }
    }
  }
  else {
    console.error("incorrect params: ", process.argv, " correct format: configPath sourceFileName outputFileName");
  }

  console.log('rendering story done');
}