import { ICompileRequest } from '../shared/ICompileRequest';
import { ICompilerState } from '../shared/ICompilerState';
export declare const compile: (request: ICompileRequest) => ICompilerState;
export declare const compileProjectWithAcorn: (state: ICompilerState) => ICompilerState;
export declare const compileProject: (state: ICompilerState) => ICompilerState;
export declare const createCompilerState: (request: ICompileRequest) => ICompilerState;
/**
 * configPath
 * -f filePath
 * -ts tsconfigPath
 * -o sourceFile outFile
 */
export declare const parseCompileRequest: (args: string[]) => ICompileRequest;
