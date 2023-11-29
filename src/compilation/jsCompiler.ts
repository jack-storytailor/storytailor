import { IAstNode, IAstModule, IAstObjectLineStatement, IAstOuterStatement, IAstBlockStatement, IAstStatement, IAstTextLineStatement, IAstNumber, IAstBoolean, IAstIdentifier, IAstString, IAstToken, IAstRawIdentifier, IAstIdentifierScope, IAstBinaryExpression, IAstOperator, IAstMemberExpression, IAstStringIncludeStatement, IAstCallExpression, IAstVariableDeclaration, IAstFunctionDeclaration, IAstProgram, IAstReturnStatement, IAstIfStatement, IAstWhileStatement, IAstDoWhileStatement, IAstSwitchStatement, IAstCaseStatement, IAstBreakStatement, IAstContinueStatement, IAstParenExpression, IAstImportStatement, IAstPropertyDeclaration, IAstForStatement, IAstForInStatement, IAstArray, IAstObjectExpression, IAstUpdateExpression, IAstTokenSequence, IAstKeyword, IAstConditionalExpression, IAstIndexerExpression, IAstTryStatement, IAstCatchStatement, IAstFinallyStatement, IAstDebuggerKeyword, IAstThrowStatement, IAstNewExpression, IAstDeleteExpression, IAstDeleteLineExpression, IAstContextIdentifier, IAstTypeofExpression } from "../ast/IAstNode";
import { ISymbolPosition } from "../shared/ISymbolPosition";
import { SourceMapGenerator } from 'source-map';
import { AstNodeType } from "../ast/AstNodeType";
import { astFactory } from "../ast/astFactory";
import { VariableDeclarationKind } from "../ast/VariableDeclarationKind";
import { ICodeToken } from "../shared/ICodeToken";
import * as path from 'path';
import { IHash } from "../shared/IHash";

