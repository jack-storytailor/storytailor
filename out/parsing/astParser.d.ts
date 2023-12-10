import { ICodeToken } from "../shared/ICodeToken";
import { ISymbolPosition } from "../shared/ISymbolPosition";
import { IHash } from "../shared/IHash";
import { CodeTokenType, CodeTokenTypeSequence } from "../shared/CodeTokenType";
import { ParsingErrorType, IDiagnostic } from "../shared/IParsingError";
import { KeywordType } from "../ast/KeywordType";
import { OperatorType } from "../ast/OperatorType";
import { IAstToken, IAstOperator, IAstKeyword, IAstModule, IAstNode, IAstCommentLine, IAstCommentBlock, IAstNumber, IAstString, IAstStringIncludeStatement, IAstBoolean, IAstArray, IAstIdentifier, IAstIdentifierScope, IAstRawIdentifier, IAstPropertyDeclaration, IAstBreakStatement, IAstContinueStatement, IAstBlockStatement, IAstIfStatement, IAstSwitchStatement, IAstCaseStatement, IAstDoWhileStatement, IAstWhileStatement, IAstForStatement, IAstForInStatement, IAstImportStatement, IAstParenExpression, IAstObject, IAstCallExpression, IAstIndexerExpression, IAstUpdateExpression, IAstBinaryExpression, IAstMemberExpression, IAstOuterStatement, IAstTextLineStatement, IAstObjectLineStatement, IAstScope, IAstTokenSequence, IAstConditionalExpression, IAstTryStatement, IAstCatchStatement, IAstFinallyStatement, IAstThrowStatement, IAstDebuggerKeyword, IAstDeleteLineExpression, IAstContextIdentifier, IAstRegexLiteral, IAstVariableDeclaration, IAstImportItem, IAstClassDeclaration, IAstKeywordNode, IAstDeconstructingAssignment } from "../ast/IAstNode";
import { ISymbol } from "../ast/ISymbol";
export interface IParserSymbols {
    symbols: IHash<ISymbol>;
    currentId?: string;
    currentName?: string;
    currentFullName?: string[];
}
export interface IParserState {
    tokens: ICodeToken[];
    cursor: number;
    errors: IDiagnostic[];
    indent: number;
    imports: IAstImportStatement[];
    symbols: IParserSymbols;
}
export interface IParseResult<TResult = any> {
    state: IParserState;
    result: TResult;
}
export interface IParserConfig {
    indentSize: number;
}
export interface IParserOptions {
    isMultiline: boolean;
    allowContextIdentifiers: boolean;
}
export declare const defaultParserConfig: IParserConfig;
export type ParserFunction = (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseModule: (tokens: ICodeToken[], modulePath: string, config: IParserConfig) => IParseResult<IAstModule>;
export declare const parseRootStatement: (state: IParserState) => IParseResult<IAstNode>;
export declare const parseOuterStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstOuterStatement>;
export declare const parseOuterStatementContent: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseObjectLine: (state: IParserState, options: IParserOptions) => IParseResult<IAstObjectLineStatement>;
export declare const parseDeleteLineExpression: (state: IParserState, options: IParserOptions) => IParseResult<IAstDeleteLineExpression>;
export declare const parseTextLineStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstTextLineStatement>;
export declare const parseStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseExportStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstKeywordNode>;
export declare const parseStaticStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstKeywordNode>;
export declare const parseBreakStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstBreakStatement>;
export declare const parseReturnStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstKeywordNode>;
export declare const parseContinueStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstContinueStatement>;
export declare const parseIfStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstIfStatement>;
export declare const parseSwitchStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstSwitchStatement>;
export declare const parseCaseStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstCaseStatement>;
export declare const parseDefaultCaseStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstCaseStatement>;
export declare const parseDoWhileStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstDoWhileStatement>;
export declare const parseWhileStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstWhileStatement>;
export declare const parseForStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstForStatement>;
export declare const parseForCoditions: (state: IParserState, options: IParserOptions) => IParseResult<{
    init: IAstNode;
    test: IAstNode;
    update: IAstNode;
}>;
export declare const parseConditionBlock: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseForInConditions: (state: IParserState, options: IParserOptions) => IParseResult<{
    variable: IAstNode;
    expression: IAstNode;
}>;
export declare const parseForOfConditions: (state: IParserState, options: IParserOptions) => IParseResult<{
    variable: IAstNode;
    expression: IAstNode;
}>;
export declare const parseForInStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstForInStatement>;
export declare const parseForOfStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstForInStatement>;
export declare const parseImportStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstImportStatement>;
export declare const parseImportPath: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseRawImportStatement: (state: IParserState, options: IParserOptions) => {
    state: IParserState;
    result: import("../ast/IAstNode").IAstRawImportStatement;
};
export declare const parseImportItem: (state: IParserState, options: IParserOptions) => IParseResult<IAstImportItem>;
export declare const parseTryStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstTryStatement>;
export declare const parseCatchStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstCatchStatement>;
export declare const parseFinallyStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstFinallyStatement>;
export declare const parseThrowStatement: (state: IParserState, options: IParserOptions) => IParseResult<IAstThrowStatement>;
export declare const parseOperator: (state: IParserState, options: IParserOptions) => IParseResult<IAstOperator>;
export declare const parseOperatorOfType: (state: IParserState, options: IParserOptions, operatorTypes: OperatorType[]) => IParseResult<IAstOperator>;
export declare const parseBinaryOperator: (state: IParserState, options: IParserOptions) => IParseResult<IAstOperator>;
export declare const parseUnaryOperatorPrefix: (state: IParserState, options: IParserOptions) => IParseResult<IAstOperator>;
export declare const parseUnaryOperatorPostfix: (state: IParserState, options: IParserOptions) => IParseResult<IAstOperator>;
export declare const parseKeyword: (state: IParserState, options: IParserOptions) => IParseResult<IAstKeyword>;
export declare const parseDebuggerKeyword: (state: IParserState, options: IParserOptions) => IParseResult<IAstDebuggerKeyword>;
export declare const parseKeywordOfType: (state: IParserState, options: IParserOptions, keywordTypes: KeywordType[]) => IParseResult<IAstKeyword>;
export declare const parseCommentLine: (state: IParserState, options: IParserOptions) => IParseResult<IAstCommentLine>;
export declare const parseCommentBlock: (state: IParserState, options: IParserOptions) => IParseResult<IAstCommentBlock>;
export declare const parseRawCodeBlock: (state: IParserState, options: IParserOptions) => IParseResult<IAstBlockStatement>;
export declare const parseRegularCodeBlock: (state: IParserState, options: IParserOptions) => IParseResult<IAstBlockStatement>;
export declare const parseCodeBlock: (state: IParserState, options: IParserOptions) => IParseResult<IAstBlockStatement>;
export declare const parseFunctionParameters: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode[]>;
export declare const parseObjectLineTags: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode[]>;
export declare const parseLiteral: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseNumberLiteral: (state: IParserState, options: IParserOptions) => IParseResult<IAstNumber>;
export declare const parseStringLiteral: (state: IParserState, options: IParserOptions, allowIncludes?: boolean) => IParseResult<IAstString>;
export declare const parseStringLiteralItem: (state: IParserState, options: IParserOptions, allowIncludes?: boolean) => IParseResult<IAstNode>;
export declare const parseStringInclude: (state: IParserState, options: IParserOptions) => IParseResult<IAstStringIncludeStatement>;
export declare const parseBooleanLiteral: (state: IParserState, options: IParserOptions) => IParseResult<IAstBoolean>;
export declare const parseRegexLiteral: (state: IParserState, options: IParserOptions) => IParseResult<IAstRegexLiteral>;
export declare const parseRegexParenScope: (state: IParserState, options: IParserOptions) => IParseResult<{
    value: string;
    nextToken: ICodeToken;
}>;
export declare const parseArrayLiteral: (state: IParserState, options: IParserOptions, allowEmptyItems: boolean) => IParseResult<IAstArray>;
export declare const parseArrayElement: (state: IParserState, options: IParserOptions, allowEmptyItems: boolean) => IParseResult<IAstNode>;
export declare const parseObject: (state: IParserState, options: IParserOptions) => IParseResult<IAstObject>;
export declare const parseObjectLiteralItem: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseObjectProperty: (state: IParserState, options: IParserOptions) => IParseResult<IAstPropertyDeclaration>;
export declare const parseFunction: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseGetterSetter: (state: IParserState, options: IParserOptions) => IParseResult<IAstKeywordNode>;
export declare const parseIdentifier: (state: IParserState, options: IParserOptions) => IParseResult<IAstIdentifier | IAstIdentifierScope>;
export declare const parseIdentifierScope: (state: IParserState, options: IParserOptions) => IParseResult<IAstIdentifierScope>;
export declare const parseObjectLineIdentifier: (state: IParserState, options: IParserOptions) => IParseResult<IAstIdentifier>;
export declare const parseRawIdentifier: (state: IParserState, options: IParserOptions) => IParseResult<IAstRawIdentifier>;
export declare const parseAnyIdentifier: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseContextIdentifier: (state: IParserState, options: IParserOptions) => IParseResult<IAstContextIdentifier>;
/**
 * Operand identifier means: if no '@' symbol before identifier, it's context identifier (context['identifier'])
 */
export declare const parseOperandIdentifier: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseClassDeclaration: (state: IParserState, options: IParserOptions) => IParseResult<IAstClassDeclaration>;
export declare const parseClassMember: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseDeconstructionAssignment: (state: IParserState, options: IParserOptions) => IParseResult<IAstDeconstructingAssignment>;
export declare const parseVariableDeclaration: (state: IParserState, options: IParserOptions) => IParseResult<IAstVariableDeclaration>;
export declare const parseExpression: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseKeywordExpression: (state: IParserState, options: IParserOptions) => IParseResult<IAstKeywordNode>;
export declare const parseOperationExpression: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseOperand: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseOperation: (state: IParserState, leftOperand: IAstNode, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseParenExpression: (state: IParserState, options: IParserOptions) => IParseResult<IAstParenExpression>;
export declare const parseCallExpression: (state: IParserState, leftOperand: IAstNode, options: IParserOptions) => IParseResult<IAstCallExpression>;
export declare const parseCallArguments: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode[]>;
export declare const parseIndexerExpression: (state: IParserState, leftOperand: IAstNode, options: IParserOptions) => IParseResult<IAstIndexerExpression>;
export declare const parseUpdateExpressionPostfix: (state: IParserState, leftOperand: IAstNode, options: IParserOptions) => IParseResult<IAstUpdateExpression>;
export declare const parseBinaryExpression: (state: IParserState, leftOperand: IAstNode, options: IParserOptions) => IParseResult<IAstBinaryExpression>;
export declare const parseMemberExpression: (state: IParserState, leftOperand: IAstNode, options: IParserOptions) => IParseResult<IAstMemberExpression>;
export declare const parseConditionalExpression: (state: IParserState, condition: IAstNode, options: IParserOptions) => IParseResult<IAstConditionalExpression>;
export declare const parseNewExpression: (state: IParserState, options: IParserOptions) => IParseResult<IAstKeywordNode>;
export declare const parseAwaitExpression: (state: IParserState, options: IParserOptions) => IParseResult<IAstKeywordNode>;
export declare const parseYieldExpression: (state: IParserState, options: IParserOptions) => IParseResult<IAstKeywordNode>;
export declare const parseDeleteExpression: (state: IParserState, options: IParserOptions) => IParseResult<IAstKeywordNode>;
export declare const parseTypeofExpression: (state: IParserState, options: IParserOptions) => IParseResult<IAstKeywordNode>;
export declare const parseTag: (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;
export declare const parseNode: (state: IParserState, options: IParserOptions, parsers: ParserFunction[]) => IParseResult<IAstNode>;
export declare const parseKeywordNode: (state: IParserState, isKeywordFirst: boolean, options: IParserOptions, keywords: KeywordType[], parsers: ParserFunction[]) => IParseResult<IAstKeywordNode>;
export declare const parseToken: (state: IParserState) => IParseResult<IAstToken>;
export declare const parseScope: (state: IParserState, openFilter: (stat: IParserState) => IParseResult<IAstNode>, itemFilter: (stat: IParserState) => IParseResult<IAstNode>, closeFilter: (stat: IParserState) => IParseResult<IAstNode>, skipOptional?: (stat: IParserState) => IParserState, breakFilter?: (stat: IParserState) => boolean, separatorFilter?: (stat: IParserState) => IParseResult<IAstNode>) => IParseResult<IAstScope>;
export declare const parseErrorTokens: (state: IParserState, endSequence: (state: IParserState) => boolean) => IParserState;
export declare const readString: (state: IParserState, breakTokens: CodeTokenType[], trimString?: boolean) => IParseResult<string>;
export declare const readWhitespace: (state: IParserState) => IParseResult<string>;
export declare const calcIndentFromWhitespace: (whitespace: string) => number;
export declare const readTokensAsString: (state: IParserState, tokenTypes: CodeTokenType[]) => IParseResult<string>;
export declare const isEndOfFile: (state: IParserState, offset?: number) => boolean;
export declare const isValidJsIdentifier: (variableName: string) => boolean;
export declare const addItemToArray: <T = any>(source: T[], item: T) => T[];
export declare const addItemToHash: <T = any>(source: IHash<T>, key: string, item: T) => IHash<T>;
export declare const getToken: (state: IParserState, offset?: number) => ICodeToken;
export declare const getTokenOfType: (state: IParserState, types: CodeTokenType[], offset?: number) => ICodeToken;
export declare const getCursorPosition: (state: IParserState) => ISymbolPosition;
export declare const skipComments: (state: IParserState, isSkipWhitespace?: boolean, options?: IParserOptions) => IParserState;
export declare const skipCommentLine: (state: IParserState, options: IParserOptions) => IParserState;
export declare const skipCommentBlock: (state: IParserState, options: IParserOptions) => IParserState;
export declare const skipWhitespace: (state: IParserState, options: IParserOptions) => IParserState;
export declare const skipTokenOfType: (state: IParserState, tokenTypes: CodeTokenType[]) => IParserState;
export declare const skipTokensOfType: (state: IParserState, tokenTypes: CodeTokenType[]) => IParserState;
export declare const skipUntil: (state: IParserState, tokenTypes: CodeTokenType[]) => IParserState;
export declare const checkTokenSequence: (state: IParserState, tokenTypes: CodeTokenType[]) => boolean;
export declare const parseTokenSequence: (state: IParserState, tokenTypes: CodeTokenType[]) => IParseResult<IAstTokenSequence>;
export declare const checkTokenSequences: (state: IParserState, sequences: CodeTokenTypeSequence[]) => CodeTokenTypeSequence;
export declare const parseTokenSequences: (state: IParserState, sequences: CodeTokenTypeSequence[]) => IParseResult<{
    tokens: CodeTokenTypeSequence;
    sequence: IAstTokenSequence;
}>;
export declare const skipTokens: (state: IParserState, tokensCount: number) => IParserState;
export declare const addParsingError: (state: IParserState, severity: ParsingErrorType, message: string, start: ISymbolPosition, end: ISymbolPosition, code?: string | number, source?: string) => IParserState;
export declare const addInvalidTokenError: (state: IParserState, token: ICodeToken) => IParserState;
export declare const addInvalidTokenSequenceError: (state: IParserState, tokens: IAstTokenSequence) => IParserState;
export declare const prepareTokens: (tokens: ICodeToken[]) => ICodeToken[];
export declare const emptyOptions: IParserOptions;
export declare const optionsOuterLine: IParserOptions;
export declare const optionsCodeBlock: IParserOptions;
