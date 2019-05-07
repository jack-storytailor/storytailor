"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const source_map_1 = require("source-map");
const AstNodeType_1 = require("../ast/AstNodeType");
const astFactory_1 = require("../ast/astFactory");
const VariableDeclarationKind_1 = require("../ast/VariableDeclarationKind");
const path = require("path");
const textFieldName = "__text";
exports.compilerConfig = {
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
};
const getEnvPath = (request) => {
    let environmentPath = request.environmentPath || exports.compilerConfig.environmentPath;
    // prepare environment path
    if (request.environmentPath) {
        environmentPath = environmentPath || exports.compilerConfig.environmentPath;
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
        environmentPath = exports.compilerConfig.environmentPath;
    }
    environmentPath = escapeRegExp(environmentPath);
    return environmentPath;
};
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
exports.compileSingleNode = (ast) => {
    let cursor = Object.assign({}, ast[0].start);
    // prepare compile state
    let sourceState = {
        ast: [ast],
        astIndex: 0,
        cursor,
        fileName: 'nofile',
        indent: 0,
        indentScope: [],
    };
    let targetState = {
        cursor,
        javascript: [],
        sourceMaps: [],
        fileName: 'nofile'
    };
    let state = {
        sourceState,
        targetState
    };
    // compile node
    let compileResult = exports.compileAstNode(ast, state);
    if (!compileResult) {
        return undefined;
    }
    state = compileResult.state;
    // prepare result
    let javascriptLines = state.targetState.javascript;
    let javascript = javascriptLines.join("\r\n");
    return javascript;
};
exports.compile = (request) => {
    if (!request || !request.ast || request.ast.length === 0) {
        return undefined;
    }
    // prepare state
    let ast = request.ast;
    let cursor = Object.assign({}, ast[0].start);
    let sourceState = {
        ast,
        astIndex: 0,
        cursor,
        fileName: request.sourceFileName,
        indent: 0,
        indentScope: [],
    };
    let targetState = {
        cursor,
        javascript: [],
        sourceMaps: [],
        fileName: request.targetFileName
    };
    let state = {
        sourceState,
        targetState
    };
    // write module header
    // env
    let environmentPath = getEnvPath(request);
    state = exports.writeJsToken(state, `let ${exports.compilerConfig.environmentVarName} = require(\`${environmentPath}\`);`);
    state = exports.writeEndline(state);
    // context
    state = exports.writeJsToken(state, `let ${exports.compilerConfig.contextVarName} = { ${exports.compilerConfig.textFieldName}: [] };`);
    state = exports.writeEndline(state);
    // serializer
    state = exports.writeJsToken(state, `let ${exports.compilerConfig.serializerVarName} = ${exports.compilerConfig.environmentVarName}.${exports.compilerConfig.getSerializerFuncName}();`);
    state = exports.writeEndline(state);
    state = exports.writeEndline(state);
    // compile ast
    while (!exports.isEndOfFile(state)) {
        // compile ast node
        let compileAstResult = exports.compileAstNode(exports.getAst(state), state);
        if (compileAstResult) {
            state = compileAstResult.state;
            state = exports.skipAst(state);
            continue;
        }
        // otherwise this ast node is something uncompilable. skip it
        state = exports.skipAst(state);
    }
    // write module footer
    state = exports.writeEndline(state);
    state = exports.writeEndline(state);
    state = exports.writeJsToken(state, `// INFO: this trick is for making this file node module`);
    state = exports.writeEndline(state);
    state = exports.writeJsToken(state, `module.exports = ${exports.compilerConfig.contextVarName};`);
    state = exports.writeEndline(state);
    // prepare source maps
    let sourceMapTokens = state.targetState.sourceMaps;
    // generate source map text
    let mapGenerator = new source_map_1.SourceMapGenerator({
        file: state.sourceState.fileName
    });
    for (let smi = 0; smi < sourceMapTokens.length; smi++) {
        const smToken = sourceMapTokens[smi];
        mapGenerator.addMapping(smToken);
    }
    let sourceMaps = mapGenerator.toString();
    // prepare result
    let javascriptLines = state.targetState.javascript;
    let javascript = javascriptLines.join("\r\n");
    return {
        state,
        javascript,
        javascriptLines,
        request,
        sourceMaps
    };
};
exports.compileAstNode = (ast, state) => {
    if (!ast) {
        return undefined;
    }
    // general
    // module
    let moduleResult = exports.compileAstModule(ast, state);
    if (moduleResult) {
        return moduleResult;
    }
    // outer statement
    let outerStatementResult = exports.compileOuterStatement(ast, state);
    if (outerStatementResult) {
        return outerStatementResult;
    }
    // block statement
    let compileBlockResult = exports.compileBlockStatement(ast, state);
    if (compileBlockResult) {
        return compileBlockResult;
    }
    // object line
    let compileObjectLineResult = exports.compileObjectLine(ast, state);
    if (compileObjectLineResult) {
        return compileObjectLineResult;
    }
    // string literal
    let stringResult = exports.compileStringLiteral(ast, state);
    if (stringResult) {
        return stringResult;
    }
    // string include
    let stringIncludeResult = exports.compileStringInclude(ast, state);
    if (stringIncludeResult) {
        return stringIncludeResult;
    }
    // raw identifier
    let rawIdentResult = exports.compileRawIdentifier(ast, state);
    if (rawIdentResult) {
        return rawIdentResult;
    }
    // context identifier
    let contextIdentResult = exports.compileContextIdentifier(ast, state);
    if (contextIdentResult) {
        return contextIdentResult;
    }
    // statement
    let compileStatementResult = exports.compileStatement(ast, state);
    if (compileStatementResult) {
        return compileStatementResult;
    }
    // binary operation
    let binaryOpResult = exports.compileBinaryExpression(ast, state);
    if (binaryOpResult) {
        return binaryOpResult;
    }
    // member expression
    let memberResult = exports.compileMemberExpression(ast, state);
    if (memberResult) {
        return memberResult;
    }
    // call expression
    let callResult = exports.compileCallExpression(ast, state);
    if (callResult) {
        return callResult;
    }
    // delete expression
    let deleteResult = exports.compileDeleteExpression(ast, state);
    if (deleteResult) {
        return deleteResult;
    }
    // delete line expression
    let deleteLineResult = exports.compileDeleteLine(ast, state);
    if (deleteLineResult) {
        return deleteLineResult;
    }
    // text line
    let textLineResult = exports.compileTextLine(ast, state);
    if (textLineResult) {
        return textLineResult;
    }
    // number
    let numberResult = exports.compileNumber(ast, state);
    if (numberResult) {
        return numberResult;
    }
    // boolean
    let booleanResult = exports.compileBoolean(ast, state);
    if (booleanResult) {
        return booleanResult;
    }
    // identifier
    let identifierResult = exports.compileIdentifier(ast, state);
    if (identifierResult) {
        return identifierResult;
    }
    // identifier scope
    let identifierScopeResult = exports.compileIdentifierScope(ast, state);
    if (identifierScopeResult) {
        return identifierScopeResult;
    }
    // token
    let tokenResult = exports.compileToken(ast, state);
    if (tokenResult) {
        return tokenResult;
    }
    // token sequence
    let tokenSequeceResult = exports.compileTokenSequence(ast, state);
    if (tokenSequeceResult) {
        return tokenSequeceResult;
    }
    // operator
    let operatorResult = exports.compileOperator(ast, state);
    if (operatorResult) {
        return operatorResult;
    }
    // var declaration
    let varDeclarResult = exports.compileVarDeclaration(ast, state);
    if (varDeclarResult) {
        return varDeclarResult;
    }
    // program
    let programResult = exports.compileProgram(ast, state);
    if (programResult) {
        return programResult;
    }
    // function declaration
    let funcDeclarResult = exports.compileFuncDeclaration(ast, state);
    if (funcDeclarResult) {
        return funcDeclarResult;
    }
    // return statement
    let returnStatementResult = exports.compileReturnStatement(ast, state);
    if (returnStatementResult) {
        return returnStatementResult;
    }
    // if
    let ifResult = exports.compileIfStatement(ast, state);
    if (ifResult) {
        return ifResult;
    }
    // while
    let whileResult = exports.compileWhileStatement(ast, state);
    if (whileResult) {
        return whileResult;
    }
    // do while
    let doWhileResult = exports.compileDoWhileStatement(ast, state);
    if (doWhileResult) {
        return doWhileResult;
    }
    // switch
    let switchResult = exports.compileSwitchStatement(ast, state);
    if (switchResult) {
        return switchResult;
    }
    // case
    let caseResult = exports.compileCaseStatement(ast, state);
    if (caseResult) {
        return caseResult;
    }
    // break
    let breakResult = exports.compileBreakStatement(ast, state);
    if (breakResult) {
        return breakResult;
    }
    // continue
    let continueResult = exports.compileContinueStatement(ast, state);
    if (continueResult) {
        return continueResult;
    }
    // paren expression
    let parenResult = exports.compileParenExpression(ast, state);
    if (parenResult) {
        return parenResult;
    }
    // import expression 
    let importResult = exports.compileImportStatement(ast, state);
    if (importResult) {
        return importResult;
    }
    // for statement
    let forResult = exports.compileForStatement(ast, state);
    if (forResult) {
        return forResult;
    }
    // for in statement
    let forInResult = exports.compileForInStatement(ast, state);
    if (forInResult) {
        return forInResult;
    }
    // property declaration
    let propResult = exports.compilePropertyDeclaration(ast, state);
    if (propResult) {
        return propResult;
    }
    // object literal
    let objLiteralResult = exports.compileObjectExpression(ast, state);
    if (objLiteralResult) {
        return objLiteralResult;
    }
    // array literal
    let arrayLiteralResult = exports.compileArrayLiteral(ast, state);
    if (arrayLiteralResult) {
        return arrayLiteralResult;
    }
    // update expression
    let updateExprResult = exports.compileUpdateExpression(ast, state);
    if (updateExprResult) {
        return updateExprResult;
    }
    // keyword
    let keywordResult = exports.compileKeyword(ast, state);
    if (keywordResult) {
        return keywordResult;
    }
    // conditional expression
    let condExpResult = exports.compileConditionalExpression(ast, state);
    if (condExpResult) {
        return condExpResult;
    }
    // indexer
    let indexerResult = exports.compileIndexerExpression(ast, state);
    if (indexerResult) {
        return indexerResult;
    }
    // try
    let tryResult = exports.compileTryStatement(ast, state);
    if (tryResult) {
        return tryResult;
    }
    // catch
    let catchResult = exports.compileCatchStatement(ast, state);
    if (catchResult) {
        return catchResult;
    }
    // finally
    let finallyResult = exports.compileFinallyStatement(ast, state);
    if (finallyResult) {
        return finallyResult;
    }
    // throw
    let throwResult = exports.compileThrowStatement(ast, state);
    if (throwResult) {
        return throwResult;
    }
    // new 
    let newResult = exports.compileNewExpression(ast, state);
    if (newResult) {
        return newResult;
    }
    // debugger
    let debuggerResult = exports.compileDebuggerKeyword(ast, state);
    if (debuggerResult) {
        return debuggerResult;
    }
    // default value is just a type of node
    state = exports.writeJsToken(state, ast.nodeType);
    return {
        state,
        result: ast
    };
};
exports.compileAstModule = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.AstModule);
    if (!state || !ast) {
        return undefined;
    }
    // compile module content
    let moduleContent = ast.content;
    if (moduleContent && moduleContent.content && moduleContent.content.length > 0) {
        for (let contentInd = 0; contentInd < moduleContent.content.length; contentInd++) {
            let contentNode = moduleContent.content[contentInd];
            let compileResult = exports.compileAstNode(contentNode, state);
            if (compileResult) {
                state = compileResult.state;
                state = exports.writeJsToken(state, `;`);
                state = exports.writeEndline(state);
            }
        }
    }
    // prepare result
    return {
        state,
        result: ast
    };
};
exports.compileOuterStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.OuterStatement);
    if (!state || !ast) {
        return undefined;
    }
    // check indent
    let newIndent = Math.floor(ast.indent / exports.compilerConfig.indentSize);
    let sourceState = state.sourceState;
    sourceState = Object.assign({}, sourceState, { indent: newIndent });
    state = Object.assign({}, state, { sourceState });
    // compile statement
    let compileStatementResult = exports.compileAstNode(ast.statement, state);
    if (compileStatementResult) {
        state = compileStatementResult.state;
    }
    // prepare result
    return {
        state,
        result: ast
    };
};
exports.compileBlockStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.BlockStatement);
    if (!ast || !state) {
        return undefined;
    }
    if (!ast.withoutBraces) {
        // open scope
        state = exports.writeJsToken(state, "{ ");
        state = exports.writeEndline(state);
    }
    // write all the statements
    let content = ast.content;
    if (content && content.length > 0) {
        for (let i = 0; i < content.length; i++) {
            // write \t
            state = exports.writeJsToken(state, '\t');
            const contentNode = content[i];
            let contentNodeResult = exports.compileAstNode(contentNode, state);
            if (contentNodeResult) {
                state = contentNodeResult.state;
            }
            // write ;
            state = exports.writeJsToken(state, ';');
            state = exports.writeEndline(state);
        }
    }
    if (!ast.withoutBraces) {
        // close scope
        state = exports.writeJsToken(state, " }");
    }
    return {
        state,
        result: ast
    };
};
exports.compileObjectLine = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ObjectLineStatement);
    if (!ast || !state) {
        return undefined;
    }
    let objectNode = ast.object;
    let initValue = ast.value;
    let parentScope = [];
    if (objectNode) {
        // check indent and scope
        let sourceState = state.sourceState;
        let myIndent = sourceState.indent;
        let scopeItem = {
            identifier: objectNode,
            indent: myIndent
        };
        parentScope = exports.getParentScope(myIndent, state);
        // add self as scope item
        state = exports.setIndentScope([...parentScope, scopeItem], state);
    }
    // write indent scope
    state = exports.writeIndentScope(state.sourceState.indentScope, state);
    // compile init value if any
    if (initValue) {
        state = exports.writeJsToken(state, " = ");
        // write init value
        let initValResult = exports.compileAstNode(initValue, state);
        if (initValResult) {
            state = initValResult.state;
        }
    }
    else {
        // if we have no init value, here is specific syntax
        // context[varname] = context[varname] || {};
        state = exports.writeJsToken(state, " = ");
        // write parent scope
        state = exports.writeIndentScope(state.sourceState.indentScope, state);
        // || {}
        state = exports.writeJsToken(state, ` || ${exports.compilerConfig.defaultObject}`);
    }
    return {
        state,
        result: ast
    };
};
exports.compileDeleteLine = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.DeleteLineExpression);
    if (!ast || !state) {
        return undefined;
    }
    let scopeToWrite = state.sourceState.indentScope;
    let objectNode = ast.object;
    if (objectNode) {
        // write delete
        state = exports.writeJsToken(state, `delete `);
        // check indent and scope
        let sourceState = state.sourceState;
        let myIndent = sourceState.indent;
        let scopeItem = {
            identifier: objectNode,
            indent: myIndent
        };
        let parentScope = exports.getParentScope(myIndent, state);
        scopeToWrite = [...parentScope, scopeItem];
        // write indent scope
        state = exports.writeIndentScope(scopeToWrite, state);
    }
    return {
        state,
        result: ast
    };
};
exports.compileStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Statement);
    if (!ast || !state) {
        return undefined;
    }
    let compileResult = exports.compileAstNode(ast.statement, state);
    if (compileResult) {
        state = compileResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileTextLine = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.TextLineStatement);
    if (!ast || !state) {
        return undefined;
    }
    // check indent
    let myIndent = Math.floor(ast.indent / exports.compilerConfig.indentSize);
    // get parent scope
    let parentScope = exports.getParentScope(myIndent, state);
    // save parent scope
    state = exports.setIndentScope(parentScope, state);
    // check whitespace
    let whitespaceLength = ast.indent;
    if (parentScope && parentScope.length > 0) {
        // get last item from scope
        let lastItem = parentScope[parentScope.length - 1];
        // if our indent is bigger than expected indent (parent indent + 2), 
        // then all excess indent symbols convert to spaces
        whitespaceLength = Math.max(0, ast.indent - exports.compilerConfig.indentSize - lastItem.indent * exports.compilerConfig.indentSize);
    }
    // create whitespace
    let whitespace = '';
    for (let i = 0; i < whitespaceLength; i++) {
        whitespace = whitespace + ' ';
    }
    // write indent scope
    state = exports.writeIndentScope(parentScope, state);
    // write [text]
    state = exports.writeJsToken(state, `['${exports.compilerConfig.textFieldName}']`);
    // write = 
    state = exports.writeJsToken(state, ` = `);
    // write = [...
    state = exports.writeJsToken(state, `[...`);
    // write indent scope
    state = exports.writeIndentScope(parentScope, state);
    // write [text]
    state = exports.writeJsToken(state, `['${exports.compilerConfig.textFieldName}']`);
    // write , 
    state = exports.writeJsToken(state, `, `);
    // write open `
    state = exports.writeJsToken(state, '`');
    // write whitespace
    state = exports.writeJsToken(state, whitespace);
    // write string content
    let content = ast.text;
    for (let i = 0; i < content.length; i++) {
        const contentItem = content[i];
        let compileItemResult = exports.compileAstNode(contentItem, state);
        if (compileItemResult) {
            state = compileItemResult.state;
        }
    }
    // write close `
    state = exports.writeJsToken(state, '`');
    // write ]
    state = exports.writeJsToken(state, `]`);
    // write ;
    state = exports.writeJsToken(state, ';');
    state = exports.writeEndline(state);
    return {
        state,
        result: ast
    };
};
exports.compileNumber = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Number);
    if (!ast || !state) {
        return undefined;
    }
    state = exports.writeJsToken(state, ast.value.toString());
    return {
        state,
        result: ast
    };
};
exports.compileBoolean = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Boolean);
    if (!ast || !state) {
        return undefined;
    }
    state = exports.writeJsToken(state, ast.value.toString());
    return {
        state,
        result: ast
    };
};
exports.compileIdentifier = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Identifier);
    if (!ast || !state) {
        return undefined;
    }
    state = exports.writeJsToken(state, ast.value);
    return {
        state,
        result: ast
    };
};
exports.compileIdentifierScope = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.IdentifierScope);
    if (!ast || !state) {
        return undefined;
    }
    // write items
    let valueItems = ast.value;
    if (valueItems && valueItems.length > 0) {
        for (let i = 0; i < valueItems.length; i++) {
            const itemNode = valueItems[i];
            let itemResult = exports.compileAstNode(itemNode, state);
            if (itemResult) {
                state = itemResult.state;
            }
        }
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileRawIdentifier = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.RawIdentifier);
    if (!ast || !state) {
        return undefined;
    }
    let compileResult = exports.compileAstNode(ast.value, state);
    if (compileResult) {
        state = compileResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileContextIdentifier = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ContextIdentifier);
    if (!ast || !state) {
        return undefined;
    }
    // this is not raw identifier, so add context before it
    state = exports.writeJsToken(state, `${exports.compilerConfig.contextVarName}`);
    // ['
    state = exports.writeJsToken(state, `['`);
    // write identifier
    var compileValResult = exports.compileAstNode(ast.value, state);
    if (compileValResult) {
        state = compileValResult.state;
    }
    //']
    state = exports.writeJsToken(state, `']`);
    return {
        state,
        result: ast
    };
};
exports.compileBinaryExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.BinaryExpression);
    if (!ast || !state) {
        return undefined;
    }
    // left operand
    let leftResult = exports.compileAstNode(ast.left, state);
    if (leftResult) {
        state = leftResult.state;
    }
    // add space
    state = exports.writeJsToken(state, ' ');
    // operator
    let compileOperatorResult = exports.compileAstNode(ast.operator, state);
    if (compileOperatorResult) {
        state = compileOperatorResult.state;
    }
    // add space
    state = exports.writeJsToken(state, ' ');
    // right operand
    let rightResult = exports.compileAstNode(ast.right, state);
    if (rightResult) {
        state = rightResult.state;
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileMemberExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.MemberExpression);
    if (!ast || !state) {
        return undefined;
    }
    // left operand
    let leftResult = exports.compileAstNode(ast.object, state);
    if (leftResult) {
        state = leftResult.state;
    }
    // [
    state = exports.writeJsToken(state, `['`);
    // right operand
    let rightResult = exports.compileAstNode(ast.property, state);
    if (rightResult) {
        state = rightResult.state;
    }
    // ]
    state = exports.writeJsToken(state, `']`);
    // result
    return {
        state,
        result: ast
    };
};
exports.compileStringInclude = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.StringIncludeStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write ${
    state = exports.writeJsToken(state, '${');
    // write serializer.serialize(
    state = exports.writeJsToken(state, `${exports.compilerConfig.serializerVarName}.${exports.compilerConfig.serializeFuncName}( `);
    // write expression
    let expResult = exports.compileAstNode(ast.expression, state);
    if (expResult) {
        state = expResult.state;
    }
    // write separator param
    state = exports.writeJsToken(state, `, '\\r\\n'`);
    // write serialize close paren )
    state = exports.writeJsToken(state, ` )`);
    // write }
    state = exports.writeJsToken(state, '}');
    // result
    return {
        state,
        result: ast
    };
};
exports.compileCallExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.CallExpression);
    if (!ast || !state) {
        return undefined;
    }
    // callee
    let calleeResult = exports.compileAstNode(ast.calee, state);
    if (calleeResult) {
        state = calleeResult.state;
    }
    // write open (
    state = exports.writeJsToken(state, '(');
    // write arguments
    let fArgs = ast.args;
    if (fArgs && fArgs.length > 0) {
        for (let i = 0; i < fArgs.length; i++) {
            // if it's not first item, write separator
            if (i > 0) {
                state = exports.writeJsToken(state, ', ');
            }
            const argNode = fArgs[i];
            let argResult = exports.compileAstNode(argNode, state);
            if (argResult) {
                state = argResult.state;
            }
        }
    }
    // write close )
    state = exports.writeJsToken(state, ')');
    // result
    return {
        state,
        result: ast
    };
};
exports.compileVarDeclaration = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.VariableDeclaration);
    if (!ast || !state) {
        return undefined;
    }
    // get prefix
    let prefix = "var";
    if (ast.kind === VariableDeclarationKind_1.VariableDeclarationKind.Const) {
        prefix = "const";
    }
    if (ast.kind === VariableDeclarationKind_1.VariableDeclarationKind.Let) {
        prefix = "let";
    }
    // write prefix
    state = exports.writeJsToken(state, `${prefix} `);
    // write varname
    let varnameResult = exports.compileAstNode(ast.identifier, state);
    if (varnameResult) {
        state = varnameResult.state;
    }
    // init value
    if (ast.value) {
        // write =
        state = exports.writeJsToken(state, ` = `);
        // write init value
        let initValResult = exports.compileAstNode(ast.value, state);
        if (initValResult) {
            state = initValResult.state;
        }
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileFuncDeclaration = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.FunctionDeclaration);
    if (!ast || !state) {
        return undefined;
    }
    // write function (
    state = exports.writeJsToken(state, `function (`);
    // write all the params
    let params = ast.args;
    if (params && params.length > 0) {
        for (let i = 0; i < params.length; i++) {
            // if it's not first item, add separator before
            if (i > 0) {
                state = exports.writeJsToken(state, `, `);
            }
            const param = params[i];
            let paramResult = exports.compileAstNode(param, state);
            if (paramResult) {
                state = paramResult.state;
            }
        }
    }
    // write )
    state = exports.writeJsToken(state, `) `);
    // write function body
    let bodyResult = exports.compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileProgram = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Program);
    if (!ast || !state) {
        return undefined;
    }
    // write {
    state = exports.writeJsToken(state, `{`);
    state = exports.writeEndline(state);
    let content = ast.content;
    if (content && content.length > 0) {
        for (let i = 0; i < content.length; i++) {
            const contentNode = content[i];
            let contentResult = exports.compileAstNode(contentNode, state);
            if (contentResult) {
                state = contentResult.state;
            }
            // add separator
            state = exports.writeJsToken(state, `;`);
            state = exports.writeEndline(state);
        }
    }
    // write }
    state = exports.writeJsToken(state, `}`);
    return {
        state,
        result: ast
    };
};
exports.compileReturnStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ReturnStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write return
    state = exports.writeJsToken(state, `return `);
    // write return value if any
    let valResult = exports.compileAstNode(ast.value, state);
    if (valResult) {
        state = valResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileDeleteExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.DeleteExpression);
    if (!ast || !state) {
        return undefined;
    }
    // write delete
    state = exports.writeJsToken(state, `delete `);
    // write delete value if any
    let valResult = exports.compileAstNode(ast.expression, state);
    if (valResult) {
        state = valResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileBreakStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.BreakStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write break
    state = exports.writeJsToken(state, `break`);
    return {
        state,
        result: ast
    };
};
exports.compileContinueStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ContinueStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write break
    state = exports.writeJsToken(state, `continue`);
    return {
        state,
        result: ast
    };
};
exports.compileIfStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.IfStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write if (
    state = exports.writeJsToken(state, `if (`);
    // write condition
    let conditionResult = exports.compileAstNode(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }
    // write )
    state = exports.writeJsToken(state, `) `);
    // write thenValue
    let thenResult = exports.compileAstNode(ast.thenValue, state);
    if (thenResult) {
        state = thenResult.state;
    }
    // write else if any
    if (ast.elseValue) {
        state = exports.writeJsToken(state, ` else `);
        let elseResult = exports.compileAstNode(ast.elseValue, state);
        if (elseResult) {
            state = elseResult.state;
        }
    }
    // return result
    return {
        state,
        result: ast
    };
};
exports.compileWhileStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.WhileStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write while (
    state = exports.writeJsToken(state, `while (`);
    // write condition
    let conditionResult = exports.compileAstNode(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }
    // write )
    state = exports.writeJsToken(state, `) `);
    // write body
    let bodyResult = exports.compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    // return result
    return {
        state,
        result: ast
    };
};
exports.compileDoWhileStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.DoWhileStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write do
    state = exports.writeJsToken(state, `do `);
    // write body
    let bodyResult = exports.compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    // write while (
    state = exports.writeJsToken(state, ` while (`);
    // write condition
    let conditionResult = exports.compileAstNode(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }
    // write )
    state = exports.writeJsToken(state, `)`);
    // return result
    return {
        state,
        result: ast
    };
};
exports.compileSwitchStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.SwitchStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write while (
    state = exports.writeJsToken(state, `switch (`);
    // write condition
    let conditionResult = exports.compileAstNode(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }
    // write )
    state = exports.writeJsToken(state, `) `);
    // write {
    state = exports.writeJsToken(state, `{`);
    state = exports.writeEndline(state);
    // write cases
    let cases = ast.cases;
    if (cases && cases.length > 0) {
        for (let i = 0; i < cases.length; i++) {
            const caseNode = cases[i];
            let caseResult = exports.compileAstNode(caseNode, state);
            if (caseResult) {
                state = caseResult.state;
            }
            state = exports.writeEndline(state);
        }
    }
    // write }
    state = exports.writeEndline(state);
    state = exports.writeJsToken(state, `}`);
    // return result
    return {
        state,
        result: ast
    };
};
exports.compileCaseStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.CaseStatement);
    if (!ast || !state) {
        return undefined;
    }
    // check is default case
    let isDefaultCase = ast.condition === undefined;
    if (isDefaultCase === true) {
        // default case
        state = exports.writeJsToken(state, `default `);
    }
    else {
        // not a default case
        // write case
        state = exports.writeJsToken(state, `case `);
        // write condition
        let conditionResult = exports.compileAstNode(ast.condition, state);
        if (conditionResult) {
            state = conditionResult.state;
        }
    }
    // write :
    state = exports.writeJsToken(state, `: `);
    // write body
    if (ast.body && ast.body.length > 0) {
        for (let i = 0; i < ast.body.length; i++) {
            state = exports.writeEndline(state);
            const bodyItem = ast.body[i];
            let itemResult = exports.compileAstNode(bodyItem, state);
            if (itemResult) {
                state = itemResult.state;
            }
            state = exports.writeJsToken(state, `;`);
        }
    }
    // write consequent
    if (ast.consequent) {
        state = exports.writeEndline(state);
        let consequentResult = exports.compileAstNode(ast.consequent, state);
        if (consequentResult) {
            state = consequentResult.state;
        }
    }
    return {
        state,
        result: ast
    };
};
exports.compileParenExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ParenExpression);
    if (!ast || !state) {
        return undefined;
    }
    // write (
    state = exports.writeJsToken(state, `(`);
    // write content
    let contentResult = exports.compileAstNode(ast.expression, state);
    if (contentResult) {
        state = contentResult.state;
    }
    // write )
    state = exports.writeJsToken(state, `)`);
    return {
        state,
        result: ast
    };
};
exports.compileImportStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ImportStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write identifier
    let identifierResult = exports.compileAstNode(ast.identifier, state);
    if (identifierResult) {
        state = identifierResult.state;
    }
    // write = 
    state = exports.writeJsToken(state, ` = `);
    // write require('
    // state = writeJsToken(state, `require('${ast.path}')`);
    state = exports.writeJsToken(state, `require(`);
    // write import path
    let pathResult = exports.compileAstNode(ast.path, state);
    if (pathResult) {
        state = pathResult.state;
    }
    // write )
    state = exports.writeJsToken(state, `)`);
    return {
        state,
        result: ast
    };
};
exports.compilePropertyDeclaration = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.PropertyDeclaration);
    if (!ast || !state) {
        return undefined;
    }
    // write "identifier" : value
    // write identifier
    let identResult = exports.compileAstNode(ast.identifier, state);
    if (identResult) {
        state = identResult.state;
    }
    // write value if any
    if (ast.value) {
        // write :
        state = exports.writeJsToken(state, ` : `);
        // write value
        let valResult = exports.compileAstNode(ast.value, state);
        if (valResult) {
            state = valResult.state;
        }
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileForStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ForStatement);
    if (!ast || !state) {
        return undefined;
    }
    // for (
    state = exports.writeJsToken(state, `for (`);
    // write init 
    let initResult = exports.compileAstNode(ast.init, state);
    if (initResult) {
        state = initResult.state;
    }
    state = exports.writeJsToken(state, `; `);
    // write test
    let testResult = exports.compileAstNode(ast.test, state);
    if (testResult) {
        state = testResult.state;
    }
    state = exports.writeJsToken(state, `; `);
    // write update
    let updateResult = exports.compileAstNode(ast.update, state);
    if (updateResult) {
        state = updateResult.state;
    }
    // )
    state = exports.writeJsToken(state, `)`);
    state = exports.writeEndline(state);
    // write body
    let bodyResult = exports.compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileForInStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ForInStatement);
    if (!ast || !state) {
        return undefined;
    }
    // for (
    state = exports.writeJsToken(state, `for (`);
    // write left
    let leftResult = exports.compileAstNode(ast.left, state);
    if (leftResult) {
        state = leftResult.state;
    }
    // write in
    state = exports.writeJsToken(state, ` in `);
    // write right
    let rightResult = exports.compileAstNode(ast.right, state);
    if (rightResult) {
        state = rightResult.state;
    }
    // )
    state = exports.writeJsToken(state, `)`);
    state = exports.writeEndline(state);
    // write body
    let bodyResult = exports.compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileArrayLiteral = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Array);
    if (!ast || !state) {
        return undefined;
    }
    // [
    state = exports.writeJsToken(state, `[`);
    // write items
    let items = ast.value;
    if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
            // separator
            if (i > 0) {
                state = exports.writeJsToken(state, `, `);
            }
            state = exports.writeEndline(state);
            // write item
            const itemAst = items[i];
            let itemResult = exports.compileAstNode(itemAst, state);
            if (itemResult) {
                state = itemResult.state;
            }
        }
    }
    // ]
    state = exports.writeEndline(state);
    state = exports.writeJsToken(state, `]`);
    // result
    return {
        state,
        result: ast
    };
};
exports.compileObjectExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ObjectExpression);
    if (!ast || !state) {
        return undefined;
    }
    // {
    state = exports.writeJsToken(state, `{`);
    // write properties
    let props = ast.properties;
    if (props && props.length > 0) {
        for (let i = 0; i < props.length; i++) {
            // separator
            if (i > 0) {
                state = exports.writeJsToken(state, `, `);
            }
            state = exports.writeEndline(state);
            // write prop
            const propASt = props[i];
            let propResult = exports.compileAstNode(propASt, state);
            if (propResult) {
                state = propResult.state;
            }
        }
    }
    // }
    state = exports.writeEndline(state);
    state = exports.writeJsToken(state, `}`);
    // result
    return {
        state,
        result: ast
    };
};
exports.compileUpdateExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.UpdateExpression);
    if (!ast || !state) {
        return undefined;
    }
    if (ast.prefix === true) {
        // write operator
        let operatorResult = exports.compileAstNode(ast.operator, state);
        if (operatorResult) {
            state = operatorResult.state;
        }
    }
    // write argument
    let argResult = exports.compileAstNode(ast.argument, state);
    if (argResult) {
        state = argResult.state;
    }
    if (!ast.prefix) {
        // this is postfix
        // write operator
        let operatorResult = exports.compileAstNode(ast.operator, state);
        if (operatorResult) {
            state = operatorResult.state;
        }
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileKeyword = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Keyword);
    if (!ast || !state) {
        return undefined;
    }
    state = exports.writeJsToken(state, ast.keywordType);
    return {
        state,
        result: ast
    };
};
exports.compileConditionalExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ConditionalExpression);
    if (!ast || !state) {
        return undefined;
    }
    // condition ? then : else
    let condResult = exports.compileAstNode(ast.condition, state);
    if (condResult) {
        state = condResult.state;
    }
    // ?
    state = exports.writeJsToken(state, ` ? `);
    // then
    let thenResult = exports.compileAstNode(ast.whenTrue, state);
    if (thenResult) {
        state = thenResult.state;
    }
    // :
    state = exports.writeJsToken(state, ` : `);
    // else
    let elseResult = exports.compileAstNode(ast.whenFalse, state);
    if (elseResult) {
        state = elseResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileIndexerExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.IndexerExpression);
    if (!ast || !state) {
        return undefined;
    }
    // write object[property]
    let member = ast.member;
    if (member) {
        // write obj
        let objResult = exports.compileAstNode(member.object, state);
        if (objResult) {
            state = objResult.state;
        }
        // write [
        state = exports.writeJsToken(state, `[`);
        // write property
        let propResult = exports.compileAstNode(member.property, state);
        if (propResult) {
            state = propResult.state;
        }
        // write ]
        state = exports.writeJsToken(state, `]`);
    }
    return {
        state,
        result: ast
    };
};
exports.compileTryStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.TryStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write try
    state = exports.writeJsToken(state, `try `);
    // write body 
    let bodyResult = exports.compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    state = exports.writeEndline(state);
    // write catch
    let catchResult = exports.compileAstNode(ast.catchClause, state);
    if (catchResult) {
        state = catchResult.state;
    }
    state = exports.writeEndline(state);
    // write finally
    let finallyResult = exports.compileAstNode(ast.finallyBlock, state);
    if (finallyResult) {
        state = finallyResult.state;
    }
    state = exports.writeEndline(state);
    return {
        state,
        result: ast
    };
};
exports.compileCatchStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.CatchStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write catch
    state = exports.writeJsToken(state, `catch `);
    // write error declaration if any
    if (ast.varDeclaration) {
        state = exports.writeJsToken(state, `(`);
        let varResult = exports.compileAstNode(ast.varDeclaration, state);
        if (varResult) {
            state = varResult.state;
        }
        state = exports.writeJsToken(state, `) `);
    }
    // write body 
    let bodyResult = exports.compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileFinallyStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.FinallyStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write catch
    state = exports.writeJsToken(state, `finally `);
    // write body 
    let bodyResult = exports.compileAstNode(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileDebuggerKeyword = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.DebuggerKeyword);
    if (!ast || !state) {
        return undefined;
    }
    state = exports.writeJsToken(state, ast.keywordType);
    return {
        state,
        result: ast
    };
};
exports.compileThrowStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ThrowStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write throw
    state = exports.writeJsToken(state, `throw `);
    // write expression
    let exprResult = exports.compileAstNode(ast.expression, state);
    if (exprResult) {
        state = exprResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileNewExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.NewExpression);
    if (!ast || !state) {
        return undefined;
    }
    // write throw
    state = exports.writeJsToken(state, `new `);
    // write expression
    let exprResult = exports.compileAstNode(ast.expression, state);
    if (exprResult) {
        state = exprResult.state;
    }
    return {
        state,
        result: ast
    };
};
// export const compile = (node: IAstNode, state: ICompilerState): ICompileResult<IAst> => {
//   let ast = astFactory.asNode<IAst>(node, AstNodeType.);
//   if (!ast || !state) {
//     return undefined;
//   }
//   return {
//     state,
//     result: ast
//   }  
// }
exports.compileToken = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Token);
    if (!ast || !state) {
        return undefined;
    }
    state = exports.writeJsToken(state, ast.token.value || '');
    return {
        state,
        result: ast
    };
};
exports.compileTokenSequence = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.TokenSequence);
    if (!ast || !state) {
        return undefined;
    }
    for (let i = 0; i < ast.tokens.length; i++) {
        const token = ast.tokens[i];
        state = exports.writeJsToken(state, token.value || '');
    }
    return {
        state,
        result: ast
    };
};
exports.compileOperator = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Operator);
    if (!ast || !state) {
        return undefined;
    }
    state = exports.writeJsToken(state, ast.value || '');
    return {
        state,
        result: ast
    };
};
exports.compileStringLiteral = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.String);
    if (!ast || !state) {
        return undefined;
    }
    // open `
    state = exports.writeJsToken(state, '`');
    let content = ast.value;
    for (let i = 0; i < content.length; i++) {
        const contentItem = content[i];
        let compileItemResult = exports.compileAstNode(contentItem, state);
        if (compileItemResult) {
            state = compileItemResult.state;
        }
    }
    // close `
    state = exports.writeJsToken(state, '`');
    return {
        state,
        result: ast
    };
};
exports.writeIndentScope = (indentScope, state) => {
    if (!state) {
        return undefined;
    }
    // context['
    state = exports.writeJsToken(state, `${exports.compilerConfig.contextVarName}`);
    for (let i = 0; i < indentScope.length; i++) {
        const indentItem = indentScope[i];
        state = exports.writeJsToken(state, "['");
        // compile indent identifier
        let itemResult = exports.compileAstNode(indentItem.identifier, state);
        if (itemResult) {
            state = itemResult.state;
        }
        state = exports.writeJsToken(state, "']");
    }
    // done
    return state;
};
// SYSTEM FUNCTIONS
exports.isEndOfFile = (state) => {
    if (!state || !state.sourceState || !state.sourceState.ast || state.sourceState.ast.length === 0) {
        return true;
    }
    let astIndex = state.sourceState.astIndex;
    if (state.sourceState.ast.length > astIndex - 1) {
        return false;
    }
    return true;
};
exports.getParentScope = (indent, state) => {
    if (!state) {
        return undefined;
    }
    // check indent and scope
    let sourceState = state.sourceState;
    let indentScope = sourceState.indentScope;
    let parentScope = [];
    // find ident scope item we are child of
    let parentItemsCount = 0;
    for (let i = 0; i < indentScope.length; i++) {
        const scopeItem = indentScope[i];
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
};
exports.addIndentScopeItem = (scopeItem, state) => {
    if (!state || !scopeItem) {
        return state;
    }
    state = Object.assign({}, state, { sourceState: Object.assign({}, state.sourceState, { indentScope: [...state.sourceState.indentScope, scopeItem] }) });
    return state;
};
exports.setIndentScope = (scope, state) => {
    if (!state || !scope) {
        return state;
    }
    state = Object.assign({}, state, { sourceState: Object.assign({}, state.sourceState, { indentScope: scope }) });
    return state;
};
exports.skipAst = (state, count = 1) => {
    for (let i = 0; i < count; i++) {
        if (exports.isEndOfFile(state)) {
            break;
        }
        let astIndex = state.sourceState.astIndex + 1;
        let sourceState = Object.assign({}, state.sourceState, { astIndex });
        state = Object.assign({}, state, { sourceState });
    }
    return state;
};
exports.getAst = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    let ast = state.sourceState.ast[state.sourceState.astIndex];
    return ast;
};
exports.addJavascript = (state, javascript) => {
    if (!state || !javascript) {
        return state;
    }
    let targetState = Object.assign({}, state.targetState, { javascript: [...state.targetState.javascript, ...javascript] });
    state = Object.assign({}, state, { targetState });
    return state;
};
exports.addSourceMaps = (state, sourceMaps) => {
    if (!state || !sourceMaps) {
        return state;
    }
    let targetState = Object.assign({}, state.targetState, { sourceMaps: [...state.targetState.sourceMaps, ...sourceMaps] });
    state = Object.assign({}, state, { targetState });
    return state;
};
exports.writeJavascript = (state, javascript) => {
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
                state = exports.writeJsToken(state, exports.compilerConfig.endlineSymbol);
            }
            // write line text
            state = exports.writeJsToken(state, jsLine);
        }
    }
    // prepare result
    return state;
};
exports.writeEndline = (state) => {
    return exports.writeJavascript(state, exports.compilerConfig.endlineSymbol);
};
exports.writeJsToken = (state, jsToken) => {
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
        cursor = Object.assign({}, cursor, { line: cursor.line + 1, column: 0, symbol: cursor.symbol + jsToken.length });
        // target state
        javascript = [...javascript, ''];
        targetState = Object.assign({}, targetState, { cursor,
            javascript });
        // update state
        state = Object.assign({}, state, { targetState });
        // return result
        return state;
    }
    // if we here that means token is not endline
    // cursor
    cursor = Object.assign({}, cursor, { column: cursor.column + jsToken.length, symbol: cursor.symbol + jsToken.length });
    // target state
    let lastLine = '';
    if (javascript.length > 0) {
        lastLine = javascript[javascript.length - 1];
    }
    else {
        javascript = [lastLine];
    }
    lastLine = lastLine + jsToken;
    javascript[javascript.length - 1] = lastLine;
    targetState = Object.assign({}, targetState, { cursor,
        javascript });
    // update state
    state = Object.assign({}, state, { targetState });
    return state;
};
