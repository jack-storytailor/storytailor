import { IStsConfig } from "./IStsConfig";
export interface ICompileRequest {
    /**
     * -c configPath
     * -f filePath. If this one specified, compilation will affect only this file
     * -o sourceFile outFile
     */
    configPath?: string;
    /**
     * If this one specified, config path will be ignored. instead compiler will use this instance of config
     */
    config?: IStsConfig;
    filePath?: string;
    output: {
        sourceFilePath: string;
        outputFilePath: string;
    };
}
