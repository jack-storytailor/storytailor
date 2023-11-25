"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig2 = exports.loadConfig = void 0;
const fs = require("fs");
const path = require("path");
exports.loadConfig = (configPath) => {
    if (!fs.existsSync(configPath)) {
        console.error(`can't find config file ${configPath}`);
        return undefined;
    }
    try {
        const configContent = fs.readFileSync(configPath, 'utf8').toString();
        let config = JSON.parse(configContent);
        let configDir = path.dirname(configPath);
        config.sourceRoot = path.resolve(configDir, config.sourceRoot);
        config.javascriptOutputRoot = path.resolve(configDir, config.javascriptOutputRoot);
        // parse inclide and exclude
        let exclude = config.exclude ? config.exclude.map((strPattern) => {
            try {
                return new RegExp(strPattern);
            }
            catch (error) {
                console.error(error);
                return undefined;
            }
        }).filter((item) => item instanceof RegExp) : undefined;
        let include = config.include ? config.include.map((strPattern) => {
            try {
                return new RegExp(strPattern);
            }
            catch (error) {
                console.error(error);
                return undefined;
            }
        }).filter((item) => item instanceof RegExp) : undefined;
        config.includeParsed = include;
        config.excludeParsed = exclude;
        return config;
    }
    catch (error) {
        console.error(`can't read config file ${configPath}`, error);
    }
    return undefined;
};
exports.loadConfig2 = (configPath) => {
    let errors = [];
    let isSuccess = false;
    let config = undefined;
    try {
        do {
            // check for file existance
            if (!fs.existsSync(configPath)) {
                errors = [...errors, `can't find config file ${configPath}`];
                // break execution
                break;
            }
            // load file content
            try {
                const configContent = fs.readFileSync(configPath, 'utf8').toString();
                config = JSON.parse(configContent);
            }
            catch (error) {
                errors = [
                    ...errors,
                    `error loading config: ${error}`
                ];
                // break execution
                break;
            }
            // process config data
            let configDir = path.dirname(configPath);
            config.sourceRoot = path.resolve(configDir, config.sourceRoot);
            config.javascriptOutputRoot = path.resolve(configDir, config.javascriptOutputRoot);
            // parse inclide and exclude
            let exclude = config.exclude ? config.exclude.map((strPattern) => {
                try {
                    return new RegExp(strPattern);
                }
                catch (error) {
                    console.error(error);
                    return undefined;
                }
            }).filter((item) => item instanceof RegExp) : undefined;
            let include = config.include ? config.include.map((strPattern) => {
                try {
                    return new RegExp(strPattern);
                }
                catch (error) {
                    console.error(error);
                    return undefined;
                }
            }).filter((item) => item instanceof RegExp) : undefined;
            config.includeParsed = include;
            config.excludeParsed = exclude;
            isSuccess = true;
            break;
        } while (false);
    }
    catch (error) {
        errors = [
            ...errors,
            `error loading config: ${error}`
        ];
    }
    // prepare result
    let result = {
        isSuccess,
        config,
        errors
    };
    return result;
};