export interface ISourceMapToken {
    generated: {
        line: number;
        column: number;
    },
    source: string;
    original: {
        line: number;
        column: number;
    },
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

const sourceMappableAstNodes: IHash<boolean> =
{
    // ["Token"]: true,
    // ["TokenSequence"]: true,
    // ["Text"]: true,
    // ["Operator"]: true,
    // ["Module"]: true,
    // ["Program"]: true,
    ["Keyword"]: true,
    ["DebuggerKeyword"]: true,
    // ["CommentLine"]: true,
    // ["CommentBlock"]: true,
    // literals
    ["Number"]: true,
    ["String"]: true,
    ["Boolean"]: true,
    ["Array"]: true,
    // identifiers
    ["Identifier"]: true,
    ["IdentifierScope"]: true,
    ["RawIdentifier"]: true,
    ["ContextIdentifier"]: true,
    // declarations
    ["FunctionDeclaration"]: true,
    ["VariableDeclaration"]: true,
    ["PropertyDeclaration"]: true,
    // statements
    ["Statement"]: true,
    ["BreakStatement"]: true,
    ["ReturnStatement"]: true,
    ["ContinueStatement"]: true,
    ["BlockStatement"]: true,
    ["IfStatement"]: true,
    ["SwitchStatement"]: true,
    ["CaseStatement"]: true,
    ["WhileStatement"]: true,
    ["DoWhileStatement"]: true,
    ["ForStatement"]: true,
    ["ForInStatement"]: true,
    ["ImportStatement"]: true,
    ["TryStatement"]: true,
    ["CatchStatement"]: true,
    ["FinallyStatement"]: true,
    ["ThrowStatement"]: true,
    // expression statements
    ["ExpressionStatement"]: true,
    ["ParenExpression"]: true,
    ["ObjectExpression"]: true,
    ["CallExpression"]: true,
    ["OperationExpression"]: true,
    ["UpdateExpression"]: true,
    ["BinaryExpression"]: true,
    ["MemberExpression"]: true,
    ["IndexerExpression"]: true,
    ["ConditionalExpression"]: true,
    ["NewExpression"]: true,
    ["DeleteExpression"]: true,
    // storytailor-specific
    ["OuterStatement"]: true,
    ["TextLineStatement"]: true,
    ["ObjectLineStatement"]: true,
    ["StringIncludeStatement"]: true,
    ["PrototypeExpression"]: true,
    ["DeleteLineExpression"]: true,
    ["Scope"]: true,
    ["Tag"]: true,
};

const textFieldName = "__text";
export const compilerConfig = {
    environmentPath: "storytailor/out/environment",
    environmentVarName: '__env',
    contextVarName: "__context",
    serializerVarName: "__serializer",
    getSerializerFuncName: "getSerializer",
    serializeFuncName: "serialize",
    endlineSymbol: "\r\n",
    indentSize: 2,
    textFieldName,
    defaultObject: `{ ${textFieldName}: [] }`,
    sourceMappableAstNodes
}

const getEnvPath = (request: ICompileFileRequest): string => {
    let environmentPath = request.environmentPath || compilerConfig.environmentPath;

    // prepare environment path
    if (request.environmentPath) {
        environmentPath = environmentPath || compilerConfig.environmentPath;

        let envPath = path.resolve(request.outputRoot, environmentPath + '.js');
        let moduleDir = path.dirname(request.targetFileName);
        let envDir = path.dirname(envPath);
        let envFileName = path.basename(environmentPath);
        let relativeModulePath = path.relative(moduleDir, envDir);
        if (relativeModulePath === '') {
            relativeModulePath = '.';
        }
        // relativeModulePath = relativeModulePath.replace('\\', '/');
        let envModulePath = relativeModulePath + '/' + envFileName;
        environmentPath = envModulePath;
    }

    if (!environmentPath) {
        environmentPath = compilerConfig.environmentPath;
    }

    environmentPath = escapeRegExp(environmentPath);
    return environmentPath;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export const compileSingleNode = (ast: IAstNode): string => {
    let cursor = { ...ast[0].start };
    // let sourceMapGenerator = new SourceMapGenerator({});

    // prepare compile state
    let sourceState: ISourceState = {
        ast: [ast],
        astIndex: 0,
        cursor,
        fileName: 'nofile',
        indent: 0,
        indentScope: []
    };
    let targetState: ITargetState = {
        cursor,
        javascript: [],
        sourceMaps: [],
        fileName: 'nofile',
		indent:0
    };
    let state: ICompilerState = {
        sourceState,
        targetState
    };

    // compile node
    let compileResult = compileAstNode(ast, state);
    if (!compileResult) {
        return undefined;
    }
    state = compileResult.state;

    // prepare result
    let javascriptLines = state.targetState.javascript;
    let javascript = javascriptLines.join("\r\n");

    return javascript;
}

export const compile = (request: ICompileFileRequest): ICompileFileResult => {
    if (!request || !request.ast || request.ast.length === 0) {
        return undefined;
    }

    // prepare state
    let ast = request.ast;
    let cursor = { ...ast[0].start };

    let sourceState: ISourceState = {
        ast,
        astIndex: 0,
        cursor,
        fileName: request.sourceFileName,
        indent: 0,
        indentScope: []
    };
    let targetState: ITargetState = {
        cursor,
        javascript: [],
        sourceMaps: [],
        fileName: request.targetFileName,
		indent:0
    };
    let state: ICompilerState = {
        sourceState,
        targetState
    };

    // prepare ident size
    if (request.indentSize) {
        compilerConfig.indentSize = request.indentSize;
    }
    if (!compilerConfig.indentSize) {
        compilerConfig.indentSize = 2;
    }

    // write module header
    // env
    let environmentPath = getEnvPath(request);
    state = writeJsToken(state, `let ${compilerConfig.environmentVarName} = require(\`${environmentPath}\`);`);
    state = writeEndline(state);
    // context
    state = writeJsToken(state, `let ${compilerConfig.contextVarName} = { ${compilerConfig.textFieldName}: [] };`);
    state = writeEndline(state);
    // serializer
    state = writeJsToken(state, `let ${compilerConfig.serializerVarName} = ${compilerConfig.environmentVarName}.${compilerConfig.getSerializerFuncName}();`);
    state = writeEndline(state);
    state = writeEndline(state);

    // compile ast
    while (!isEndOfFile(state)) {

        // compile ast node
        let nextAst = getAst(state);
        let compileAstResult = compileAstNode(nextAst, state);
        if (compileAstResult) {
            state = compileAstResult.state;
            state = skipAst(state);

            continue;
        }

        // otherwise this ast node is something uncompilable. skip it
        state = skipAst(state);
    }

    // write module footer
    state = writeEndline(state);
    state = writeEndline(state);
    state = writeJsToken(state, `// INFO: this trick is for making this file node module`);
    state = writeEndline(state);
    state = writeJsToken(state, `Object.assign(module.exports, ${compilerConfig.contextVarName});`);
    state = writeEndline(state);

    // prepare result
    let javascriptLines = state.targetState.javascript;

    let sourceMaps: string = undefined;
    // prepare source maps
    if (request.isEmitSourcemaps === true) {
        let sourceMapTokens = state.targetState.sourceMaps;
        // generate source map text
        let mapGenerator = new SourceMapGenerator({
            file: request.sourceFileName,
            // sourceRoot: request.sourceRoot
        });
        for (let smi = 0; smi < sourceMapTokens.length; smi++) {
            const smToken: ISourceMapToken = sourceMapTokens[smi];
            mapGenerator.addMapping(smToken);
        }
        sourceMaps = mapGenerator.toString();

        javascriptLines.push(`//# sourceMappingURL=${request.targetFileName}.map`);
    }

    let javascript = javascriptLines.join("\r\n");

    return {
        state,
        javascript,
        javascriptLines,
        request,
        sourceMaps
    }
}
export const compileAstNode = (ast: IAstNode, state: ICompilerState): ICompileResult<IAstNode> => {
    if (!ast) {
        return undefined;
    }

    // general

    // module
    let moduleResult = compileAstModule(ast, state);
    if (moduleResult) {
        return moduleResult;
    }

    // outer statement
    let outerStatementResult = compileOuterStatement(ast, state);
    if (outerStatementResult) {
        return outerStatementResult;
    }

    // block statement
    let compileBlockResult = compileBlockStatement(ast, state);
    if (compileBlockResult) {
        return compileBlockResult;
    }

    // object line
    let compileObjectLineResult = compileObjectLine(ast, state);
    if (compileObjectLineResult) {
        return compileObjectLineResult;
    }

    // string literal
    let stringResult = compileStringLiteral(ast, state);
    if (stringResult) {
        return stringResult;
    }

    // string include
    let stringIncludeResult = compileStringInclude(ast, state);
    if (stringIncludeResult) {
        return stringIncludeResult;
    }

    // raw identifier
    let rawIdentResult = compileRawIdentifier(ast, state);
    if (rawIdentResult) {
        return rawIdentResult;
    }

    // context identifier
    let contextIdentResult = compileContextIdentifier(ast, state);
    if (contextIdentResult) {
        return contextIdentResult;
    }

    // statement
    let compileStatementResult = compileStatement(ast, state);
    if (compileStatementResult) {
        return compileStatementResult;
    }

    // binary operation
    let binaryOpResult = compileBinaryExpression(ast, state);
    if (binaryOpResult) {
        return binaryOpResult;
    }

    // member expression
    let memberResult = compileMemberExpression(ast, state);
    if (memberResult) {
        return memberResult;
    }

    // call expression
    let callResult = compileCallExpression(ast, state);
    if (callResult) {
        return callResult;
    }

    // delete expression
    let deleteResult = compileDeleteExpression(ast, state);
    if (deleteResult) {
        return deleteResult;
    }

    // typeof expression
    let typeofResult = compileTypeofExpression(ast, state);
    if (typeofResult) {
        return typeofResult;
    }

    // delete line expression
    let deleteLineResult = compileDeleteLine(ast, state);
    if (deleteLineResult) {
        return deleteLineResult;
    }

    // text line
    let textLineResult = compileTextLine(ast, state);
    if (textLineResult) {
        return textLineResult;
    }

    // number
    let numberResult = compileNumber(ast, state);
    if (numberResult) {
        return numberResult;
    }

    // boolean
    let booleanResult = compileBoolean(ast, state);
    if (booleanResult) {
        return booleanResult;
    }

    // identifier
    let identifierResult = compileIdentifier(ast, state);
    if (identifierResult) {
        return identifierResult;
    }

    // identifier scope
    let identifierScopeResult = compileIdentifierScope(ast, state);
    if (identifierScopeResult) {
        return identifierScopeResult;
    }

    // token
    let tokenResult = compileToken(ast, state);
    if (tokenResult) {
        return tokenResult;
    }

    // token sequence
    let tokenSequeceResult = compileTokenSequence(ast, state);
    if (tokenSequeceResult) {
        return tokenSequeceResult;
    }

    // operator
    let operatorResult = compileOperator(ast, state);
    if (operatorResult) {
        return operatorResult;
    }

    // var declaration
    let varDeclarResult = compileVarDeclaration(ast, state);
    if (varDeclarResult) {
        return varDeclarResult;
    }

    // program
    let programResult = compileProgram(ast, state);
    if (programResult) {
        return programResult;
    }

    // function declaration
    let funcDeclarResult = compileFuncDeclaration(ast, state);
    if (funcDeclarResult) {
        return funcDeclarResult;
    }

    // return statement
    let returnStatementResult = compileReturnStatement(ast, state);
    if (returnStatementResult) {
        return returnStatementResult;
    }

    // if
    let ifResult = compileIfStatement(ast, state);
    if (ifResult) {
        return ifResult;
    }

    // while
    let whileResult = compileWhileStatement(ast, state);
    if (whileResult) {
        return whileResult;
    }

    // do while
    let doWhileResult = compileDoWhileStatement(ast, state);
    if (doWhileResult) {
        return doWhileResult;
    }

    // switch
    let switchResult = compileSwitchStatement(ast, state);
    if (switchResult) {
        return switchResult;
    }

    // case
    let caseResult = compileCaseStatement(ast, state);
    if (caseResult) {
        return caseResult;
    }

    // break
    let breakResult = compileBreakStatement(ast, state);
    if (breakResult) {
        return breakResult;
    }

    // continue
    let continueResult = compileContinueStatement(ast, state);
    if (continueResult) {
        return continueResult;
    }

    // paren expression
    let parenResult = compileParenExpression(ast, state);
    if (parenResult) {
        return parenResult;
    }

    // import expression 
    let importResult = compileImportStatement(ast, state);
    if (importResult) {
        return importResult;
    }

    // for statement
    let forResult = compileForStatement(ast, state);
    if (forResult) {
        return forResult;
    }

    // for in statement
    let forInResult = compileForInStatement(ast, state);
    if (forInResult) {
        return forInResult;
    }

    // property declaration
    let propResult = compilePropertyDeclaration(ast, state);
    if (propResult) {
        return propResult;
    }

    // object literal
    let objLiteralResult = compileObjectExpression(ast, state);
    if (objLiteralResult) {
        return objLiteralResult;
    }

    // array literal
    let arrayLiteralResult = compileArrayLiteral(ast, state);
    if (arrayLiteralResult) {
        return arrayLiteralResult;
    }

    // update expression
    let updateExprResult = compileUpdateExpression(ast, state);
    if (updateExprResult) {
        return updateExprResult;
    }

    // keyword
    let keywordResult = compileKeyword(ast, state);
    if (keywordResult) {
        return keywordResult;
    }

    // conditional expression
    let condExpResult = compileConditionalExpression(ast, state);
    if (condExpResult) {
        return condExpResult;
    }

    // indexer
    let indexerResult = compileIndexerExpression(ast, state);
    if (indexerResult) {
        return indexerResult;
    }

    // try
    let tryResult = compileTryStatement(ast, state);
    if (tryResult) {
        return tryResult;
    }

    // catch
    let catchResult = compileCatchStatement(ast, state);
    if (catchResult) {
        return catchResult;
    }

    // finally
    let finallyResult = compileFinallyStatement(ast, state);
    if (finallyResult) {
        return finallyResult;
    }

    // throw
    let throwResult = compileThrowStatement(ast, state);
    if (throwResult) {
        return throwResult;
    }

    // new 
    let newResult = compileNewExpression(ast, state);
    if (newResult) {
        return newResult;
    }

    // debugger
    let debuggerResult = compileDebuggerKeyword(ast, state);
    if (debuggerResult) {
        return debuggerResult;
    }

    // default value is just a type of node
    state = writeJsToken(state, ast.nodeType);
    return {
        state,
        result: ast
    }
}
export const compileAstModule = (node: IAstNode, state: ICompilerState): ICompileResult<IAstModule> => {
    let ast = astFactory.asNode<IAstModule>(node, AstNodeType.Module);
    if (!state || !ast) {
        return undefined;
    }

    // compile module content
    let moduleContent = ast.content;
    if (moduleContent && moduleContent.content && moduleContent.content.length > 0) {
        for (let contentInd = 0; contentInd < moduleContent.content.length; contentInd++) {
            let contentNode: IAstNode = moduleContent.content[contentInd];
            let compileResult = compileAstNode(contentNode, state);
            if (compileResult) {
                state = compileResult.state;
                // state = writeJsToken(state, `;`);
                // state = writeEndline(state);
            }
        }
    }

    // prepare result
    return {
        state,
        result: ast
    }
}
export const compileOuterStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstOuterStatement> => {
    let ast = astFactory.asNode<IAstOuterStatement>(node, AstNodeType.OuterStatement);
    if (!state || !ast) {
        return undefined;
    }

    // check indent
    let newIndent = Math.floor(ast.indent / compilerConfig.indentSize);
    let sourceState = state.sourceState;
    sourceState = { ...sourceState, indent: newIndent };
    state = {
        ...state,
        sourceState
    }

    // compile statement
    let compileStatementResult = compileAstNode(ast.statement, state);
    if (compileStatementResult) {
        state = compileStatementResult.state;
    }

    // prepare result
    return {
        state,
        result: ast
    }
}
export const compileBlockStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstBlockStatement> => {
    let ast = astFactory.asNode<IAstBlockStatement>(node, AstNodeType.BlockStatement);
    if (!ast || !state) {
        return undefined;
    }

    if (!ast.withoutBraces) {
        // open scope
        state = writeJsToken(state, "{ ");
        state = writeEndline(state);
		state = addTargetIndent(state, 1);
    }

    // write all the statements
    let content = ast.content;
    if (content && content.length > 0) {
        for (let i = 0; i < content.length; i++) {
            // write indent
			state = writeTargetIndent(state);

            const contentNode: IAstNode = content[i];
            let contentNodeResult = compileAstNode(contentNode, state);
            if (contentNodeResult) {
                state = contentNodeResult.state;
            }

            // write ;
            state = writeJsToken(state, ';');
            state = writeEndline(state);
        }
    }

    if (!ast.withoutBraces) {
        // close scope
		state = addTargetIndent(state, -1);
		state = writeTargetIndent(state);
        state = writeJsToken(state, "}");
    }

    return {
        state,
        result: ast
    }
}
export const compileObjectLine = (node: IAstNode, state: ICompilerState): ICompileResult<IAstObjectLineStatement> => {
    let ast = astFactory.asNode<IAstObjectLineStatement>(node, AstNodeType.ObjectLineStatement);
    if (!ast || !state) {
        return undefined;
    }

    let objectNode: IAstNode = ast.object;
    let initValue: IAstNode = ast.value;
    let parentScope: IIndentScopeItem[] = [];

    if (objectNode) {

        // check indent and scope
        let sourceState = state.sourceState;
        let myIndent = sourceState.indent;
        let scopeItem: IIndentScopeItem = {
            identifier: objectNode,
            indent: myIndent
        };

        parentScope = getParentScope(myIndent, state);
        // add self as scope item
        state = setIndentScope([...parentScope, scopeItem], state);
    }

    // write indent scope
	let identifier = getIdentifierFromNode(objectNode, state);
	let identifierName = getIdentifierFullName(identifier, parentScope, state);
	if (identifier) {
		state = addSourceMapAtCurrentPlace(state, identifierName, identifier.start);
	}
    // state = writeIndentScope(state.sourceState.indentScope, state, ast.start);
    state = writeIndentScope(state.sourceState.indentScope, state);

    // compile init value if any
    if (initValue) {
        state = addSourceMapAtCurrentPlace(state, "=", initValue.start, 1);
        state = writeJsToken(state, " = ");

        // write init value
        let initValResult = compileAstNode(initValue, state);
        if (initValResult) {
            state = initValResult.state;
        }
    }
    else {
        // if we have no init value, here is specific syntax
        // context[varname] = context[varname] || {};
        state = writeJsToken(state, " = ");

        // write parent scope
        state = writeIndentScope(state.sourceState.indentScope, state);
        // || {}
        state = writeJsToken(state, ` || ${compilerConfig.defaultObject}`);
    }

	// add ; and endline
	state = writeJsToken(state, ";");
	state = writeEndline(state);

    return {
        state,
        result: ast
    }
}
export const compileDeleteLine = (node: IAstNode, state: ICompilerState): ICompileResult<IAstDeleteLineExpression> => {
    let ast = astFactory.asNode<IAstDeleteLineExpression>(node, AstNodeType.DeleteLineExpression);
    if (!ast || !state) {
        return undefined;
    }

    let scopeToWrite = state.sourceState.indentScope;
    let objectNode: IAstNode = ast.object;
    if (objectNode) {
        // write delete
        state = writeJsToken(state, `delete `);

        // check indent and scope
        let sourceState = state.sourceState;
        let myIndent = sourceState.indent;
        let scopeItem: IIndentScopeItem = {
            identifier: objectNode,
            indent: myIndent
        };

        let parentScope = getParentScope(myIndent, state);
        scopeToWrite = [...parentScope, scopeItem];

        // write indent scope
        state = writeIndentScope(scopeToWrite, state, objectNode.start);
    }

	// add ; and endline
	state = writeJsToken(state, ";");
	state = writeEndline(state);

    return {
        state,
        result: ast
    }
}
export const compileStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstStatement> => {
    let ast = astFactory.asNode<IAstStatement>(node, AstNodeType.Statement);
    if (!ast || !state) {
        return undefined;
    }

    let compileResult = compileAstNode(ast.statement, state);
    if (compileResult) {
        state = compileResult.state;
    }

    return {
        state,
        result: ast
    }
}
export const compileTextLine = (node: IAstNode, state: ICompilerState): ICompileResult<IAstTextLineStatement> => {
    let ast = astFactory.asNode<IAstTextLineStatement>(node, AstNodeType.TextLineStatement);
    if (!ast || !state) {
        return undefined;
    }

    // check indent
    let myIndent = Math.floor(ast.indent / compilerConfig.indentSize);
    // get parent scope
    let parentScope = getParentScope(myIndent, state);
    // save parent scope
    state = setIndentScope(parentScope, state);

    // check whitespace
    let whitespaceLength = ast.indent;
    if (parentScope && parentScope.length > 0) {
        // get last item from scope
        let lastItem = parentScope[parentScope.length - 1];
        // if our indent is bigger than expected indent (parent indent + 2), 
        // then all excess indent symbols convert to spaces
        whitespaceLength = Math.max(0, ast.indent - compilerConfig.indentSize - lastItem.indent * compilerConfig.indentSize);
    }

    // create whitespace
    let whitespace = '';
    for (let i = 0; i < whitespaceLength; i++) {
        whitespace = whitespace + ' ';
    }

    // write indent scope
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);

    state = writeIndentScope(parentScope, state);
    // write [text]
    state = writeJsToken(state, `['${compilerConfig.textFieldName}']`)

	// write .push(
	state = writeJsToken(state, `.push(`);

    // write open `
    state = writeJsToken(state, '`');

    // write whitespace
    state = writeJsToken(state, whitespace);
    // write string content
    let content = ast.text;
    for (let i = 0; i < content.length; i++) {
        const contentItem = content[i];
        let compileItemResult = compileAstNode(contentItem, state);
        if (compileItemResult) {
            state = compileItemResult.state;
        }
    }

	// write `);
	state = writeJsToken(state, '`);');

	// write endline
	state = writeEndline(state);

    return {
        state,
        result: ast
    }
}
export const compileNumber = (node: IAstNode, state: ICompilerState): ICompileResult<IAstNumber> => {
    let ast = astFactory.asNode<IAstNumber>(node, AstNodeType.Number);
    if (!ast || !state) {
        return undefined;
    }

    state = addSourceMapAtCurrentPlace(state, toStringSafe(ast.value), ast.start);
    state = writeJsToken(state, ast.value.toString());
    return {
        state,
        result: ast
    }
}
export const compileBoolean = (node: IAstNode, state: ICompilerState): ICompileResult<IAstBoolean> => {
    let ast = astFactory.asNode<IAstBoolean>(node, AstNodeType.Boolean);
    if (!ast || !state) {
        return undefined;
    }

    state = addSourceMapAtCurrentPlace(state, toStringSafe(ast.value), ast.start);
    state = writeJsToken(state, ast.value.toString());
    return {
        state,
        result: ast
    }
}
export const compileIdentifier = (node: IAstNode, state: ICompilerState): ICompileResult<IAstIdentifier> => {
    let ast = astFactory.asNode<IAstIdentifier>(node, AstNodeType.Identifier);
    if (!ast || !state) {
        return undefined;
    }

    state = writeJsToken(state, ast.value);

    return {
        state,
        result: ast
    }
}
export const compileIdentifierScope = (node: IAstNode, state: ICompilerState): ICompileResult<IAstIdentifierScope> => {
    let ast = astFactory.asNode<IAstIdentifierScope>(node, AstNodeType.IdentifierScope);
    if (!ast || !state) {
        return undefined;
    }

    // write items
    let valueItems = ast.value;
    if (valueItems && valueItems.length > 0) {
        for (let i = 0; i < valueItems.length; i++) {
            const itemNode: IAstNode = valueItems[i];
            let itemResult = compileAstNode(itemNode, state);
            if (itemResult) {
                state = itemResult.state;
            }
        }
    }

    // result
    return {
        state,
        result: ast
    }
}
export const compileRawIdentifier = (node: IAstNode, state: ICompilerState): ICompileResult<IAstRawIdentifier> => {
    let ast = astFactory.asNode<IAstRawIdentifier>(node, AstNodeType.RawIdentifier);
    if (!ast || !state) {
        return undefined;
    }

    var identifier = astFactory.asNode<IAstIdentifier>(ast.value, AstNodeType.Identifier);
    if (identifier) {
        state = addSourceMapAtCurrentPlace(state, identifier.value, identifier.start, 1);
    }
    let compileResult = compileAstNode(ast.value, state);
    if (compileResult) {
        state = compileResult.state;
    }

    return {
        state,
        result: ast
    }
}
export const compileContextIdentifier = (node: IAstNode, state: ICompilerState): ICompileResult<IAstContextIdentifier> => {
    let ast = astFactory.asNode<IAstContextIdentifier>(node, AstNodeType.ContextIdentifier);
    if (!ast || !state) {
        return undefined;
    }

    // this is not raw identifier, so add context before it
    state = writeJsToken(state, `${compilerConfig.contextVarName}`);
    // ['
    state = writeJsToken(state, `[\``);
    // write identifier
    var compileValResult = compileAstNode(ast.value, state);
    if (compileValResult) {
        state = compileValResult.state;
    }
    //']
    state = writeJsToken(state, `\`]`);

    return {
        state,
        result: ast
    }
}
export const compileBinaryExpression = (node: IAstNode, state: ICompilerState): ICompileResult<IAstBinaryExpression> => {
    let ast = astFactory.asNode<IAstBinaryExpression>(node, AstNodeType.BinaryExpression);
    if (!ast || !state) {
        return undefined;
    }

	let leftIdentifier = getIdentifierFromNode(ast.left, state);
	if (leftIdentifier) {
		state = addSourceMapAtCurrentPlace(state, leftIdentifier.value, leftIdentifier.start);
	}

    // left operand
    let leftResult = compileAstNode(ast.left, state);
    if (leftResult) {
        state = leftResult.state;
    }

    // add space
    state = writeJsToken(state, ' ');

    // operator
    let compileOperatorResult = compileAstNode(ast.operator, state);
    if (compileOperatorResult) {
        state = compileOperatorResult.state;
    }

    // add space
    state = writeJsToken(state, ' ');

    // right operand
    let rightResult = compileAstNode(ast.right, state);
    if (rightResult) {
        state = rightResult.state;
    }

    // result
    return {
        state,
        result: ast
    }
}
export const compileMemberExpression = (node: IAstNode, state: ICompilerState): ICompileResult<IAstMemberExpression> => {
    let ast = astFactory.asNode<IAstMemberExpression>(node, AstNodeType.MemberExpression);
    if (!ast || !state) {
        return undefined;
    }

    // left operand
    let leftResult = compileAstNode(ast.object, state);
    if (leftResult) {
        state = leftResult.state;
    }

    // [
    state = writeJsToken(state, `['`);

    // right operand
    let rightResult = compileAstNode(ast.property, state);
    if (rightResult) {
        state = rightResult.state;
    }

    // ]
    state = writeJsToken(state, `']`);

    // result
    return {
        state,
        result: ast
    }
}
export const compileStringInclude = (node: IAstNode, state: ICompilerState): ICompileResult<IAstStringIncludeStatement> => {
    let ast = astFactory.asNode<IAstStringIncludeStatement>(node, AstNodeType.StringIncludeStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write ${
    state = writeJsToken(state, '${');
    // write serializer.serialize(
    state = writeJsToken(state, `${compilerConfig.serializerVarName}.${compilerConfig.serializeFuncName}( `);

    // write expression
    let expResult = compileAstNode(ast.expression, state);
    if (expResult) {
        state = expResult.state;
    }

    // write separator param
    state = writeJsToken(state, `, '\\r\\n'`);

    // write serialize close paren )
    state = writeJsToken(state, ` )`);

    // write }
    state = writeJsToken(state, '}');

    // result
    return {
        state,
        result: ast
    }
}
export const compileCallExpression = (node: IAstNode, state: ICompilerState): ICompileResult<IAstCallExpression> => {
    let ast = astFactory.asNode<IAstCallExpression>(node, AstNodeType.CallExpression);
    if (!ast || !state) {
        return undefined;
    }

    // callee
    if (ast.calee) {
        state = addSourceMapAtCurrentPlace(state, undefined, ast.calee.start);
    }
    else{
        state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    }
    let calleeResult = compileAstNode(ast.calee, state);
    if (calleeResult) {
        state = calleeResult.state;
    }

    // write open (
    state = writeJsToken(state, '(');

    // write arguments
    let fArgs = ast.args;
    if (fArgs && fArgs.length > 0) {
        for (let i = 0; i < fArgs.length; i++) {
            // if it's not first item, write separator
            if (i > 0) {
                state = writeJsToken(state, ', ');
            }

            const argNode: IAstNode = fArgs[i];
            let argResult = compileAstNode(argNode, state);
            if (argResult) {
                state = argResult.state;
            }
        }
    }

    // write close )
    state = writeJsToken(state, ')');

    // result
    return {
        state,
        result: ast
    }
}
export const compileVarDeclaration = (node: IAstNode, state: ICompilerState): ICompileResult<IAstVariableDeclaration> => {
    let ast = astFactory.asNode<IAstVariableDeclaration>(node, AstNodeType.VariableDeclaration);
    if (!ast || !state) {
        return undefined;
    }

    // get prefix
    let prefix = "var";
    if (ast.kind === VariableDeclarationKind.Const) {
        prefix = "const";
    }
    if (ast.kind === VariableDeclarationKind.Let) {
        prefix = "let";
    }

    // write prefix
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `${prefix} `);

    // write varname
    let identifier = astFactory.asNode<IAstIdentifier>(ast.identifier, AstNodeType.Identifier);
    if (identifier){
        state = addSourceMapAtCurrentPlace(state, identifier.value, ast.identifier.start);
    }
    let varnameResult = compileAstNode(ast.identifier, state);
    if (varnameResult) {
        state = varnameResult.state;
    }

    // init value
    if (ast.value) {
        // write =
        state = writeJsToken(state, ` = `);

        // write init value
        let initValResult = compileAstNode(ast.value, state);
        if (initValResult) {
            state = initValResult.state;
        }
    }

    // result
    return {
        state,
        result: ast
    }
}
export const compileFuncDeclaration = (node: IAstNode, state: ICompilerState): ICompileResult<IAstFunctionDeclaration> => {
    let ast = astFactory.asNode<IAstFunctionDeclaration>(node, AstNodeType.FunctionDeclaration);
    if (!ast || !state) {
        return undefined;
    }

    // write function (
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);

	if (!ast.isLambda) {
		state = writeJsToken(state, `function`);
	}

	state = writeJsToken(state, '(');

    // write all the params
    let params = ast.args;
    if (params && params.length > 0) {
        for (let i = 0; i < params.length; i++) {
            // if it's not first item, add separator before
            if (i > 0) {
                state = writeJsToken(state, `, `);
            }

            const param = params[i];
            let paramResult = compileAstNode(param, state);
            if (paramResult) {
                state = paramResult.state;
            }
        }
    }

    // write )
    state = writeJsToken(state, `) `);

	if (ast.isLambda) {
		state = writeJsToken(state, '=> ');
	}

    // write function body
    let bodyResult = compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }

