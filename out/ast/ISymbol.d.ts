import { ISymbolPosition } from "../shared/ISymbolPosition";
import { IHash } from "../shared/IHash";
export declare enum SymbolType {
    Primitive = "Primitive",
    Object = "Object",
    Function = "Function"
}
export interface ISymbol {
    type: SymbolType;
    id: string;
    localName: string;
    fullName: string[];
    start: ISymbolPosition;
    end: ISymbolPosition;
    subitems?: IHash<string>;
}
export interface ISymbolPrimitive extends ISymbol {
}
export interface ISymbolObject extends ISymbol {
}
export interface ISymbolFunction extends ISymbol {
    args: IHash<ISymbol>;
}
