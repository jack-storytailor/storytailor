import * as fs from 'fs';
import { IStsConfig } from '../shared/IStsConfig';
import * as path from 'path';

export const loadConfig = (configPath: string): IStsConfig => {
  if (!fs.existsSync(configPath)) {
    console.error(`can't find config file ${configPath}`);
    return undefined;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8').toString();
    let config = JSON.parse(configContent) as IStsConfig;

    let configDir = path.dirname(configPath);
    config.sourceRoot = path.resolve(configDir, config.sourceRoot);
    config.javascriptOutputRoot = path.resolve(configDir, config.javascriptOutputRoot);

    // parse inclide and exclude
    let exclude = config.exclude ? config.exclude.map((strPattern: string): RegExp => {
      try {
        return new RegExp(strPattern);
      } catch (error) {
        console.error(error);
        return undefined;
      }
    }).filter((item) => item instanceof RegExp) : undefined;
    let include = config.include ? config.include.map((strPattern: string): RegExp => {
      try {
        return new RegExp(strPattern);
      } catch (error) {
        console.error(error);
        return undefined;
      }
    }).filter((item) => item instanceof RegExp) : undefined;

    config.includeParsed = include;
    config.excludeParsed = exclude;

    return config;

  } catch (error) {
    console.error(`can't read config file ${configPath}`, error);
  }

  return undefined;
}