    // result
    return {
        state,
        result: ast
    }
}
export const compileProgram = (node: IAstNode, state: ICompilerState): ICompileResult<IAstProgram> => {
    let ast = astFactory.asNode<IAstProgram>(node, AstNodeType.Program);
    if (!ast || !state) {
        return undefined;
    }

    // write {
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `{`);
    state = writeEndline(state);

    let content = ast.content;
    if (content && content.length > 0) {
        for (let i = 0; i < content.length; i++) {
            const contentNode: IAstNode = content[i];
            let contentResult = compileAstNode(contentNode, state);
            if (contentResult) {
                state = contentResult.state;
            }

            // add separator
            state = writeJsToken(state, `;`);
            state = writeEndline(state);
        }
    }

    // write }
    state = addSourceMapAtCurrentPlace(state, undefined, ast.end);
    state = writeJsToken(state, `}`);

    return {
        state,
        result: ast
    }
}
export const compileReturnStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstReturnStatement> => {
    let ast = astFactory.asNode<IAstReturnStatement>(node, AstNodeType.ReturnStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write return
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `return `);
    // write return value if any
    let valResult = compileAstNode(ast.value, state);
    if (valResult) {
        state = valResult.state;
    }

    return {
        state,
        result: ast
    }
}
export const compileDeleteExpression = (node: IAstNode, state: ICompilerState): ICompileResult<IAstDeleteExpression> => {
    let ast = astFactory.asNode<IAstDeleteExpression>(node, AstNodeType.DeleteExpression);
    if (!ast || !state) {
        return undefined;
    }

    // write delete
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `delete `);
    // write delete value if any
    let valResult = compileAstNode(ast.expression, state);
    if (valResult) {
        state = valResult.state;
    }

    return {
        state,
        result: ast
    }
}
export const compileTypeofExpression = (node: IAstNode, state: ICompilerState): ICompileResult<IAstTypeofExpression> => {
    let ast = astFactory.asNode<IAstTypeofExpression>(node, AstNodeType.TypeofExpression);
    if (!ast || !state) {
        return undefined;
    }

    // write typeof
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `typeof `);
    // write delete value if any
    let valResult = compileAstNode(ast.expression, state);
    if (valResult) {
        state = valResult.state;
    }

    return {
        state,
        result: ast
    }
}
export const compileBreakStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstBreakStatement> => {
    let ast = astFactory.asNode<IAstBreakStatement>(node, AstNodeType.BreakStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write break
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `break`);

    return {
        state,
        result: ast
    }
}
export const compileContinueStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstContinueStatement> => {
    let ast = astFactory.asNode<IAstContinueStatement>(node, AstNodeType.ContinueStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write break
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `continue`);

    return {
        state,
        result: ast
    }
}
export const compileIfStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstIfStatement> => {
    let ast = astFactory.asNode<IAstIfStatement>(node, AstNodeType.IfStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write if (
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `if (`);
    // write condition
    let conditionResult = compileAstNode(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }

    // write )
    state = writeJsToken(state, `) `);

    // write thenValue
    let thenResult = compileAstNode(ast.thenValue, state);
    if (thenResult) {
        state = thenResult.state;
    }

    // write else if any
    if (ast.elseValue) {
        state = addSourceMapAtCurrentPlace(state, undefined, ast.elseValue.start, 1);
        state = writeJsToken(state, ` else `);

        let elseResult = compileAstNode(ast.elseValue, state);
        if (elseResult) {
            state = elseResult.state;
        }
    }

    // return result
    return {
        state,
        result: ast
    }
}
export const compileWhileStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstWhileStatement> => {
    let ast = astFactory.asNode<IAstWhileStatement>(node, AstNodeType.WhileStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write while (
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `while (`);
    // write condition
    let conditionResult = compileAstNode(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }

    // write )
    state = writeJsToken(state, `) `);

    // write body
    let bodyResult = compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }

    // return result
    return {
        state,
        result: ast
    }
}
export const compileDoWhileStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstDoWhileStatement> => {
    let ast = astFactory.asNode<IAstDoWhileStatement>(node, AstNodeType.DoWhileStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write do
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `do `);

    // write body
    let bodyResult = compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }

    // write while (
    if (ast.condition) {
        state = addSourceMapAtCurrentPlace(state, undefined, ast.condition.start);
    }

    state = writeJsToken(state, ` while (`);

    // write condition
    let conditionResult = compileAstNode(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }

    // write )
    state = writeJsToken(state, `)`);

    // return result
    return {
        state,
        result: ast
    }
}
export const compileSwitchStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstSwitchStatement> => {
    let ast = astFactory.asNode<IAstSwitchStatement>(node, AstNodeType.SwitchStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write while (
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `switch (`);
    // write condition
    let conditionResult = compileAstNode(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }

    // write )
    state = writeJsToken(state, `) `);

    // write {
    state = writeJsToken(state, `{`);
    state = writeEndline(state);

    // write cases
    let cases = ast.cases;
    if (cases && cases.length > 0) {
        for (let i = 0; i < cases.length; i++) {
            const caseNode: IAstNode = cases[i];
            let caseResult = compileAstNode(caseNode, state);
            if (caseResult) {
                state = caseResult.state;
            }

            state = writeEndline(state);
        }
    }

    // write }
    state = writeEndline(state);
    state = writeJsToken(state, `}`);

    // return result
    return {
        state,
        result: ast
    }
}
export const compileCaseStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstCaseStatement> => {
    let ast = astFactory.asNode<IAstCaseStatement>(node, AstNodeType.CaseStatement);
    if (!ast || !state) {
        return undefined;
    }

    // check is default case
    let isDefaultCase = ast.condition === undefined;
    if (isDefaultCase === true) {
        // default case
        state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
        state = writeJsToken(state, `default `);
    }
    else {
        // not a default case

        // write case
        state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
        state = writeJsToken(state, `case `);

        // write condition
        let conditionResult = compileAstNode(ast.condition, state);
        if (conditionResult) {
            state = conditionResult.state;
        }
    }

    // write :
    state = writeJsToken(state, `: `);

    // write body
    if (ast.body && ast.body.length > 0) {
        for (let i = 0; i < ast.body.length; i++) {
            state = writeEndline(state);

            const bodyItem: IAstNode = ast.body[i];
            let itemResult = compileAstNode(bodyItem, state);
            if (itemResult) {
                state = itemResult.state;
            }

            state = writeJsToken(state, `;`);
        }
    }

    // write consequent
    if (ast.consequent) {
        state = writeEndline(state);
        let consequentResult = compileAstNode(ast.consequent, state);
        if (consequentResult) {
            state = consequentResult.state;
        }
    }

    return {
        state,
        result: ast
    }
}
export const compileParenExpression = (node: IAstNode, state: ICompilerState): ICompileResult<IAstParenExpression> => {
    let ast = astFactory.asNode<IAstParenExpression>(node, AstNodeType.ParenExpression);
    if (!ast || !state) {
        return undefined;
    }

    // write (
    state = writeJsToken(state, `(`);

    // write content
    let contentResult = compileAstNode(ast.expression, state);
    if (contentResult) {
        state = contentResult.state;
    }

    // write )
    state = writeJsToken(state, `)`);

    return {
        state,
        result: ast
    }
}
export const compileImportStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstImportStatement> => {
    let ast = astFactory.asNode<IAstImportStatement>(node, AstNodeType.ImportStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write identifier
    let identifier = astFactory.asNode<IAstIdentifier>(ast.identifier, AstNodeType.Identifier);
    if (identifier) {
        state = addSourceMapAtCurrentPlace(state, identifier.value, identifier.start);
    }
    let identifierResult = compileAstNode(ast.identifier, state);
    if (identifierResult) {
        state = identifierResult.state;
    }

    // write = 
    state = writeJsToken(state, ` = `);

    // write require('
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `require(`);

    // write import path
    let pathResult = compileAstNode(ast.path, state);
    if (pathResult) {
        state = pathResult.state;
    }

    // write )
    state = writeJsToken(state, `)`);

    // if it's "import in", add one more line
    if (ast.importInContext) {
        // endline
        state = writeJsToken(state, `;`);
        state = writeEndline(state);

        // __context = { ...[identifier], ...__context };

        // __context = { ...
        state = writeJsToken(state, `${compilerConfig.contextVarName} = { ...`);

        // identifier
        const identResult = compileAstNode(ast.identifier, state);
        if (identResult) {
            state = identResult.state;
        }

        // , ...__context };
        state = writeJsToken(state, `, ...${compilerConfig.contextVarName} }`);
    }

	// add ; and endline 
	state = writeJsToken(state, ";");
	state = writeEndline(state);

    return {
        state,
        result: ast
    }
}
export const compilePropertyDeclaration = (node: IAstNode, state: ICompilerState): ICompileResult<IAstPropertyDeclaration> => {
    let ast = astFactory.asNode<IAstPropertyDeclaration>(node, AstNodeType.PropertyDeclaration);
    if (!ast || !state) {
        return undefined;
    }

    // write "identifier" : value

    // write identifier
	let identifier = getIdentifierFromNode(ast.identifier, state);
	if (identifier) {
		state = addSourceMapAtCurrentPlace(state, identifier.value, identifier.start);
	}
    let identResult = compileAstNode(ast.identifier, state);
    if (identResult) {
        state = identResult.state;
    }

    // write value if any
    if (ast.value) {
        // write :
        state = writeJsToken(state, ` : `);
        // write value
        let valResult = compileAstNode(ast.value, state);
        if (valResult) {
            state = valResult.state;
        }
    }

    // result
    return {
        state,
        result: ast
    }
}
export const compileForStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstForStatement> => {
    let ast = astFactory.asNode<IAstForStatement>(node, AstNodeType.ForStatement);
    if (!ast || !state) {
        return undefined;
    }

    // for (
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `for (`);
    // write init 
    let initResult = compileAstNode(ast.init, state);
    if (initResult) {
        state = initResult.state;
    }
    state = writeJsToken(state, `; `);
    // write test
    let testResult = compileAstNode(ast.test, state);
    if (testResult) {
        state = testResult.state;
    }
    state = writeJsToken(state, `; `);
    // write update
    let updateResult = compileAstNode(ast.update, state);
    if (updateResult) {
        state = updateResult.state;
    }
    // )
    state = writeJsToken(state, `) `);
    // write body
    let bodyResult = compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }

    // result
    return {
        state,
        result: ast
    }
}
export const compileForInStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstForInStatement> => {
    let ast = astFactory.asNode<IAstForInStatement>(node, AstNodeType.ForInStatement);
    if (!ast || !state) {
        return undefined;
    }

    // for (
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `for (`);
    // write left
    let leftResult = compileAstNode(ast.left, state);
    if (leftResult) {
        state = leftResult.state;
    }
    // write in
    state = writeJsToken(state, ` in `);
    // write right
    if (ast.right) {
        state = addSourceMapAtCurrentPlace(state, undefined, ast.right.start);
    }
    let rightResult = compileAstNode(ast.right, state);
    if (rightResult) {
        state = rightResult.state;
    }
    // )
    state = writeJsToken(state, `) `);
    // write body
    let bodyResult = compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }

    // result
    return {
        state,
        result: ast
    }
}
export const compileArrayLiteral = (node: IAstNode, state: ICompilerState): ICompileResult<IAstArray> => {
    let ast = astFactory.asNode<IAstArray>(node, AstNodeType.Array);
    if (!ast || !state) {
        return undefined;
    }

    // [
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `[`);
	state = addTargetIndent(state, 1);
    // write items
    let items = ast.value;
    if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
            // separator
            if (i > 0) {
                state = writeJsToken(state, `, `);
            }
            state = writeEndline(state);
			state = writeTargetIndent(state);

            // write item
            const itemAst: IAstNode = items[i];
            let itemResult = compileAstNode(itemAst, state);
            if (itemResult) {
                state = itemResult.state;
            }
        }
    }
    // ]
    state = writeEndline(state);
    state = writeJsToken(state, `]`);
	state = addTargetIndent(state, -1);


    // result
    return {
        state,
        result: ast
    }
}
export const compileObjectExpression = (node: IAstNode, state: ICompilerState): ICompileResult<IAstObjectExpression> => {
    let ast = astFactory.asNode<IAstObjectExpression>(node, AstNodeType.ObjectExpression);
    if (!ast || !state) {
        return undefined;
    }

    // {
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `{`);
	state = addTargetIndent(state, 1);

    // write properties
    let props = ast.properties;
    if (props && props.length > 0) {
        for (let i = 0; i < props.length; i++) {
            // separator
            if (i > 0) {
                state = writeJsToken(state, `, `);
            }
            state = writeEndline(state);
			state = writeTargetIndent(state);

            // write prop
            const propASt: IAstNode = props[i];
            let propResult = compileAstNode(propASt, state);
            if (propResult) {
                state = propResult.state;
            }
        }
    }
    // }
    state = writeEndline(state);
	state = addTargetIndent(state, -1);
	state = writeTargetIndent(state);
    state = writeJsToken(state, `}`);

    // result
    return {
        state,
        result: ast
    }
}
export const compileUpdateExpression = (node: IAstNode, state: ICompilerState): ICompileResult<IAstUpdateExpression> => {
    let ast = astFactory.asNode<IAstUpdateExpression>(node, AstNodeType.UpdateExpression);
    if (!ast || !state) {
        return undefined;
    }

    if (ast.prefix === true) {
        // write operator
        if (ast.operator) {
            state = addSourceMapAtCurrentPlace(state, undefined, ast.operator.start);
        }
        let operatorResult = compileAstNode(ast.operator, state);
        if (operatorResult) {
            state = operatorResult.state;
        }
    }

    // write argument
    let argResult = compileAstNode(ast.argument, state);
    if (argResult) {
        state = argResult.state;
    }

    if (!ast.prefix) {
        // this is postfix
        // write operator
        let operatorResult = compileAstNode(ast.operator, state);
        if (operatorResult) {
            state = operatorResult.state;
        }
    }

    // result
    return {
        state,
        result: ast
    }
}
export const compileKeyword = (node: IAstNode, state: ICompilerState): ICompileResult<IAstKeyword> => {
    let ast = astFactory.asNode<IAstKeyword>(node, AstNodeType.Keyword);
    if (!ast || !state) {
        return undefined;
    }

    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, ast.keywordType);

    return {
        state,
        result: ast
    }
}
export const compileConditionalExpression = (node: IAstNode, state: ICompilerState): ICompileResult<IAstConditionalExpression> => {
    let ast = astFactory.asNode<IAstConditionalExpression>(node, AstNodeType.ConditionalExpression);
    if (!ast || !state) {
        return undefined;
    }

    // condition ? then : else
    let condResult = compileAstNode(ast.condition, state);
    if (condResult) {
        state = condResult.state;
    }

    // ?
    state = writeJsToken(state, ` ? `);

    // then
    if (ast.whenTrue) {
        state = addSourceMapAtCurrentPlace(state, undefined, ast.whenTrue.start);
    }
    let thenResult = compileAstNode(ast.whenTrue, state);
    if (thenResult) {
        state = thenResult.state;
    }

    // :
    state = writeJsToken(state, ` : `);

    // else
    if (ast.whenFalse) {
        state = addSourceMapAtCurrentPlace(state, undefined, ast.whenFalse.start);
    }
    let elseResult = compileAstNode(ast.whenFalse, state);
    if (elseResult) {
        state = elseResult.state;
    }

    return {
        state,
        result: ast
    }
}
export const compileIndexerExpression = (node: IAstNode, state: ICompilerState): ICompileResult<IAstIndexerExpression> => {
    let ast = astFactory.asNode<IAstIndexerExpression>(node, AstNodeType.IndexerExpression);
    if (!ast || !state) {
        return undefined;
    }

    // write object[property]

    let member = ast.member;
    if (member) {
        // write obj
        if (member.object) {
            state = addSourceMapAtCurrentPlace(state, undefined, member.object.start);
        }
        let objResult = compileAstNode(member.object, state);
        if (objResult) {
            state = objResult.state;
        }

        // write [
        state = writeJsToken(state, `[`);

        // write property
        let propResult = compileAstNode(member.property, state);
        if (propResult) {
            state = propResult.state;
        }

        // write ]
        state = writeJsToken(state, `]`);
    }

    return {
        state,
        result: ast
    }
}
export const compileTryStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstTryStatement> => {
    let ast = astFactory.asNode<IAstTryStatement>(node, AstNodeType.TryStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write try
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `try `);
    // write body 
    let bodyResult = compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    state = writeEndline(state);

    // write catch
    let catchResult = compileAstNode(ast.catchClause, state);
    if (catchResult) {
        state = catchResult.state;
    }
    state = writeEndline(state);

    // write finally
    let finallyResult = compileAstNode(ast.finallyBlock, state);
    if (finallyResult) {
        state = finallyResult.state;
    }
    state = writeEndline(state);

    return {
        state,
        result: ast
    }
}
export const compileCatchStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstCatchStatement> => {
    let ast = astFactory.asNode<IAstCatchStatement>(node, AstNodeType.CatchStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write catch
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `catch `);
    // write error declaration if any
    if (ast.varDeclaration) {
        state = writeJsToken(state, `(`);
        let varResult = compileAstNode(ast.varDeclaration, state);
        if (varResult) {
            state = varResult.state;
        }
        state = writeJsToken(state, `) `);
    }
    // write body 
    let bodyResult = compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }

    return {
        state,
        result: ast
    }
}
export const compileFinallyStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstFinallyStatement> => {
    let ast = astFactory.asNode<IAstFinallyStatement>(node, AstNodeType.FinallyStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write catch
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `finally `);
    // write body 
    let bodyResult = compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }

    return {
        state,
        result: ast
    }
}
export const compileDebuggerKeyword = (node: IAstNode, state: ICompilerState): ICompileResult<IAstDebuggerKeyword> => {
    let ast = astFactory.asNode<IAstDebuggerKeyword>(node, AstNodeType.DebuggerKeyword);
    if (!ast || !state) {
        return undefined;
    }

    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, ast.keywordType);

    return {
        state,
        result: ast
    }
}
export const compileThrowStatement = (node: IAstNode, state: ICompilerState): ICompileResult<IAstThrowStatement> => {
    let ast = astFactory.asNode<IAstThrowStatement>(node, AstNodeType.ThrowStatement);
    if (!ast || !state) {
        return undefined;
    }

    // write throw
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `throw `);

    // write expression
    let exprResult = compileAstNode(ast.expression, state);
    if (exprResult) {
        state = exprResult.state;
    }

    return {
        state,
        result: ast
    }
}
export const compileNewExpression = (node: IAstNode, state: ICompilerState): ICompileResult<IAstNewExpression> => {
    let ast = astFactory.asNode<IAstNewExpression>(node, AstNodeType.NewExpression);
    if (!ast || !state) {
        return undefined;
    }

    // write throw
    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, `new `);

    // write expression
    let exprResult = compileAstNode(ast.expression, state);
    if (exprResult) {
        state = exprResult.state;
    }

    return {
        state,
        result: ast
    }
}

