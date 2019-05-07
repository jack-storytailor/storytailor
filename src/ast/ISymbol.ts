import { ISymbolPosition } from "../shared/ISymbolPosition";
import { IHash } from "../shared/IHash";

export enum SymbolType {
  Primitive = "Primitive",
  Object = "Object",
  Function = "Function"
}

export interface ISymbol {
  name: string;
  type: SymbolType;

  parent: ISymbol;
  subitems: IHash<ISymbol>;
}




