"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.symbolFactory = void 0;
const ISymbol_1 = require("./ISymbol");
exports.symbolFactory = {
    primitive: (localName, fullName, start, end) => {
        let id = localName;
        if (fullName) {
            id = fullName.join('.');
        }
        return {
            type: ISymbol_1.SymbolType.Primitive,
            id,
            localName,
            fullName,
            start,
            end
        };
    },
    object: (localName, fullName, subitems, start, end) => {
        let id = localName;
        if (fullName) {
            id = fullName.join('.');
        }
        return {
            type: ISymbol_1.SymbolType.Object,
            id,
            localName,
            fullName,
            subitems,
            start,
            end
        };
    },
    /**
     * [args]: function arguments
     * [subitems]: function body context
     */
    func: (localName, fullName, args, subitems, start, end) => {
        let id = localName;
        if (fullName) {
            id = fullName.join('.');
        }
        return {
            type: ISymbol_1.SymbolType.Function,
            id,
            localName,
            fullName,
            args,
            subitems,
            start,
            end
        };
    }
};