export const compileToken = (node: IAstNode, state: ICompilerState): ICompileResult<IAstToken> => {
    let ast = astFactory.asNode<IAstToken>(node, AstNodeType.Token);
    if (!ast || !state) {
        return undefined;
    }

	let value = ast.token.value;
	if (value === "`") {
		value = "\\`";
	}
    state = writeJsToken(state, value || '');
    return {
        state,
        result: ast
    }
}
export const compileTokenSequence = (node: IAstNode, state: ICompilerState): ICompileResult<IAstTokenSequence> => {
    let ast = astFactory.asNode<IAstTokenSequence>(node, AstNodeType.TokenSequence);
    if (!ast || !state) {
        return undefined;
    }

    for (let i = 0; i < ast.tokens.length; i++) {
        const token: ICodeToken = ast.tokens[i];
        state = writeJsToken(state, token.value || '');
    }

    return {
        state,
        result: ast
    }
}
export const compileOperator = (node: IAstNode, state: ICompilerState): ICompileResult<IAstOperator> => {
    let ast = astFactory.asNode<IAstOperator>(node, AstNodeType.Operator);
    if (!ast || !state) {
        return undefined;
    }

    state = addSourceMapAtCurrentPlace(state, undefined, ast.start);
    state = writeJsToken(state, ast.value || '');
    return {
        state,
        result: ast
    }
}
export const compileStringLiteral = (node: IAstNode, state: ICompilerState): ICompileResult<IAstString> => {
    let ast = astFactory.asNode<IAstString>(node, AstNodeType.String);
    if (!ast || !state) {
        return undefined;
    }

	// add sourcemap
	state = addSourceMapAtCurrentPlace(state, undefined, ast.start);

    // open `
    state = writeJsToken(state, ast.allowIncludes ? '`' : '\'');

    let content = ast.value;
    for (let i = 0; i < content.length; i++) {
        const contentItem = content[i];
        let compileItemResult = compileAstNode(contentItem, state);
        if (compileItemResult) {
            state = compileItemResult.state;
        }
    }

    // close `
    state = writeJsToken(state, ast.allowIncludes ? '`' : '\'');

    return {
        state,
        result: ast
    }
}

