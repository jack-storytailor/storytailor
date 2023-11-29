import { ICodeToken } from "../shared/ICodeToken";
import { ISymbolPosition } from "../shared/ISymbolPosition";
import { IHash } from "../shared/IHash";
import { CodeTokenType, CodeTokenTypeSequence } from "../shared/CodeTokenType";
import { ParsingErrorType, IDiagnostic } from "../shared/IParsingError";
import { KeywordType } from "../ast/KeywordType";
import { OperatorType } from "../ast/OperatorType";
import { IAstToken, IAstOperator, IAstKeyword, IAstModule, IAstNode, IAstCommentLine, IAstCommentBlock, IAstNumber, IAstString, IAstStringIncludeStatement, IAstBoolean, IAstArray, IAstIdentifier, IAstIdentifierScope, IAstRawIdentifier, IAstFunctionDeclaration, IAstVariableDeclaration, IAstPropertyDeclaration, IAstBreakStatement, IAstReturnStatement, IAstContinueStatement, IAstBlockStatement, IAstIfStatement, IAstSwitchStatement, IAstCaseStatement, IAstDoWhileStatement, IAstWhileStatement, IAstForStatement, IAstForInStatement, IAstImportStatement, IAstParenExpression, IAstObjectExpression, IAstCallExpression, IAstIndexerExpression, IAstUpdateExpression, IAstBinaryExpression, IAstMemberExpression, IAstOuterStatement, IAstTextLineStatement, IAstObjectLineStatement, IAstPrototypeExpression, IAstScope, IAstTokenSequence, IAstConditionalExpression, IAstTag, IAstTryStatement, IAstCatchStatement, IAstFinallyStatement, IAstNewExpression, IAstThrowStatement, IAstDebuggerKeyword, IAstDeleteExpression, IAstDeleteLineExpression, IAstContextIdentifier, IAstTypeofExpression } from "../ast/IAstNode";
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
export declare const defaultParserConfig: IParserConfig;
export declare const parseModule: (tokens: ICodeToken[], modulePath: string, config: IParserConfig) => IParseResult<IAstModule>;
export declare const parseModuleContent: (state: IParserState) => IParseResult<IAstNode>;
export declare const parseToken: (state: IParserState) => IParseResult<IAstToken>;
export declare const parseOperator: (state: IParserState) => IParseResult<IAstOperator>;
export declare const parseOperatorOfType: (state: IParserState, operatorTypes: OperatorType[]) => IParseResult<IAstOperator>;
export declare const parseBinaryOperator: (state: IParserState) => IParseResult<IAstOperator>;
export declare const parseUnaryOperatorPrefix: (state: IParserState) => IParseResult<IAstOperator>;
export declare const parseUnaryOperatorPostfix: (state: IParserState) => IParseResult<IAstOperator>;
export declare const parseKeyword: (state: IParserState) => IParseResult<IAstKeyword>;
export declare const parseDebuggerKeyword: (state: IParserState) => IParseResult<IAstDebuggerKeyword>;
export declare const parseKeywordOfType: (state: IParserState, keywordTypes: KeywordType[]) => IParseResult<IAstKeyword>;
export declare const parseCommentLine: (state: IParserState) => IParseResult<IAstCommentLine>;
export declare const parseCommentBlock: (state: IParserState) => IParseResult<IAstCommentBlock>;
export declare const parseLiteral: (state: IParserState) => IParseResult<IAstNode>;
export declare const parseNumberLiteral: (state: IParserState) => IParseResult<IAstNumber>;
export declare const parseStringLiteral: (state: IParserState, allowIncludes?: boolean) => IParseResult<IAstString>;
export declare const parseStringLiteralItem: (state: IParserState, allowIncludes?: boolean) => IParseResult<IAstNode>;
export declare const parseStringInclude: (state: IParserState) => IParseResult<IAstStringIncludeStatement>;
export declare const parseBooleanLiteral: (state: IParserState) => IParseResult<IAstBoolean>;
export declare const parseArrayLiteral: (state: IParserState) => IParseResult<IAstArray>;
export declare const parseArrayItem: (state: IParserState) => IParseResult<IAstNode>;
export declare const parseIdentifier: (state: IParserState) => IParseResult<IAstIdentifier>;
export declare const parseIdentifierScope: (state: IParserState) => IParseResult<IAstIdentifierScope>;
export declare const parseRawIdentifier: (state: IParserState) => IParseResult<IAstRawIdentifier>;
export declare const parseAnyIdentifier: (state: IParserState) => IParseResult<IAstNode>;
export declare const parseContextIdentifier: (state: IParserState) => IParseResult<IAstContextIdentifier>;
/**
 * Operand identifier means: if no '@' symbol before identifier, it's context identifier (context['identifier'])
 */
