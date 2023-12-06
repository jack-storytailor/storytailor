import * as acorn from "acorn";
export declare enum Separators {
    Endline13 = "\r",
    EndLine10 = "\n",
    Tab = "\t",
    Space = " ",
    Colon = ":",
    Semicolon = ";",
    Dot = ".",
    Coma = ",",
    Not = "!",
    Quote = "\"",
    Prime = "'",
    Tilde = "`",
    Plus = "+",
    Minus = "-",
    Equals = "=",
    Star = "*",
    Slash = "/",
    Backslash = "\\",
    More = ">",
    Less = "<",
    Caret = "^",
    Percent = "%",
    Dollar = "$",
    Hash = "#",
    At = "@",
    ParenL = "(",
    ParenR = ")",
    BraceL = "{",
    BraceR = "}",
    BraketL = "[",
    BraketR = "]",
    Question = "?",
    Or = "|",
    And = "&"
}
export declare const allSeparators: any[];
export declare const sortedSeparators: {};
export declare enum NodeTypes {
    OuterTextLine = "OuterTextLine",
    OuterDeclaration = "OuterDeclaration",
    TextLineInclude = "TextLineInclude",
    TextLineWord = "TextLineWord"
}
export interface IOuterExpression extends acorn.Node {
}
export interface IOuterTextLine extends acorn.Node {
    values: acorn.Node[];
}
export declare const acornParser: {
    parse: (fileContent: string) => acorn.Program;
};