export const writeIndentScope = (indentScope: IIndentScopeItem[], state: ICompilerState, astPos?: ISymbolPosition): ICompilerState => {
    if (!state) {
        return undefined;
    }

    if (astPos) {
        state = addSourceMapAtCurrentPlace(state, undefined, astPos);
    }

    // context['
    state = writeJsToken(state, `${compilerConfig.contextVarName}`);

    for (let i = 0; i < indentScope.length; i++) {
        const indentItem = indentScope[i];
        state = writeJsToken(state, "[\`");

        // compile indent identifier
        let itemResult = compileAstNode(indentItem.identifier, state);
        if (itemResult) {
            state = itemResult.state;
        }

        state = writeJsToken(state, "\`]");
    }

    // done
    return state;
}


// SYSTEM FUNCTIONS

export const isEndOfFile = (state: ICompilerState): boolean => {
    if (!state || !state.sourceState || !state.sourceState.ast || state.sourceState.ast.length === 0) {
        return true;
    }

    let astIndex = state.sourceState.astIndex;
    if (state.sourceState.ast.length > astIndex - 1) {
        return false;
    }

    return true;
}

export const getParentScope = (indent: number, state: ICompilerState): IIndentScopeItem[] => {
    if (!state) {
        return undefined;
    }

    // check indent and scope
    let sourceState = state.sourceState;
    let indentScope = sourceState.indentScope;
    let parentScope: IIndentScopeItem[] = [];

    // find ident scope item we are child of
    let parentItemsCount: number = 0;
    for (let i = 0; i < indentScope.length; i++) {
        const scopeItem: IIndentScopeItem = indentScope[i];
        let scopeIndent = scopeItem.indent;
        if (indent > scopeIndent) {
            parentItemsCount = i + 1;
        }
    }

    // cut all after scope item index
    if (parentItemsCount > indentScope.length) {
        parentItemsCount = indentScope.length;
    }
    parentScope = [...indentScope.slice(0, parentItemsCount)];
    return parentScope;
}
export const addIndentScopeItem = (scopeItem: IIndentScopeItem, state: ICompilerState): ICompilerState => {
    if (!state || !scopeItem) {
        return state;
    }

    state = {
        ...state,
        sourceState: {
            ...state.sourceState,
            indentScope: [...state.sourceState.indentScope, scopeItem]
        }
    };

    return state;
}
export const setIndentScope = (scope: IIndentScopeItem[], state: ICompilerState): ICompilerState => {
    if (!state || !scope) {
        return state;
    }

    state = {
        ...state,
        sourceState: {
            ...state.sourceState,
            indentScope: scope
        }
    };

    return state;
}
export const skipAst = (state: ICompilerState, count: number = 1): ICompilerState => {
    for (let i = 0; i < count; i++) {
        if (isEndOfFile(state)) {
            break;
        }

        let astIndex = state.sourceState.astIndex + 1;
        let sourceState = {
            ...state.sourceState,
            astIndex
        };

        state = {
            ...state,
            sourceState
        };
    }

    return state;
}

