import { IAstNode, IAstModule, IAstObjectLineStatement, IAstOuterStatement, IAstBlockStatement, IAstTextLineStatement, IAstNumber, IAstBoolean, IAstIdentifier, IAstString, IAstToken, IAstRawIdentifier, IAstIdentifierScope, IAstBinaryExpression, IAstOperator, IAstMemberExpression, IAstStringIncludeStatement, IAstCallExpression, IAstProgram, IAstIfStatement, IAstWhileStatement, IAstDoWhileStatement, IAstSwitchStatement, IAstCaseStatement, IAstBreakStatement, IAstContinueStatement, IAstParenExpression, IAstImportStatement, IAstPropertyDeclaration, IAstForStatement, IAstForInStatement, IAstArray, IAstObject, IAstUpdateExpression, IAstTokenSequence, IAstKeyword, IAstConditionalExpression, IAstIndexerExpression, IAstTryStatement, IAstCatchStatement, IAstFinallyStatement, IAstDebuggerKeyword, IAstThrowStatement, IAstDeleteLineExpression, IAstContextIdentifier, IAstForOfStatement, IAstRegexLiteral, IAstVariableDeclaration, IAstRawImportStatement, IAstImportItem, IAstClassDeclaration, IAstKeywordNode, IAstFunction as IAstFunction, IAstDeconstructingAssignment } from "../ast/IAstNode";
import { ISymbolPosition } from "../shared/ISymbolPosition";
import { IHash } from "../shared/IHash";
import { JavascriptMode } from "../shared/JavascrptMode";
export interface ISourceMapToken {
    generated: {
        line: number;
        column: number;
    };
    source: string;
    original: {
        line: number;
        column: number;
    };
    name?: string;
}
export interface IIndentScopeItem {
    indent: number;
    identifier: IAstNode;
}
export interface ISourceState {
    fileName: string;
    ast: IAstNode[];
    astIndex: number;
    cursor: ISymbolPosition;
    indent: number;
    indentScope: IIndentScopeItem[];
}
export interface ITargetState {
    fileName: string;
    javascript: string[];
    sourceMaps: ISourceMapToken[];
    cursor: ISymbolPosition;
    indent: number;
}
export interface ICompilerState {
    sourceState: ISourceState;
    targetState: ITargetState;
}
export interface ICompileFileRequest {
    sourceFileName: string;
    targetFileName: string;
    sourceRoot: string;
    outputRoot: string;
    environmentPath?: string;
    ast: IAstNode[];
    isEmitSourcemaps?: boolean;
    indentSize: number;
    jsMode: JavascriptMode;
}
export interface ICompileFileResult {
    request: ICompileFileRequest;
    state: ICompilerState;
    javascript: string;
    javascriptLines: string[];
    sourceMaps: string;
}
export interface ICompileResult<TResult = undefined> {
    state: ICompilerState;
    result: TResult;
}
export type CompileFunction = (node: IAstNode, state: ICompilerState) => ICompileResult<IAstNode>;
export declare const compilerConfig: {
    environmentPath: string;
    environmentVarName: string;
    contextVarName: string;
    serializerVarName: string;
    getSerializerFuncName: string;
    serializeFuncName: string;
    endlineSymbol: string;
    indentSize: number;
    textFieldName: string;
    defaultObject: string;
    sourceMappableAstNodes: IHash<boolean>;
};
export declare const compileSingleNode: (ast: IAstNode) => string;
export declare const compile: (request: ICompileFileRequest) => ICompileFileResult;
export declare const compileAstNode: (ast: IAstNode, state: ICompilerState) => ICompileResult<IAstNode>;
export declare const compileNode: (ast: IAstNode, state: ICompilerState, compilers: CompileFunction[]) => ICompileResult<IAstNode>;
export declare const compileAstModule: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstModule>;
export declare const compileOuterStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstOuterStatement>;
export declare const compileBlockStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstBlockStatement>;
export declare const compileKeywordNode: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstKeywordNode>;
export declare const compileClassDeclaration: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstClassDeclaration>;
export declare const compileObjectLine: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstObjectLineStatement>;
export declare const compileDeleteLine: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstDeleteLineExpression>;
export declare const compileTextLine: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstTextLineStatement>;
export declare const compileNumber: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstNumber>;
export declare const compileBoolean: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstBoolean>;
export declare const compileRegexLiteral: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstRegexLiteral>;
export declare const compileIdentifier: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstIdentifier>;
export declare const compileIdentifierScope: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstIdentifierScope>;
export declare const compileRawIdentifier: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstRawIdentifier>;
export declare const compileContextIdentifier: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstContextIdentifier>;
export declare const compileBinaryExpression: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstBinaryExpression>;
export declare const compileMemberExpression: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstMemberExpression>;
export declare const compileStringInclude: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstStringIncludeStatement>;
export declare const compileCallExpression: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstCallExpression>;
export declare const compileVarDeclaration: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstVariableDeclaration>;
export declare const compileDeconstrutingAssignment: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstDeconstructingAssignment>;
export declare const compileFunction: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstFunction>;
export declare const compileProgram: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstProgram>;
export declare const compileBreakStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstBreakStatement>;
export declare const compileContinueStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstContinueStatement>;
export declare const compileIfStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstIfStatement>;
export declare const compileWhileStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstWhileStatement>;
export declare const compileDoWhileStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstDoWhileStatement>;
export declare const compileSwitchStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstSwitchStatement>;
export declare const compileCaseStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstCaseStatement>;
export declare const compileParenExpression: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstParenExpression>;
export declare const compileImportStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstImportStatement>;
export declare const compileRawImportStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstRawImportStatement>;
export declare const compileImportItem: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstImportItem>;
export declare const compilePropertyDeclaration: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstPropertyDeclaration>;
export declare const compileForStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstForStatement>;
export declare const compileForInStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstForInStatement>;
export declare const compileForOfStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstForOfStatement>;
export declare const compileArrayLiteral: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstArray>;
export declare const compileObjectLiteral: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstObject>;
export declare const compileUpdateExpression: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstUpdateExpression>;
export declare const compileKeyword: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstKeyword>;
export declare const compileConditionalExpression: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstConditionalExpression>;
export declare const compileIndexerExpression: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstIndexerExpression>;
export declare const compileTryStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstTryStatement>;
export declare const compileCatchStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstCatchStatement>;
export declare const compileFinallyStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstFinallyStatement>;
export declare const compileDebuggerKeyword: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstDebuggerKeyword>;
export declare const compileThrowStatement: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstThrowStatement>;
export declare const compileToken: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstToken>;
export declare const compileTokenSequence: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstTokenSequence>;
export declare const compileOperator: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstOperator>;
export declare const compileStringLiteral: (node: IAstNode, state: ICompilerState) => ICompileResult<IAstString>;
export declare const writeIndentScope: (indentScope: IIndentScopeItem[], state: ICompilerState, astPos?: ISymbolPosition) => ICompilerState;
export declare const isEndOfFile: (state: ICompilerState) => boolean;
export declare const getParentScope: (indent: number, state: ICompilerState) => IIndentScopeItem[];
export declare const addIndentScopeItem: (scopeItem: IIndentScopeItem, state: ICompilerState) => ICompilerState;
export declare const setIndentScope: (scope: IIndentScopeItem[], state: ICompilerState) => ICompilerState;
export declare const skipAst: (state: ICompilerState, count?: number) => ICompilerState;
export declare const getAst: (state: ICompilerState) => IAstNode;
export declare const addJavascript: (state: ICompilerState, javascript: string[]) => ICompilerState;
export declare const getIdentifierFromNode: (node: IAstNode, state: ICompilerState) => IAstIdentifier;
export declare const getIdentifierFullName: (node: IAstIdentifier, indentScope: IIndentScopeItem[], state: ICompilerState) => string;
export declare const addSourceMaps: (state: ICompilerState, sourceMaps: ISourceMapToken[]) => ICompilerState;
export declare const addSourceMap: (state: ICompilerState, sourceMap: ISourceMapToken) => ICompilerState;
export declare const addSourceMapAtCurrentPlace: (state: ICompilerState, tokenName?: string, symbolPos?: ISymbolPosition, jsLineOffset?: number, stsLineOffset?: number) => ICompilerState;
export declare const isNeedToLinkSourcemap: (astNode: IAstNode) => boolean;
export declare const addTargetIndent: (state: ICompilerState, amount?: number) => ICompilerState;
export declare const setIndent: (state: ICompilerState, indent: number) => ICompilerState;
export declare const writeTargetIndent: (state: ICompilerState) => ICompilerState;
export declare const writeJavascript: (state: ICompilerState, javascript: string) => ICompilerState;
export declare const writeEndline: (state: ICompilerState) => ICompilerState;
export declare const writeJsToken: (state: ICompilerState, jsToken: string) => ICompilerState;
export declare const toStringSafe: (value: any) => string;
