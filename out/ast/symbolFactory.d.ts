import { ISymbolPrimitive, ISymbol, ISymbolObject, ISymbolFunction } from "./ISymbol";
import { IHash } from "../shared/IHash";
import { ISymbolPosition } from "../shared/ISymbolPosition";
export declare const symbolFactory: {
    primitive: (localName: string, fullName: string[], start: ISymbolPosition, end: ISymbolPosition) => ISymbolPrimitive;
    object: (localName: string, fullName: string[], subitems: IHash<string>, start: ISymbolPosition, end: ISymbolPosition) => ISymbolObject;
    /**
     * [args]: function arguments
     * [subitems]: function body context
     */
    func: (localName: string, fullName: string[], args: IHash<ISymbol>, subitems: IHash<string>, start: ISymbolPosition, end: ISymbolPosition) => ISymbolFunction;
};