export const getAst = (state: ICompilerState): IAstNode => {
    if (isEndOfFile(state)) {
        return undefined;
    }

    let ast = state.sourceState.ast[state.sourceState.astIndex];
    return ast;
}

export const addJavascript = (state: ICompilerState, javascript: string[]): ICompilerState => {
    if (!state || !javascript) {
        return state;
    }

    let targetState: ITargetState = {
        ...state.targetState,
        javascript: [...state.targetState.javascript, ...javascript]
    };
    state = {
        ...state,
        targetState
    }

    return state;
}

export const getIdentifierFromNode = (node: IAstNode, state: ICompilerState): IAstIdentifier => {
	if (!node) {
		return undefined;
	}

	let identifier = astFactory.asNode<IAstIdentifier>(node, AstNodeType.Identifier);
	if (identifier) {
		return identifier;
	}

	let rawIdentifier = astFactory.asNode<IAstRawIdentifier>(node, AstNodeType.RawIdentifier);
	if (rawIdentifier) {
		identifier = astFactory.asNode<IAstIdentifier>(rawIdentifier.value, AstNodeType.Identifier);
		if (identifier) {
			return identifier;
		}
	}

	let contextIdentifier = astFactory.asNode<IAstContextIdentifier>(node, AstNodeType.ContextIdentifier);
	if (contextIdentifier){
		identifier = getIdentifierFromNode(contextIdentifier.value, state);
		if (identifier) {
			return identifier;
		}
	}

	return undefined;
}

