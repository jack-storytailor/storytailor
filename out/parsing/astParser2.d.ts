import { ICodeToken } from "../shared/ICodeToken";
import { ISymbolPosition } from "../shared/ISymbolPosition";
import { IHash } from "../shared/IHash";
import { CodeTokenType } from "../shared/CodeTokenType";
import { ParsingErrorType, IDiagnostic } from "../shared/IParsingError";
import { KeywordType } from "../ast/KeywordType";
import { OperatorType } from "../ast/OperatorType";
import { IAstToken, IAstOperator, IAstKeyword, IAstModule, IAstNode, IAstCommentLine, IAstCommentBlock, IAstNumberLiteral, IAstStringLiteral, IAstStringIncludeStatement, IAstBooleanLiteral, IAstArrayLiteral, IAstIdentifier, IAstIdentifierScope, IAstRawIdentifier, IAstFunctionDeclaration, IAstVariableDeclaration, IAstPropertyDeclaration, IAstBreakStatement, IAstReturnStatement, IAstContinueStatement, IAstBlockStatement, IAstIfStatement, IAstSwitchStatement, IAstCaseStatement, IAstDoWhileStatement, IAstWhileStatement, IAstForStatement, IAstForInStatement, IAstImportStatement, IAstImportPathStatement, IAstImportPathItem, IAstParenExpression, IAstObjectExpression, IAstCallExpression, IAstIndexerExpression, IAstUpdateExpression, IAstBinaryExpression, IAstMemberExpression, IAstOuterStatement, IAstTextLineStatement, IAstObjectLineStatement, IAstPrototypeExpression, IAstScope, IAstTokenSequence, IAstConditionalExpression, IAstTag, IAstTryStatement, IAstCatchStatement, IAstFinallyStatement, IAstNewExpression, IAstThrowStatement, IAstDebuggerKeyword, IAstDeleteExpression, IAstDeleteLineExpression } from "../ast/IAstNode";
export interface IParserState2 {
    tokens: ICodeToken[];
    cursor: number;
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
    errors: IDiagnostic[];
    indent: number;
}
export interface IParseResult<TResult = any> {
    state: IParserState2;
    result: TResult;
}
export declare const parseModule: (tokens: ICodeToken[], modulePath: string) => IParseResult<IAstModule>;
export declare const parseModuleContent: (state: IParserState2) => IParseResult<IAstNode>;
export declare const parseToken: (state: IParserState2) => IParseResult<IAstToken>;
export declare const parseOperator: (state: IParserState2) => IParseResult<IAstOperator>;
export declare const parseOperatorOfType: (state: IParserState2, operatorTypes: OperatorType[]) => IParseResult<IAstOperator>;
export declare const parseBinaryOperator: (state: IParserState2) => IParseResult<IAstOperator>;
export declare const parseUnaryOperatorPrefix: (state: IParserState2) => IParseResult<IAstOperator>;
export declare const parseUnaryOperatorPostfix: (state: IParserState2) => IParseResult<IAstOperator>;
export declare const parseKeyword: (state: IParserState2) => IParseResult<IAstKeyword>;
export declare const parseDebuggerKeyword: (state: IParserState2) => IParseResult<IAstDebuggerKeyword>;
export declare const parseKeywordOfType: (state: IParserState2, keywordTypes: KeywordType[]) => IParseResult<IAstKeyword>;
export declare const parseCommentLine: (state: IParserState2) => IParseResult<IAstCommentLine>;
export declare const parseCommentBlock: (state: IParserState2) => IParseResult<IAstCommentBlock>;
export declare const parseLiteral: (state: IParserState2) => IParseResult<IAstNode>;
export declare const parseNumberLiteral: (state: IParserState2) => IParseResult<IAstNumberLiteral>;
export declare const parseStringLiteral: (state: IParserState2) => IParseResult<IAstStringLiteral>;
export declare const parseStringLiteralItem: (state: IParserState2) => IParseResult<IAstNode>;
export declare const parseStringInclude: (state: IParserState2) => IParseResult<IAstStringIncludeStatement>;
export declare const parseBooleanLiteral: (state: IParserState2) => IParseResult<IAstBooleanLiteral>;
export declare const parseArrayLiteral: (state: IParserState2) => IParseResult<IAstArrayLiteral>;
export declare const parseArrayItem: (state: IParserState2) => IParseResult<IAstNode>;
export declare const parseIdentifier: (state: IParserState2) => IParseResult<IAstIdentifier>;
export declare const parseIdentifierScope: (state: IParserState2) => IParseResult<IAstIdentifierScope>;
export declare const parseRawIdentifier: (state: IParserState2) => IParseResult<IAstRawIdentifier>;
export declare const parseAnyIdentifier: (state: IParserState2) => IParseResult<IAstNode>;
export declare const parseFunctionDeclaration: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstFunctionDeclaration>;
export declare const parseVariableDeclaration: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstVariableDeclaration>;
export declare const parsePropertyDeclaration: (state: IParserState2) => IParseResult<IAstPropertyDeclaration>;
export declare const parseStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstNode>;
export declare const parseBreakStatement: (state: IParserState2) => IParseResult<IAstBreakStatement>;
export declare const parseReturnStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstReturnStatement>;
export declare const parseDeleteExpression: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstDeleteExpression>;
export declare const parseContinueStatement: (state: IParserState2) => IParseResult<IAstContinueStatement>;
export declare const parseBlockStatement: (state: IParserState2) => IParseResult<IAstBlockStatement>;
export declare const parseIfStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstIfStatement>;
export declare const parseSwitchStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstSwitchStatement>;
export declare const parseCaseStatement: (state: IParserState2) => IParseResult<IAstCaseStatement>;
export declare const parseDefaultCaseStatement: (state: IParserState2) => IParseResult<IAstCaseStatement>;
export declare const parseDoWhileStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstDoWhileStatement>;
export declare const parseWhileStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstWhileStatement>;
export declare const parseForStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstForStatement>;
export declare const parseForCoditions: (state: IParserState2) => IParseResult<{
    init: IAstNode;
    test: IAstNode;
    update: IAstNode;
}>;
export declare const parseConditionBlock: (state: IParserState2) => IParseResult<IAstNode>;
export declare const parseForInConditions: (state: IParserState2) => IParseResult<{
    variable: IAstNode;
    expression: IAstNode;
}>;
export declare const parseForInStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstForInStatement>;
export declare const parseImportStatement: (state: IParserState2) => IParseResult<IAstImportStatement>;
export declare const parseImportPath: (state: IParserState2) => IParseResult<IAstImportPathStatement>;
export declare const parseImportPathItem: (state: IParserState2) => IParseResult<IAstImportPathItem>;
export declare const parseTryStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstTryStatement>;
export declare const parseCatchStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstCatchStatement>;
export declare const parseFinallyStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstFinallyStatement>;
export declare const parseThrowStatement: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstThrowStatement>;
export declare const parseExpression: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstNode>;
export declare const parseOperand: (state: IParserState2) => IParseResult<IAstNode>;
export declare const parseOperation: (state: IParserState2, leftOperand: IAstNode, isMultiline: boolean) => IParseResult<IAstNode>;
export declare const parseParenExpression: (state: IParserState2) => IParseResult<IAstParenExpression>;
export declare const parseObjectExpression: (state: IParserState2) => IParseResult<IAstObjectExpression>;
export declare const parseCallExpression: (state: IParserState2, leftOperand: IAstNode, isMultiline: boolean) => IParseResult<IAstCallExpression>;
export declare const parseCallArguments: (state: IParserState2) => IParseResult<IAstNode[]>;
export declare const parseIndexerExpression: (state: IParserState2, leftOperand: IAstNode, isMultiline: boolean) => IParseResult<IAstIndexerExpression>;
export declare const parseUpdateExpressionPostfix: (state: IParserState2, leftOperand: IAstNode) => IParseResult<IAstUpdateExpression>;
export declare const parseBinaryExpression: (state: IParserState2, leftOperand: IAstNode, isMultiline: boolean) => IParseResult<IAstBinaryExpression>;
export declare const parseMemberExpression: (state: IParserState2, leftOperand: IAstNode, isMultiline: boolean) => IParseResult<IAstMemberExpression>;
export declare const parseConditionalExpression: (state: IParserState2, condition: IAstNode, isMultiline: boolean) => IParseResult<IAstConditionalExpression>;
export declare const parseNewExpression: (state: IParserState2, isMultiline: boolean) => IParseResult<IAstNewExpression>;
export declare const parseOuterStatement: (state: IParserState2) => IParseResult<IAstOuterStatement>;
export declare const parseOuterStatementContent: (state: IParserState2) => IParseResult<IAstNode>;
export declare const parseTextLineStatement: (state: IParserState2) => IParseResult<IAstTextLineStatement>;
export declare const parseObjectLine: (state: IParserState2) => IParseResult<IAstObjectLineStatement>;
export declare const parseDeleteLineExpression: (state: IParserState2) => IParseResult<IAstDeleteLineExpression>;
export declare const parsePrototypeExpression: (state: IParserState2) => IParseResult<IAstPrototypeExpression>;
export declare const parseTag: (state: IParserState2) => IParseResult<IAstTag>;
export declare const parseScope: (state: IParserState2, openFilter: (stat: IParserState2) => IParseResult<IAstNode>, itemFilter: (stat: IParserState2) => IParseResult<IAstNode>, closeFilter: (stat: IParserState2) => IParseResult<IAstNode>, skipOptional?: (stat: IParserState2) => IParserState2) => IParseResult<IAstScope>;
export declare const parseErrorTokens: (state: IParserState2, filter: (state: IParserState2) => boolean) => IParserState2;
export declare const readString: (state: IParserState2, breakTokens: CodeTokenType[], trimString?: boolean) => IParseResult<string>;
export declare const readWhitespace: (state: IParserState2) => IParseResult<string>;
export declare const readTokensAsString: (state: IParserState2, tokenTypes: CodeTokenType[]) => IParseResult<string>;
export declare const isEndOfFile: (state: IParserState2, offset?: number) => boolean;
export declare const addItemToArray: <T = any>(source: T[], item: T) => T[];
export declare const addItemToHash: <T = any>(source: IHash<T>, key: string, item: T) => IHash<T>;
export declare const getToken: (state: IParserState2, offset?: number) => ICodeToken;
export declare const getTokenOfType: (state: IParserState2, types: CodeTokenType[], offset?: number) => ICodeToken;
export declare const getCursorPosition: (state: IParserState2) => ISymbolPosition;
export declare const skipComments: (state: IParserState2, isSkipWhitespace?: boolean, isMultiline?: boolean) => IParserState2;
export declare const skipCommentLine: (state: IParserState2) => IParserState2;
export declare const skipCommentBlock: (state: IParserState2) => IParserState2;
export declare const skipWhitespace: (state: IParserState2, multiline?: boolean) => IParserState2;
export declare const skipTokenOfType: (state: IParserState2, tokenTypes: CodeTokenType[]) => IParserState2;
export declare const skipTokensOfType: (state: IParserState2, tokenTypes: CodeTokenType[]) => IParserState2;
export declare const skipUntil: (state: IParserState2, tokenTypes: CodeTokenType[]) => IParserState2;
export declare const checkTokenSequence: (state: IParserState2, tokenTypes: CodeTokenType[]) => boolean;
export declare const parseTokenSequence: (state: IParserState2, tokenTypes: CodeTokenType[]) => IParseResult<IAstTokenSequence>;
export declare const checkTokenSequences: (state: IParserState2, sequences: CodeTokenType[][]) => CodeTokenType[];
export declare const parseTokenSequences: (state: IParserState2, sequences: CodeTokenType[][]) => IParseResult<{
    tokens: CodeTokenType[];
    sequence: IAstTokenSequence;
}>;
export declare const skipTokens: (state: IParserState2, tokensCount: number) => IParserState2;
export declare const addParsingError: (state: IParserState2, severity: ParsingErrorType, message: string, start: ISymbolPosition, end: ISymbolPosition, code?: string | number, source?: string) => IParserState2;
export declare const addInvalidTokenError: (state: IParserState2, token: ICodeToken) => IParserState2;
export declare const prepareTokens: (tokens: ICodeToken[]) => ICodeToken[];
