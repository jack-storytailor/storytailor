import { ICompileRequest } from "./ICompileRequest";
import { IStsConfig } from "./IStsConfig";
import { IDiagnostic } from "./IParsingError";
import { IHash } from "./IHash";

export interface ICompilerState {
  request: ICompileRequest;
  config: IStsConfig;

  sourceFileNames?: string[];
  relativeFileNames?: string[];

  javascriptFileNames?: string[];

  diagnostics: IDiagnostic[];
  sortedDiagnostics: IHash<IDiagnostic[]>;
  status: CompileStatus;
}

export enum CompileStatus {
  Ok = 'Ok',
  Failed = 'Failed'
}