export const getIdentifierFullName = (node: IAstIdentifier, indentScope: IIndentScopeItem[], state: ICompilerState): string => {
	if (!indentScope) {
		return undefined;
	}

    // context['
	let result = [compilerConfig.contextVarName];

    for (let i = 0; i < indentScope.length; i++) {
        const indentItem = indentScope[i];
        result.push('[\`');

		let identifier = getIdentifierFromNode(indentItem.identifier, state);
		if (identifier) {
			result.push(identifier.value);
		}

		result.push('\`]');
    }

	if (node) {
		result.push(`[\`${node.value}\`]`);
	}

	return result.join('');
}

export const addSourceMaps = (state: ICompilerState, sourceMaps: ISourceMapToken[]): ICompilerState => {
    if (!state || !sourceMaps) {
        return state;
    }

    let targetState: ITargetState = {
        ...state.targetState,
        sourceMaps: [...state.targetState.sourceMaps, ...sourceMaps]
    };
    state = {
        ...state,
        targetState
    }

    return state;
}

export const addSourceMap = (state: ICompilerState, sourceMap: ISourceMapToken): ICompilerState => {
    if (!state || !sourceMap) {
        return state;
    }

    let targetState: ITargetState = {
        ...state.targetState,
        sourceMaps: [...state.targetState.sourceMaps, sourceMap]
    };

    state = {
        ...state,
        targetState
    }

    return state;
}

