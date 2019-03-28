/**
 * storyscript compiler
 * 
 * configPath
 * -f filePath
 * -ts tsconfigPath
 * -o sourceFile outFile
 */
import * as compileUtils from './compilation/compileUtils';
import { ICompileRequest } from './shared/ICompileRequest';

// process arguments
if (process.argv.length > 2) {
  let args = process.argv.slice(2);
  let compileRequest: ICompileRequest = compileUtils.parseCompileRequest(args);
  console.log('comple request parsed. request: ', compileRequest);
  let compilerState = compileUtils.compile(compileRequest);
  console.log('compilation done with result ', compilerState);
}
else {
  console.log('no arguments provided. Compilation skipped');
}
