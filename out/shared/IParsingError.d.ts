import { ISymbolPosition } from "./ISymbolPosition";
export declare enum ParsingErrorType {
    Hint = 3,
    Info = 2,
    Warning = 1,
    Error = 0
}
export interface IParsingError {
    position: ISymbolPosition;
    message: string;
}
export interface IRange {
    start: ISymbolPosition;
    end: ISymbolPosition;
}
export interface IDiagnostic {
    /**
     * The range at which the message applies
     */
    range: IRange;
    /**
     * The diagnostic's severity. Can be omitted. If omitted it is up to the
     * client to interpret diagnostics as error, warning, info or hint.
     */
    severity?: ParsingErrorType;
    /**
     * The diagnostic's code, which usually appear in the user interface.
     */
    code?: number | string;
    /**
     * A human-readable string describing the source of this
     * diagnostic, e.g. 'typescript' or 'super lint'. It usually
     * appears in the user interface.
     */
    source?: string;
    /**
     * The diagnostic's message. It usually appears in the user interface
     */
    message: string;
}
