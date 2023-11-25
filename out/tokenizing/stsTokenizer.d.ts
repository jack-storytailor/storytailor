import { ISymbolPosition } from "../shared/ISymbolPosition";
import { ICodeToken } from "../shared/ICodeToken";
import { CodeTokenType } from "../shared/CodeTokenType";
export interface ITokenizerState {
    sourceCode: string;
    cursor: ISymbolPosition;
    globalCursor: number;
    tokens: ICodeToken[];
}
export declare const stsTokenizer: {
    tokenizeCode: (sourceCode: string) => ICodeToken[];
    getNextToken: (state: ITokenizerState, fallbackTokenType: CodeTokenType, pattern?: string) => ICodeToken;
    addToken_old: (state: ITokenizerState, token: ICodeToken) => ITokenizerState;
    addToken: (state: ITokenizerState, token: ICodeToken) => ITokenizerState;
    isEndOfFile: (state: ITokenizerState) => boolean;
};