export declare const parseOperandIdentifier: (state: IParserState) => IParseResult<IAstNode>;
export declare const parseFunctionDeclaration: (state: IParserState, isMultiline: boolean) => IParseResult<IAstFunctionDeclaration>;
export declare const parseVariableDeclaration: (state: IParserState, isMultiline: boolean) => IParseResult<IAstVariableDeclaration>;
export declare const parsePropertyDeclaration: (state: IParserState) => IParseResult<IAstPropertyDeclaration>;
export declare const parseStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstNode>;
export declare const parseBreakStatement: (state: IParserState) => IParseResult<IAstBreakStatement>;
export declare const parseReturnStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstReturnStatement>;
export declare const parseDeleteExpression: (state: IParserState, isMultiline: boolean) => IParseResult<IAstDeleteExpression>;
export declare const parseTypeofExpression: (state: IParserState, isMultiline: boolean) => IParseResult<IAstTypeofExpression>;
export declare const parseContinueStatement: (state: IParserState) => IParseResult<IAstContinueStatement>;
export declare const parseBlockStatement: (state: IParserState) => IParseResult<IAstBlockStatement>;
export declare const parseIfStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstIfStatement>;
export declare const parseSwitchStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstSwitchStatement>;
export declare const parseCaseStatement: (state: IParserState) => IParseResult<IAstCaseStatement>;
export declare const parseDefaultCaseStatement: (state: IParserState) => IParseResult<IAstCaseStatement>;
export declare const parseDoWhileStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstDoWhileStatement>;
export declare const parseWhileStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstWhileStatement>;
export declare const parseForStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstForStatement>;
export declare const parseForCoditions: (state: IParserState) => IParseResult<{
    init: IAstNode;
    test: IAstNode;
    update: IAstNode;
}>;
export declare const parseConditionBlock: (state: IParserState) => IParseResult<IAstNode>;
export declare const parseForInConditions: (state: IParserState) => IParseResult<{
    variable: IAstNode;
    expression: IAstNode;
}>;
export declare const parseForInStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstForInStatement>;
export declare const parseImportStatement: (state: IParserState) => IParseResult<IAstImportStatement>;
export declare const parseImportPath: (state: IParserState) => IParseResult<IAstNode>;
export declare const parseTryStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstTryStatement>;
export declare const parseCatchStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstCatchStatement>;
export declare const parseFinallyStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstFinallyStatement>;
export declare const parseThrowStatement: (state: IParserState, isMultiline: boolean) => IParseResult<IAstThrowStatement>;
export declare const parseExpression: (state: IParserState, isMultiline: boolean) => IParseResult<IAstNode>;
export declare const parseOperand: (state: IParserState) => IParseResult<IAstNode>;
export declare const parseOperation: (state: IParserState, leftOperand: IAstNode, isMultiline: boolean) => IParseResult<IAstNode>;
export declare const parseParenExpression: (state: IParserState) => IParseResult<IAstParenExpression>;
export declare const parseObjectExpression: (state: IParserState) => IParseResult<IAstObjectExpression>;
export declare const parseCallExpression: (state: IParserState, leftOperand: IAstNode, isMultiline: boolean) => IParseResult<IAstCallExpression>;
export declare const parseCallArguments: (state: IParserState) => IParseResult<IAstNode[]>;
export declare const parseIndexerExpression: (state: IParserState, leftOperand: IAstNode, isMultiline: boolean) => IParseResult<IAstIndexerExpression>;
export declare const parseUpdateExpressionPostfix: (state: IParserState, leftOperand: IAstNode) => IParseResult<IAstUpdateExpression>;
export declare const parseBinaryExpression: (state: IParserState, leftOperand: IAstNode, isMultiline: boolean) => IParseResult<IAstBinaryExpression>;
export declare const parseMemberExpression: (state: IParserState, leftOperand: IAstNode, isMultiline: boolean) => IParseResult<IAstMemberExpression>;
export declare const parseConditionalExpression: (state: IParserState, condition: IAstNode, isMultiline: boolean) => IParseResult<IAstConditionalExpression>;
export declare const parseNewExpression: (state: IParserState, isMultiline: boolean) => IParseResult<IAstNewExpression>;
export declare const parseOuterStatement: (state: IParserState) => IParseResult<IAstOuterStatement>;
export declare const parseOuterStatementContent: (state: IParserState) => IParseResult<IAstNode>;
export declare const parseTextLineStatement: (state: IParserState) => IParseResult<IAstTextLineStatement>;
export declare const parseObjectLine: (state: IParserState) => IParseResult<IAstObjectLineStatement>;
export declare const parseDeleteLineExpression: (state: IParserState) => IParseResult<IAstDeleteLineExpression>;
export declare const parsePrototypeExpression: (state: IParserState) => IParseResult<IAstPrototypeExpression>;
export declare const parseTag: (state: IParserState) => IParseResult<IAstTag>;
export declare const parseScope: (state: IParserState, openFilter: (stat: IParserState) => IParseResult<IAstNode>, itemFilter: (stat: IParserState) => IParseResult<IAstNode>, closeFilter: (stat: IParserState) => IParseResult<IAstNode>, skipOptional?: (stat: IParserState) => IParserState, breakFilter?: (stat: IParserState) => boolean, separatorFilter?: (stat: IParserState) => IParseResult<IAstNode>) => IParseResult<IAstScope>;
export declare const parseErrorTokens: (state: IParserState, filter: (state: IParserState) => boolean) => IParserState;
export declare const readString: (state: IParserState, breakTokens: CodeTokenType[], trimString?: boolean) => IParseResult<string>;
export declare const readWhitespace: (state: IParserState) => IParseResult<string>;
export declare const calcIndentFromWhitespace: (whitespace: string) => number;
export declare const readTokensAsString: (state: IParserState, tokenTypes: CodeTokenType[]) => IParseResult<string>;
export declare const isEndOfFile: (state: IParserState, offset?: number) => boolean;
export declare const addItemToArray: <T = any>(source: T[], item: T) => T[];
export declare const addItemToHash: <T = any>(source: IHash<T>, key: string, item: T) => IHash<T>;
export declare const getToken: (state: IParserState, offset?: number) => ICodeToken;
export declare const getTokenOfType: (state: IParserState, types: CodeTokenType[], offset?: number) => ICodeToken;
export declare const getCursorPosition: (state: IParserState) => ISymbolPosition;
export declare const skipComments: (state: IParserState, isSkipWhitespace?: boolean, isMultiline?: boolean) => IParserState;
export declare const skipCommentLine: (state: IParserState) => IParserState;
export declare const skipCommentBlock: (state: IParserState) => IParserState;
export declare const skipWhitespace: (state: IParserState, multiline?: boolean) => IParserState;
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
export declare const prepareTokens: (tokens: ICodeToken[]) => ICodeToken[];
