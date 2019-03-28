import { ICodeToken } from "../shared/ICodeToken";
import * as ts from 'typescript';
import { ISymbolPosition } from "../shared/ISymbolPosition";
import { IParsingError } from "../shared/IParsingError";
import { IHash } from "../shared/IHash";
import { CodeTokenType } from "../shared/CodeTokenType";
import { IStsConfig } from "../shared/IStsConfig";
export interface IParserState {
    tokens: ICodeToken[];
    cursor: number;
    sourceFile: ts.SourceFile;
    /**
     * this is a variable's full name.
     * when user types header (object name),
     * scope changes to new var name.
     * for example
     * Characters
      * Protagonist
        // and scope for the children will be [Characters, Protagonist]
     */
    scope: string[];
    errors: IParsingError[];
    indent: number;
}
export interface IParseResult<TResult = any> {
    state: IParserState;
    result: TResult;
}
export declare const parseModule: (tokens: ICodeToken[], modulePath: string, stsConfig: IStsConfig) => IParseResult<ts.SourceFile>;
export declare const parseStatement: (state: IParserState) => IParseResult<ts.Statement[]>;
export declare const parseEndlineComment: (state: IParserState, skipEndline: boolean) => IParseResult<any>;
export declare const parseImportDeclaration: (state: IParserState) => IParseResult<ts.Statement>;
export declare const parseVariableDeclaration: (state: IParserState) => IParseResult<ts.Statement>;
export declare const parseCodeblock: (state: IParserState) => IParseResult<ts.Statement[]>;
export declare const parseAddTextLine: (state: IParserState) => IParseResult<ts.Statement>;
export declare const parseTemplate: (state: IParserState, breakTokens: CodeTokenType[]) => IParseResult<ts.Expression>;
export declare const parseTemplateItem: (state: IParserState, breakTokens: CodeTokenType[]) => IParseResult<ts.Expression>;
export declare const parseMention: (state: IParserState) => IParseResult<ts.Expression>;
export declare const parseExpression: (state: IParserState, isMultiline: boolean) => IParseResult<ts.Expression>;
export declare const parseOperation: (state: IParserState, leftOperand: ts.Expression, isMultiline: boolean) => IParseResult<ts.Expression>;
export declare const parseBinary: (state: IParserState, leftOperand: ts.Expression, isMultiline: boolean) => IParseResult<ts.Expression>;
export declare const parseCall: (state: IParserState, leftOperand: ts.Expression) => IParseResult<ts.Expression>;
export declare const parseIndexer: (state: IParserState, leftOperand: ts.Expression) => IParseResult<ts.Expression>;
export declare const parseGetOperation: (state: IParserState, leftOperand: ts.Expression) => IParseResult<ts.Expression>;
export declare const parseOperand: (state: IParserState) => IParseResult<ts.Expression>;
export declare const createCorrectIdentifierOperand: (operandText: string) => ts.Expression;
export declare const parseTemplateLiteral: (state: IParserState, openTokens: CodeTokenType[], breakTokens: CodeTokenType[]) => IParseResult<ts.Expression>;
export declare const parseParenthesizedExpression: (state: IParserState) => IParseResult<ts.ParenthesizedExpression>;
export declare const parseArrayLiteral: (state: IParserState) => IParseResult<ts.ArrayLiteralExpression>;
export declare const parseScope: (state: IParserState, openTokens: CodeTokenType[], closeTokens: CodeTokenType[]) => IParseResult<ts.Expression[]>;
export declare const parseBinaryOperator: (state: IParserState) => IParseResult<ts.BinaryOperator>;
export declare const parseWord: (state: IParserState) => IParseResult<string>;
export declare const parseNumber: (state: IParserState) => IParseResult<number>;
export declare const parseStringLiteral: (state: IParserState, openTokens: CodeTokenType[], breakTokens: CodeTokenType[]) => IParseResult<string>;
export declare const readString: (state: IParserState, breakTokens: CodeTokenType[], trimString?: boolean) => IParseResult<string>;
export declare const readWhitespace: (state: IParserState) => IParseResult<string>;
export declare const readTokensAsString: (state: IParserState, tokenTypes: CodeTokenType[]) => IParseResult<string>;
export declare const isEndOfFile: (state: IParserState, offset?: number) => boolean;
export declare const addItemToArray: <T = any>(source: T[], item: T) => T[];
export declare const addItemToHash: <T = any>(source: IHash<T>, key: string, item: T) => IHash<T>;
export declare const getToken: (state: IParserState, offset?: number) => ICodeToken;
export declare const getTokenOfType: (state: IParserState, types: CodeTokenType[], offset?: number) => ICodeToken;
export declare const getCursorPosition: (state: IParserState) => ISymbolPosition;
export declare const skipWhitespace: (state: IParserState, multiline?: boolean) => IParserState;
export declare const skipTokenOfType: (state: IParserState, tokenTypes: CodeTokenType[]) => IParserState;
export declare const skipTokensOfType: (state: IParserState, tokenTypes: CodeTokenType[]) => IParserState;
export declare const skipUntil: (state: IParserState, tokenTypes: CodeTokenType[]) => IParserState;
export declare const checkTokenSequence: (state: IParserState, tokenTypes: CodeTokenType[]) => boolean;
export declare const skipTokens: (state: IParserState, tokensCount: number) => IParserState;
