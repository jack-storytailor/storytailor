export interface ICompileRequest {
  /**
   * -c configPath
   * -f filePath
   * -ts tsconfigPath
   * -o sourceFile outFile
   */
  configPath: string;
  tsConfigPath?: string;
  filePath?: string;
  output: {
    sourceFilePath: string;
    outputFilePath: string;
  }
}
