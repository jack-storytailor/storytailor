import { SymbolType, ISymbolPrimitive, ISymbol, ISymbolObject, ISymbolFunction } from "./ISymbol";
import { IHash } from "../shared/IHash";
import { ISymbolPosition } from "../shared/ISymbolPosition";

export const symbolFactory = {

  primitive: (localName: string, fullName: string[], start: ISymbolPosition, end: ISymbolPosition): ISymbolPrimitive => {
    let id = localName;
    if (fullName) {
      id = fullName.join('.');
    }

    return {
      type: SymbolType.Primitive,
      id,

      localName,
      fullName,

      start,
      end
    }
  },

  object: (localName: string, fullName: string[], subitems: IHash<string>, start: ISymbolPosition, end: ISymbolPosition): ISymbolObject => {
    let id = localName;
    if (fullName) {
      id = fullName.join('.');
    }

    return {
      type: SymbolType.Object,
      id,

      localName,
      fullName,

      subitems,

      start,
      end
    }
  },

  /**
   * [args]: function arguments
   * [subitems]: function body context
   */
  func: (localName: string, fullName: string[], args: IHash<ISymbol>, subitems: IHash<string>, start: ISymbolPosition, end: ISymbolPosition): ISymbolFunction => {
    let id = localName;
    if (fullName) {
      id = fullName.join('.');
    }

    return {
      type: SymbolType.Function,
      id,

      localName,
      fullName,

      args,
      subitems,

      start,
      end
    }
  }

}