export const addSourceMapAtCurrentPlace = (state: ICompilerState, tokenName?: string, symbolPos?: ISymbolPosition, jsLineOffset?: number, stsLineOffset?:number): ICompilerState => {
    if (!state) {
        return state;
    }

    if (!symbolPos) {
        return state;
    }

    let targetState = state.targetState;
    let cursor = targetState.cursor;

    let sourceFileName = state.sourceState.fileName;
    let sourceMapToken: ISourceMapToken = undefined;
    
    let jsOffset = jsLineOffset ? jsLineOffset : 0;
    let stsOffset = stsLineOffset ? stsLineOffset : 0;

    if (symbolPos) {
        sourceMapToken = {
            generated: {
                line: cursor.line + 1 /* line number in generated JS */,
                column: cursor.column + jsOffset /* column number in generated JS */
            },
            original: {
                line: symbolPos.line + 1 /* line number in StoryTailor source */,
                column: symbolPos.column + stsOffset/* column number in StoryTailor source */
            },
            source: sourceFileName/* name of the StoryTailor source file */,
            name: tokenName
        };
    }

    if (sourceMapToken) {
        state = addSourceMap(state, sourceMapToken);
    }

    return state;
}

export const isNeedToLinkSourcemap = (astNode: IAstNode): boolean => {
    if (!astNode) {
        return false;
    }

    if (compilerConfig.sourceMappableAstNodes[astNode.nodeType] === true) {
        return true;
    }

    return false;
}

export const addTargetIndent = (state: ICompilerState, amount: number = 1): ICompilerState => {
	if (!state || !state.targetState) {
		return state;
	}

	state = setIndent(state, state.targetState.indent + amount);

	return state;
}

export const setIndent = (state: ICompilerState, indent: number): ICompilerState => {
	if (!state || !state.targetState) {
		return state;
	}

	let targetState = state.targetState;
	targetState = {
		...targetState,
		indent: indent
	}

	state = {
		...state,
		targetState
	}

	return state;
}

export const writeTargetIndent = (state: ICompilerState): ICompilerState => {
	if (!state || !state.targetState || state.targetState.indent === 0) {
		return state;
	}

	state = writeJsToken(state, "\t".repeat(state.targetState.indent));
	return state;
}

export const writeJavascript = (state: ICompilerState, javascript: string): ICompilerState => {
    if (!state) {
        return state;
    }

    // write javascript
    if (javascript && javascript.length > 0) {
        // split javascript by endlines
        let jsLines = javascript.split(/\r?\n/);
        for (let i = 0; i < jsLines.length; i++) {
            const jsLine = jsLines[i];

            // if it's not first line, write endline
            if (i > 0) {
                state = writeJsToken(state, compilerConfig.endlineSymbol);
            }

            // write line text
            state = writeJsToken(state, jsLine);
        }
    }

    // prepare result
    return state;
}
export const writeEndline = (state: ICompilerState): ICompilerState => {
    return writeJavascript(state, compilerConfig.endlineSymbol);
}
export const writeJsToken = (state: ICompilerState, jsToken: string): ICompilerState => {
    if (!state || !jsToken || jsToken.length === 0) {
        return state;
    }

    let targetState = state.targetState;
    let cursor = targetState.cursor;
    let javascript = targetState.javascript;

    // check is it endline
    if (jsToken.match(/\r?\n/)) {
        // endline

        // cursor
        cursor = {
            ...cursor,
            line: cursor.line + 1,
            column: 0,
            symbol: cursor.symbol + jsToken.length
        };

        // target state
        javascript = [...javascript, ''];
        targetState = {
            ...targetState,
            cursor,
            javascript
        };

        // update state
        state = {
            ...state,
            targetState
        };

        // return result
        return state;
    }

    // if we here that means token is not endline

    // cursor
    cursor = {
        ...cursor,
        column: cursor.column + jsToken.length,
        symbol: cursor.symbol + jsToken.length
    };

    // target state
    let jsLine = javascript.length > 0 ? javascript.length - 1 : 0;
    let lastLine: string = '';
    if (javascript.length > 0) {
        lastLine = javascript[jsLine];
    }
    else {
        javascript = [lastLine];
    }
    lastLine = lastLine + jsToken;
    javascript[jsLine] = lastLine;

    targetState = {
        ...targetState,
        cursor,
        javascript
    };

    // update state
    state = {
        ...state,
        targetState
    };

    return state;
}

export const toStringSafe = (value: any): string => {
    if (!value) {
        return undefined;
    }

    return value.toString();
}