"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileTryStatement = exports.compileIndexerExpression = exports.compileConditionalExpression = exports.compileKeyword = exports.compileUpdateExpression = exports.compileObjectLiteral = exports.compileArrayLiteral = exports.compileForOfStatement = exports.compileForInStatement = exports.compileForStatement = exports.compilePropertyDeclaration = exports.compileImportItem = exports.compileRawImportStatement = exports.compileImportStatement = exports.compileParenExpression = exports.compileCaseStatement = exports.compileSwitchStatement = exports.compileDoWhileStatement = exports.compileWhileStatement = exports.compileIfStatement = exports.compileContinueStatement = exports.compileBreakStatement = exports.compileProgram = exports.compileFunction = exports.compileDeconstrutingAssignment = exports.compileVarDeclaration = exports.compileCallExpression = exports.compileStringInclude = exports.compileMemberExpression = exports.compileBinaryExpression = exports.compileContextIdentifier = exports.compileRawIdentifier = exports.compileIdentifierScope = exports.compileIdentifier = exports.compileRegexLiteral = exports.compileBoolean = exports.compileNumber = exports.compileTextLine = exports.compileDeleteLine = exports.compileObjectLine = exports.compileClassDeclaration = exports.compileKeywordNode = exports.compileBlockStatement = exports.compileOuterStatement = exports.compileAstModule = exports.compileNode = exports.compileAstNode = exports.compile = exports.compileSingleNode = exports.compilerConfig = void 0;
exports.toStringSafe = exports.writeJsToken = exports.writeEndline = exports.writeJavascript = exports.writeTargetIndent = exports.setIndent = exports.addTargetIndent = exports.isNeedToLinkSourcemap = exports.addSourceMapAtCurrentPlace = exports.addSourceMap = exports.addSourceMaps = exports.getIdentifierFullName = exports.getIdentifierFromNode = exports.addJavascript = exports.getAst = exports.skipAst = exports.setIndentScope = exports.addIndentScopeItem = exports.getParentScope = exports.isEndOfFile = exports.writeIndentScope = exports.compileStringLiteral = exports.compileOperator = exports.compileTokenSequence = exports.compileToken = exports.compileThrowStatement = exports.compileDebuggerKeyword = exports.compileFinallyStatement = exports.compileCatchStatement = void 0;
const source_map_1 = require("source-map");
const AstNodeType_1 = require("../ast/AstNodeType");
const astFactory_1 = require("../ast/astFactory");
const VariableDeclarationKind_1 = require("../ast/VariableDeclarationKind");
const path = require("path");
const JavascrptMode_1 = require("../shared/JavascrptMode");
const sourceMappableAstNodes = {
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
    sourceMappableAstNodes
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
const compileSingleNode = (ast) => {
    let cursor = Object.assign({}, ast[0].start);
    // let sourceMapGenerator = new SourceMapGenerator({});
    // prepare compile state
    let sourceState = {
        ast: [ast],
        astIndex: 0,
        cursor,
        fileName: 'nofile',
        indent: 0,
        indentScope: []
    };
    let targetState = {
        cursor,
        javascript: [],
        sourceMaps: [],
        fileName: 'nofile',
        indent: 0
    };
    let state = {
        sourceState,
        targetState
    };
    // compile node
    let compileResult = (0, exports.compileAstNode)(ast, state);
    if (!compileResult) {
        return undefined;
    }
    state = compileResult.state;
    // prepare result
    let javascriptLines = state.targetState.javascript;
    let javascript = javascriptLines.join("\r\n");
    return javascript;
};
exports.compileSingleNode = compileSingleNode;
const compile = (request) => {
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
        indentScope: []
    };
    let targetState = {
        cursor,
        javascript: [],
        sourceMaps: [],
        fileName: request.targetFileName,
        indent: 0
    };
    let state = {
        sourceState,
        targetState
    };
    // prepare ident size
    if (request.indentSize) {
        exports.compilerConfig.indentSize = request.indentSize;
    }
    if (!exports.compilerConfig.indentSize) {
        exports.compilerConfig.indentSize = 2;
    }
    // write module header
    // env
    let environmentPath = getEnvPath(request);
    state = (0, exports.writeJsToken)(state, `let ${exports.compilerConfig.environmentVarName} = require(\`${environmentPath}\`);`);
    state = (0, exports.writeEndline)(state);
    // __text
    state = (0, exports.writeJsToken)(state, `let ${exports.compilerConfig.textFieldName} = [];`);
    state = (0, exports.writeEndline)(state);
    // context
    state = (0, exports.writeJsToken)(state, `let ${exports.compilerConfig.contextVarName} = { ${exports.compilerConfig.textFieldName} };`);
    state = (0, exports.writeEndline)(state);
    // serializer
    state = (0, exports.writeJsToken)(state, `let ${exports.compilerConfig.serializerVarName} = ${exports.compilerConfig.environmentVarName}.${exports.compilerConfig.getSerializerFuncName}();`);
    state = (0, exports.writeEndline)(state);
    state = (0, exports.writeEndline)(state);
    // compile ast
    while (!(0, exports.isEndOfFile)(state)) {
        // compile ast node
        let nextAst = (0, exports.getAst)(state);
        let compileAstResult = (0, exports.compileAstNode)(nextAst, state);
        if (compileAstResult) {
            state = compileAstResult.state;
            state = (0, exports.skipAst)(state);
            continue;
        }
        // otherwise this ast node is something uncompilable. skip it
        state = (0, exports.skipAst)(state);
    }
    // write module footer
    state = (0, exports.writeEndline)(state);
    state = (0, exports.writeEndline)(state);
    state = (0, exports.writeJsToken)(state, `// INFO: this trick is for making this file node module`);
    state = (0, exports.writeEndline)(state);
    switch (request.jsMode) {
        case JavascrptMode_1.JavascriptMode.ECMAScript:
            // we already have declared a context for export
            state = (0, exports.writeJsToken)(state, `export default ${exports.compilerConfig.contextVarName});`);
            break;
        default:
            state = (0, exports.writeJsToken)(state, `Object.assign(module.exports, ${exports.compilerConfig.contextVarName});`);
            break;
    }
    state = (0, exports.writeEndline)(state);
    // prepare result
    let javascriptLines = state.targetState.javascript;
    let sourceMaps = undefined;
    // prepare source maps
    if (request.isEmitSourcemaps === true) {
        let sourceMapTokens = state.targetState.sourceMaps;
        // generate source map text
        let mapGenerator = new source_map_1.SourceMapGenerator({
            file: request.sourceFileName,
            // sourceRoot: request.sourceRoot
        });
        for (let smi = 0; smi < sourceMapTokens.length; smi++) {
            const smToken = sourceMapTokens[smi];
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
    };
};
exports.compile = compile;
const compileAstNode = (ast, state) => {
    if (!ast) {
        return undefined;
    }
    const compileResult = (0, exports.compileNode)(ast, state, [
        exports.compileAstModule,
        exports.compileOuterStatement,
        exports.compileBlockStatement,
        exports.compileKeywordNode,
        exports.compileClassDeclaration,
        exports.compileObjectLine,
        exports.compileStringLiteral,
        exports.compileStringInclude,
        exports.compileRawIdentifier,
        exports.compileContextIdentifier,
        exports.compileBinaryExpression,
        exports.compileMemberExpression,
        exports.compileCallExpression,
        exports.compileDeleteLine,
        exports.compileTextLine,
        exports.compileNumber,
        exports.compileBoolean,
        exports.compileRegexLiteral,
        exports.compileIdentifier,
        exports.compileIdentifierScope,
        exports.compileToken,
        exports.compileTokenSequence,
        exports.compileOperator,
        exports.compileVarDeclaration,
        exports.compileDeconstrutingAssignment,
        exports.compileProgram,
        exports.compileFunction,
        exports.compileIfStatement,
        exports.compileWhileStatement,
        exports.compileDoWhileStatement,
        exports.compileSwitchStatement,
        exports.compileCaseStatement,
        exports.compileBreakStatement,
        exports.compileContinueStatement,
        exports.compileParenExpression,
        exports.compileImportStatement,
        exports.compileRawImportStatement,
        exports.compileImportItem,
        exports.compileForStatement,
        exports.compileForOfStatement,
        exports.compileForInStatement,
        exports.compilePropertyDeclaration,
        exports.compileObjectLiteral,
        exports.compileArrayLiteral,
        exports.compileUpdateExpression,
        exports.compileKeyword,
        exports.compileConditionalExpression,
        exports.compileIndexerExpression,
        exports.compileTryStatement,
        exports.compileCatchStatement,
        exports.compileFinallyStatement,
        exports.compileThrowStatement,
        exports.compileDebuggerKeyword
    ]);
    if (compileResult) {
        return compileResult;
    }
    // default value is just a type of node
    state = (0, exports.writeJsToken)(state, ast.nodeType);
    return {
        state,
        result: ast
    };
};
exports.compileAstNode = compileAstNode;
const compileNode = (ast, state, compilers) => {
    if (!ast || !state || !compilers || compilers.length <= 0) {
        return undefined;
    }
    for (let cIndex = 0; cIndex < compilers.length; cIndex++) {
        const compiler = compilers[cIndex];
        if (!compiler) {
            continue;
        }
        const compileResult = compiler(ast, state);
        if (compileResult) {
            return compileResult;
        }
    }
    return undefined;
};
exports.compileNode = compileNode;
const compileAstModule = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Module);
    if (!state || !ast) {
        return undefined;
    }
    // compile module content
    let moduleContent = ast.content;
    if (moduleContent && moduleContent.content && moduleContent.content.length > 0) {
        for (let contentInd = 0; contentInd < moduleContent.content.length; contentInd++) {
            let contentNode = moduleContent.content[contentInd];
            let compileResult = (0, exports.compileAstNode)(contentNode, state);
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
    };
};
exports.compileAstModule = compileAstModule;
const compileOuterStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.OuterStatement);
    if (!state || !ast) {
        return undefined;
    }
    // check indent
    let newIndent = Math.floor(ast.indent / exports.compilerConfig.indentSize);
    let sourceState = state.sourceState;
    sourceState = Object.assign(Object.assign({}, sourceState), { indent: newIndent });
    state = Object.assign(Object.assign({}, state), { sourceState });
    // compile statement
    let compileStatementResult = (0, exports.compileAstNode)(ast.statement, state);
    if (compileStatementResult) {
        state = compileStatementResult.state;
    }
    // prepare result
    return {
        state,
        result: ast
    };
};
exports.compileOuterStatement = compileOuterStatement;
const compileBlockStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.BlockStatement);
    if (!ast || !state) {
        return undefined;
    }
    if (!ast.withoutBraces) {
        // open scope
        state = (0, exports.writeJsToken)(state, "{ ");
        state = (0, exports.writeEndline)(state);
        state = (0, exports.addTargetIndent)(state, 1);
    }
    // write all the statements
    let content = ast.content;
    if (content && content.length > 0) {
        for (let i = 0; i < content.length; i++) {
            // write indent
            state = (0, exports.writeTargetIndent)(state);
            const contentNode = content[i];
            let contentNodeResult = (0, exports.compileAstNode)(contentNode, state);
            if (contentNodeResult) {
                state = contentNodeResult.state;
            }
            // write ;
            state = (0, exports.writeJsToken)(state, ';');
            state = (0, exports.writeEndline)(state);
        }
    }
    if (!ast.withoutBraces) {
        // close scope
        state = (0, exports.addTargetIndent)(state, -1);
        state = (0, exports.writeTargetIndent)(state);
        state = (0, exports.writeJsToken)(state, "}");
    }
    return {
        state,
        result: ast
    };
};
exports.compileBlockStatement = compileBlockStatement;
const compileKeywordNode = (node, state) => {
    const ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.KeywordNode);
    if (!ast || !state) {
        return undefined;
    }
    if (ast.isKeywordFirst === true) {
        const keywordResult = (0, exports.compileAstNode)(ast.keyword, state);
        if (keywordResult) {
            state = keywordResult.state;
        }
    }
    if (ast.isKeywordFirst) {
        state = (0, exports.writeJsToken)(state, " ");
    }
    const nodeResult = (0, exports.compileAstNode)(ast.node, state);
    if (nodeResult) {
        state = nodeResult.state;
    }
    if (!ast.isKeywordFirst) {
        state = (0, exports.writeJsToken)(state, " ");
        const keywordResult = (0, exports.compileAstNode)(ast.keyword, state);
        if (keywordResult) {
            state = keywordResult.state;
        }
    }
    return {
        state,
        result: ast
    };
};
exports.compileKeywordNode = compileKeywordNode;
const compileClassDeclaration = (node, state) => {
    const ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ClassDeclaration);
    if (!state || !ast) {
        return undefined;
    }
    // write class
    state = (0, exports.addSourceMapAtCurrentPlace)(state);
    state = (0, exports.writeJsToken)(state, "class ");
    // write className
    const identifier = (0, exports.getIdentifierFromNode)(ast.name, state);
    if (identifier) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, identifier.value);
    }
    const classNameResult = (0, exports.compileAstNode)(ast.name, state);
    if (classNameResult) {
        state = classNameResult.state;
    }
    // write parent
    if (ast.parent) {
        state = (0, exports.writeJsToken)(state, " extends ");
        const parentResult = (0, exports.compileAstNode)(ast.parent, state);
        if (parentResult) {
            state = parentResult.state;
        }
    }
    // write {
    state = (0, exports.writeJsToken)(state, " {");
    state = (0, exports.writeEndline)(state);
    // write class content
    state = (0, exports.addTargetIndent)(state, 1);
    if (ast.contents && ast.contents.length > 0) {
        for (let cIndex = 0; cIndex < ast.contents.length; cIndex++) {
            state = (0, exports.writeTargetIndent)(state);
            const contentItem = ast.contents[cIndex];
            const itemResult = (0, exports.compileAstNode)(contentItem, state);
            if (itemResult) {
                state = itemResult.state;
                state = (0, exports.writeJsToken)(state, ";");
                state = (0, exports.writeEndline)(state);
            }
        }
    }
    state = (0, exports.addTargetIndent)(state, -1);
    // write }
    state = (0, exports.writeJsToken)(state, "}");
    // state = writeEndline(state);
    return {
        state,
        result: ast
    };
};
exports.compileClassDeclaration = compileClassDeclaration;
const compileObjectLine = (node, state) => {
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
        parentScope = (0, exports.getParentScope)(myIndent, state);
        // add self as scope item
        state = (0, exports.setIndentScope)([...parentScope, scopeItem], state);
    }
    // write indent scope
    let identifier = (0, exports.getIdentifierFromNode)(objectNode, state);
    let identifierName = (0, exports.getIdentifierFullName)(identifier, parentScope, state);
    if (identifier) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, identifierName, identifier.start);
    }
    // state = writeIndentScope(state.sourceState.indentScope, state, ast.start);
    state = (0, exports.writeIndentScope)(state.sourceState.indentScope, state);
    // compile init value if any
    if (initValue) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, "=", initValue.start, 1);
        state = (0, exports.writeJsToken)(state, " = ");
        // write init value
        let initValResult = (0, exports.compileAstNode)(initValue, state);
        if (initValResult) {
            state = initValResult.state;
        }
    }
    else {
        // if we have no init value, here is specific syntax
        // context[varname] = context[varname] || {};
        state = (0, exports.writeJsToken)(state, " = ");
        // write parent scope
        state = (0, exports.writeIndentScope)(state.sourceState.indentScope, state);
        // || {}
        state = (0, exports.writeJsToken)(state, ` || ${exports.compilerConfig.defaultObject}`);
    }
    // add ; and endline
    state = (0, exports.writeJsToken)(state, ";");
    state = (0, exports.writeEndline)(state);
    return {
        state,
        result: ast
    };
};
exports.compileObjectLine = compileObjectLine;
const compileDeleteLine = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.DeleteLineExpression);
    if (!ast || !state) {
        return undefined;
    }
    let scopeToWrite = state.sourceState.indentScope;
    let objectNode = ast.object;
    if (objectNode) {
        // write delete
        state = (0, exports.writeJsToken)(state, `delete `);
        // check indent and scope
        let sourceState = state.sourceState;
        let myIndent = sourceState.indent;
        let scopeItem = {
            identifier: objectNode,
            indent: myIndent
        };
        let parentScope = (0, exports.getParentScope)(myIndent, state);
        scopeToWrite = [...parentScope, scopeItem];
        // write indent scope
        state = (0, exports.writeIndentScope)(scopeToWrite, state, objectNode.start);
    }
    // add ; and endline
    state = (0, exports.writeJsToken)(state, ";");
    state = (0, exports.writeEndline)(state);
    return {
        state,
        result: ast
    };
};
exports.compileDeleteLine = compileDeleteLine;
const compileTextLine = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.TextLineStatement);
    if (!ast || !state || !ast.text) {
        return undefined;
    }
    // check indent
    let myIndent = Math.floor(ast.indent / exports.compilerConfig.indentSize);
    // get parent scope
    let parentScope = (0, exports.getParentScope)(myIndent, state);
    // save parent scope
    state = (0, exports.setIndentScope)(parentScope, state);
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
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeIndentScope)(parentScope, state);
    // write [text]
    state = (0, exports.writeJsToken)(state, `.${exports.compilerConfig.textFieldName}`);
    // write .push(
    state = (0, exports.writeJsToken)(state, `.push(`);
    // write " or ` depending on wheter there are includes or not
    state = (0, exports.writeJsToken)(state, ast.hasIncludes ? "`" : "`");
    // write whitespace
    state = (0, exports.writeJsToken)(state, whitespace);
    // write string content
    let content = ast.text;
    for (let i = 0; i < content.length; i++) {
        const contentItem = content[i];
        let compileItemResult = (0, exports.compileAstNode)(contentItem, state);
        if (compileItemResult) {
            state = compileItemResult.state;
        }
    }
    // write " or ` depending on wheter there are includes or not
    state = (0, exports.writeJsToken)(state, ast.hasIncludes ? "`" : "`");
    // write );
    state = (0, exports.writeJsToken)(state, ');');
    // write endline
    state = (0, exports.writeEndline)(state);
    return {
        state,
        result: ast
    };
};
exports.compileTextLine = compileTextLine;
const compileNumber = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Number);
    if (!ast || !state) {
        return undefined;
    }
    state = (0, exports.addSourceMapAtCurrentPlace)(state, (0, exports.toStringSafe)(ast.value), ast.start);
    state = (0, exports.writeJsToken)(state, ast.value.toString());
    return {
        state,
        result: ast
    };
};
exports.compileNumber = compileNumber;
const compileBoolean = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Boolean);
    if (!ast || !state) {
        return undefined;
    }
    state = (0, exports.addSourceMapAtCurrentPlace)(state, (0, exports.toStringSafe)(ast.value), ast.start);
    state = (0, exports.writeJsToken)(state, ast.value.toString());
    return {
        state,
        result: ast
    };
};
exports.compileBoolean = compileBoolean;
const compileRegexLiteral = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.RegexLiteral);
    if (!ast || !state) {
        return undefined;
    }
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, ast.value);
    return {
        state,
        result: ast
    };
};
exports.compileRegexLiteral = compileRegexLiteral;
const compileIdentifier = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Identifier);
    if (!ast || !state) {
        return undefined;
    }
    if (ast.isJsIdentifier) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, ast.value);
    }
    state = (0, exports.writeJsToken)(state, ast.value);
    return {
        state,
        result: ast
    };
};
exports.compileIdentifier = compileIdentifier;
const compileIdentifierScope = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.IdentifierScope);
    if (!ast || !state) {
        return undefined;
    }
    // write items
    let valueItems = ast.value;
    if (valueItems && valueItems.length > 0) {
        for (let i = 0; i < valueItems.length; i++) {
            const itemNode = valueItems[i];
            let itemResult = (0, exports.compileAstNode)(itemNode, state);
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
exports.compileIdentifierScope = compileIdentifierScope;
const compileRawIdentifier = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.RawIdentifier);
    if (!ast || !state) {
        return undefined;
    }
    var identifier = astFactory_1.astFactory.asNode(ast.value, AstNodeType_1.AstNodeType.Identifier);
    if (identifier) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, identifier.value, identifier.start, 1);
    }
    let compileResult = (0, exports.compileAstNode)(ast.value, state);
    if (compileResult) {
        state = compileResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileRawIdentifier = compileRawIdentifier;
const compileContextIdentifier = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ContextIdentifier);
    if (!ast || !state) {
        return undefined;
    }
    const valueIdentifier = astFactory_1.astFactory.asNode(ast.value, AstNodeType_1.AstNodeType.Identifier);
    const isJsIdentifier = valueIdentifier && valueIdentifier.isJsIdentifier === true;
    // this is not raw identifier, so add context before it
    state = (0, exports.writeJsToken)(state, `${exports.compilerConfig.contextVarName}`);
    if (isJsIdentifier) {
        // .
        state = (0, exports.writeJsToken)(state, '.');
    }
    else {
        // ['
        state = (0, exports.writeJsToken)(state, `[\``);
    }
    // write identifier
    var compileValResult = (0, exports.compileAstNode)(ast.value, state);
    if (compileValResult) {
        state = compileValResult.state;
    }
    if (!isJsIdentifier) {
        //']
        state = (0, exports.writeJsToken)(state, `\`]`);
    }
    return {
        state,
        result: ast
    };
};
exports.compileContextIdentifier = compileContextIdentifier;
const compileBinaryExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.BinaryExpression);
    if (!ast || !state) {
        return undefined;
    }
    // left operand
    let leftResult = (0, exports.compileAstNode)(ast.left, state);
    if (leftResult) {
        state = leftResult.state;
    }
    // add space
    state = (0, exports.writeJsToken)(state, ' ');
    // operator
    let compileOperatorResult = (0, exports.compileAstNode)(ast.operator, state);
    if (compileOperatorResult) {
        state = compileOperatorResult.state;
    }
    // add space
    state = (0, exports.writeJsToken)(state, ' ');
    // right operand
    let rightResult = (0, exports.compileAstNode)(ast.right, state);
    if (rightResult) {
        state = rightResult.state;
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileBinaryExpression = compileBinaryExpression;
const compileMemberExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.MemberExpression);
    if (!ast || !state) {
        return undefined;
    }
    // left operand
    let leftResult = (0, exports.compileAstNode)(ast.object, state);
    if (leftResult) {
        state = leftResult.state;
    }
    const identifierParam = astFactory_1.astFactory.asNode(ast.property, AstNodeType_1.AstNodeType.Identifier);
    const isMemberIdentifier = identifierParam && identifierParam.isJsIdentifier === true;
    // check is optional (?.)
    if (ast.optional) {
        state = (0, exports.writeJsToken)(state, '?.');
    }
    else if (isMemberIdentifier) {
        state = (0, exports.writeJsToken)(state, ".");
    }
    else {
        // [
        state = (0, exports.writeJsToken)(state, `['`);
    }
    // right operand
    let rightResult = (0, exports.compileAstNode)(ast.property, state);
    if (rightResult) {
        state = rightResult.state;
    }
    if (!ast.optional && !isMemberIdentifier) {
        // ]
        state = (0, exports.writeJsToken)(state, `']`);
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileMemberExpression = compileMemberExpression;
const compileStringInclude = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.StringIncludeStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write ${
    state = (0, exports.writeJsToken)(state, '${');
    // write serializer.serialize(
    state = (0, exports.writeJsToken)(state, `${exports.compilerConfig.serializerVarName}.${exports.compilerConfig.serializeFuncName}( `);
    // write expression
    let expResult = (0, exports.compileAstNode)(ast.expression, state);
    if (expResult) {
        state = expResult.state;
    }
    // write separator param
    state = (0, exports.writeJsToken)(state, `, '\\r\\n'`);
    // write serialize close paren )
    state = (0, exports.writeJsToken)(state, ` )`);
    // write }
    state = (0, exports.writeJsToken)(state, '}');
    // result
    return {
        state,
        result: ast
    };
};
exports.compileStringInclude = compileStringInclude;
const compileCallExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.CallExpression);
    if (!ast || !state) {
        return undefined;
    }
    // callee
    if (ast.calee) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.calee.start);
    }
    else {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    }
    let calleeResult = (0, exports.compileAstNode)(ast.calee, state);
    if (calleeResult) {
        state = calleeResult.state;
    }
    // write open (
    state = (0, exports.writeJsToken)(state, '(');
    // write arguments
    let fArgs = ast.args;
    if (fArgs && fArgs.length > 0) {
        for (let i = 0; i < fArgs.length; i++) {
            // if it's not first item, write separator
            if (i > 0) {
                state = (0, exports.writeJsToken)(state, ', ');
            }
            const argNode = fArgs[i];
            let argResult = (0, exports.compileAstNode)(argNode, state);
            if (argResult) {
                state = argResult.state;
            }
        }
    }
    // write close )
    state = (0, exports.writeJsToken)(state, ')');
    // result
    return {
        state,
        result: ast
    };
};
exports.compileCallExpression = compileCallExpression;
const compileVarDeclaration = (node, state) => {
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
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `${prefix} `);
    // write varname
    const identifiers = ast.identifiers;
    if (identifiers) {
        for (let iIndex = 0; iIndex < identifiers.length; iIndex++) {
            const astItem = identifiers[iIndex];
            let identifier = astFactory_1.astFactory.asNode(astItem, AstNodeType_1.AstNodeType.Identifier);
            if (identifier) {
                state = (0, exports.addSourceMapAtCurrentPlace)(state, identifier.value, identifier.start);
            }
            let varnameResult = (0, exports.compileAstNode)(astItem, state);
            if (varnameResult) {
                state = varnameResult.state;
            }
            if (iIndex < identifiers.length - 1) {
                (0, exports.writeJsToken)(state, ', ');
            }
        }
    }
    // init value
    if (ast.value) {
        // write =
        state = (0, exports.writeJsToken)(state, ` = `);
        // write init value
        let initValResult = (0, exports.compileAstNode)(ast.value, state);
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
exports.compileVarDeclaration = compileVarDeclaration;
const compileDeconstrutingAssignment = (node, state) => {
    const ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.DeconstructionAssignment);
    if (!ast || !state) {
        return undefined;
    }
    // write variables
    const varsResult = (0, exports.compileAstNode)(ast.variables, state);
    if (varsResult) {
        state = varsResult.state;
    }
    // write =
    state = (0, exports.writeJsToken)(state, " = ");
    // write initializer
    const initResult = (0, exports.compileAstNode)(ast.initializer, state);
    if (initResult) {
        state = initResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileDeconstrutingAssignment = compileDeconstrutingAssignment;
const compileFunction = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Function);
    if (!ast || !state) {
        return undefined;
    }
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    if (ast.isAsync) {
        state = (0, exports.writeJsToken)(state, 'async ');
    }
    if (!ast.isLambda && !ast.isNoKeyword) {
        // write function (
        state = (0, exports.writeJsToken)(state, `function`);
    }
    if (ast.isGenerator) {
        state = (0, exports.writeJsToken)(state, '*');
    }
    if (ast.name && !ast.isNoKeyword) {
        state = (0, exports.writeJsToken)(state, " ");
    }
    // function name (if any)
    const nameResult = (0, exports.compileAstNode)(ast.name, state);
    if (nameResult) {
        state = nameResult.state;
    }
    state = (0, exports.writeJsToken)(state, '(');
    // write all the params
    let params = ast.args;
    if (params && params.length > 0) {
        for (let i = 0; i < params.length; i++) {
            // if it's not first item, add separator before
            if (i > 0) {
                state = (0, exports.writeJsToken)(state, `, `);
            }
            const param = params[i];
            let paramResult = (0, exports.compileAstNode)(param, state);
            if (paramResult) {
                state = paramResult.state;
            }
        }
    }
    // write )
    state = (0, exports.writeJsToken)(state, `) `);
    if (ast.isLambda) {
        state = (0, exports.writeJsToken)(state, '=> ');
    }
    // write function body
    let bodyResult = (0, exports.compileAstNode)(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileFunction = compileFunction;
const compileProgram = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Program);
    if (!ast || !state) {
        return undefined;
    }
    // write {
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `{`);
    state = (0, exports.writeEndline)(state);
    let content = ast.content;
    if (content && content.length > 0) {
        for (let i = 0; i < content.length; i++) {
            const contentNode = content[i];
            let contentResult = (0, exports.compileAstNode)(contentNode, state);
            if (contentResult) {
                state = contentResult.state;
            }
            // add separator
            state = (0, exports.writeJsToken)(state, `;`);
            state = (0, exports.writeEndline)(state);
        }
    }
    // write }
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.end);
    state = (0, exports.writeJsToken)(state, `}`);
    return {
        state,
        result: ast
    };
};
exports.compileProgram = compileProgram;
const compileBreakStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.BreakStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write break
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `break`);
    return {
        state,
        result: ast
    };
};
exports.compileBreakStatement = compileBreakStatement;
const compileContinueStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ContinueStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write break
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `continue`);
    return {
        state,
        result: ast
    };
};
exports.compileContinueStatement = compileContinueStatement;
const compileIfStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.IfStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write if (
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `if (`);
    // write condition
    let conditionResult = (0, exports.compileAstNode)(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }
    // write )
    state = (0, exports.writeJsToken)(state, `) `);
    // write thenValue
    let thenResult = (0, exports.compileAstNode)(ast.thenValue, state);
    if (thenResult) {
        state = thenResult.state;
    }
    // write else if any
    if (ast.elseValue) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.elseValue.start, 1);
        state = (0, exports.writeJsToken)(state, ` else `);
        let elseResult = (0, exports.compileAstNode)(ast.elseValue, state);
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
exports.compileIfStatement = compileIfStatement;
const compileWhileStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.WhileStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write while (
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `while (`);
    // write condition
    let conditionResult = (0, exports.compileAstNode)(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }
    // write )
    state = (0, exports.writeJsToken)(state, `) `);
    // write body
    let bodyResult = (0, exports.compileAstNode)(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    // return result
    return {
        state,
        result: ast
    };
};
exports.compileWhileStatement = compileWhileStatement;
const compileDoWhileStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.DoWhileStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write do
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `do `);
    // write body
    let bodyResult = (0, exports.compileAstNode)(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    // write while (
    if (ast.condition) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.condition.start);
    }
    state = (0, exports.writeJsToken)(state, ` while (`);
    // write condition
    let conditionResult = (0, exports.compileAstNode)(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }
    // write )
    state = (0, exports.writeJsToken)(state, `)`);
    // return result
    return {
        state,
        result: ast
    };
};
exports.compileDoWhileStatement = compileDoWhileStatement;
const compileSwitchStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.SwitchStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write while (
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `switch (`);
    // write condition
    let conditionResult = (0, exports.compileAstNode)(ast.condition, state);
    if (conditionResult) {
        state = conditionResult.state;
    }
    // write )
    state = (0, exports.writeJsToken)(state, `) `);
    // write {
    state = (0, exports.writeJsToken)(state, `{`);
    state = (0, exports.writeEndline)(state);
    // write cases
    let cases = ast.cases;
    if (cases && cases.length > 0) {
        for (let i = 0; i < cases.length; i++) {
            const caseNode = cases[i];
            let caseResult = (0, exports.compileAstNode)(caseNode, state);
            if (caseResult) {
                state = caseResult.state;
            }
            state = (0, exports.writeEndline)(state);
        }
    }
    // write }
    state = (0, exports.writeEndline)(state);
    state = (0, exports.writeJsToken)(state, `}`);
    // return result
    return {
        state,
        result: ast
    };
};
exports.compileSwitchStatement = compileSwitchStatement;
const compileCaseStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.CaseStatement);
    if (!ast || !state) {
        return undefined;
    }
    // check is default case
    let isDefaultCase = ast.condition === undefined;
    if (isDefaultCase === true) {
        // default case
        state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
        state = (0, exports.writeJsToken)(state, `default `);
    }
    else {
        // not a default case
        // write case
        state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
        state = (0, exports.writeJsToken)(state, `case `);
        // write condition
        let conditionResult = (0, exports.compileAstNode)(ast.condition, state);
        if (conditionResult) {
            state = conditionResult.state;
        }
    }
    // write :
    state = (0, exports.writeJsToken)(state, `: `);
    // write body
    if (ast.body && ast.body.length > 0) {
        for (let i = 0; i < ast.body.length; i++) {
            state = (0, exports.writeEndline)(state);
            const bodyItem = ast.body[i];
            let itemResult = (0, exports.compileAstNode)(bodyItem, state);
            if (itemResult) {
                state = itemResult.state;
            }
            state = (0, exports.writeJsToken)(state, `;`);
        }
    }
    // write consequent
    if (ast.consequent) {
        state = (0, exports.writeEndline)(state);
        let consequentResult = (0, exports.compileAstNode)(ast.consequent, state);
        if (consequentResult) {
            state = consequentResult.state;
        }
    }
    return {
        state,
        result: ast
    };
};
exports.compileCaseStatement = compileCaseStatement;
const compileParenExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ParenExpression);
    if (!ast || !state) {
        return undefined;
    }
    // write (
    state = (0, exports.writeJsToken)(state, `(`);
    // write content
    let contentResult = (0, exports.compileAstNode)(ast.expression, state);
    if (contentResult) {
        state = contentResult.state;
    }
    // write )
    state = (0, exports.writeJsToken)(state, `)`);
    return {
        state,
        result: ast
    };
};
exports.compileParenExpression = compileParenExpression;
const compileImportStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ImportStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write identifier
    let identifier = astFactory_1.astFactory.asNode(ast.identifier, AstNodeType_1.AstNodeType.Identifier);
    if (identifier) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, identifier.value, identifier.start);
    }
    let identifierResult = (0, exports.compileAstNode)(ast.identifier, state);
    if (identifierResult) {
        state = identifierResult.state;
    }
    // write = 
    state = (0, exports.writeJsToken)(state, ` = `);
    // write require('
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `require(`);
    // write import path
    let pathResult = (0, exports.compileAstNode)(ast.path, state);
    if (pathResult) {
        state = pathResult.state;
    }
    // write )
    state = (0, exports.writeJsToken)(state, `)`);
    // if it's "import in", add one more line
    if (ast.importInContext) {
        // endline
        state = (0, exports.writeJsToken)(state, `;`);
        state = (0, exports.writeEndline)(state);
        // __context = { ...__context, ...[identifier], __text };
        // __context = { ...
        state = (0, exports.writeJsToken)(state, `${exports.compilerConfig.contextVarName} = { ...${exports.compilerConfig.contextVarName}, ...`);
        // identifier
        const identResult = (0, exports.compileAstNode)(ast.identifier, state);
        if (identResult) {
            state = identResult.state;
        }
        // , __text };
        state = (0, exports.writeJsToken)(state, `, ${exports.compilerConfig.textFieldName} }`);
    }
    // add ; and endline 
    state = (0, exports.writeJsToken)(state, ";");
    state = (0, exports.writeEndline)(state);
    return {
        state,
        result: ast
    };
};
exports.compileImportStatement = compileImportStatement;
const compileRawImportStatement = (node, state) => {
    const ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.RawImportStatement);
    if (!ast || !state) {
        return undefined;
    }
    state = (0, exports.writeJsToken)(state, 'import ');
    // compile identifier as array
    if (Array.isArray(ast.identifier)) {
        state = (0, exports.writeJsToken)(state, '{ ');
        const identArray = ast.identifier;
        for (let iIndex = 0; iIndex < identArray.length; iIndex++) {
            const element = identArray[iIndex];
            if (iIndex > 0) {
                state = (0, exports.writeJsToken)(state, ', ');
            }
            const nodeResult = (0, exports.compileAstNode)(element, state);
            if (nodeResult) {
                state = nodeResult.state;
            }
        }
        state = (0, exports.writeJsToken)(state, ' }');
    }
    // compile identifier as import item
    let identItem = astFactory_1.astFactory.asNode(ast.identifier, AstNodeType_1.AstNodeType.ImportItem);
    if (identItem) {
        const identItemResult = (0, exports.compileAstNode)(identItem, state);
        if (identItemResult) {
            state = identItemResult.state;
        }
    }
    // compile 'from' section
    state = (0, exports.writeJsToken)(state, ' from ');
    const pathResult = (0, exports.compileAstNode)(ast.path, state);
    if (pathResult) {
        state = pathResult.state;
    }
    // final semicolon
    state = (0, exports.writeJsToken)(state, ';');
    state = (0, exports.writeEndline)(state);
    return {
        state,
        result: ast
    };
};
exports.compileRawImportStatement = compileRawImportStatement;
const compileImportItem = (node, state) => {
    const ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ImportItem);
    if (!ast || !state) {
        return undefined;
    }
    const identifier = (0, exports.getIdentifierFromNode)(ast.identifier, state);
    if (identifier) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, identifier.value, identifier.start, 0, 0);
    }
    const identifierResult = (0, exports.compileAstNode)(ast.identifier, state);
    if (identifierResult) {
        state = identifierResult.state;
    }
    state = (0, exports.writeJsToken)(state, ' as ');
    const alias = (0, exports.getIdentifierFromNode)(ast.alias, state);
    if (alias) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, alias.value, alias.start, 0, 0);
    }
    const aliasResult = (0, exports.compileAstNode)(ast.alias, state);
    if (aliasResult) {
        state = aliasResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileImportItem = compileImportItem;
const compilePropertyDeclaration = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.PropertyDeclaration);
    if (!ast || !state) {
        return undefined;
    }
    // write "identifier" : value
    // write identifier
    let identifier = (0, exports.getIdentifierFromNode)(ast.identifier, state);
    if (identifier) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, identifier.value, identifier.start);
    }
    let identResult = (0, exports.compileAstNode)(ast.identifier, state);
    if (identResult) {
        state = identResult.state;
    }
    // write value if any
    if (ast.value) {
        // write :
        state = (0, exports.writeJsToken)(state, ` : `);
        // write value
        let valResult = (0, exports.compileAstNode)(ast.value, state);
        if (valResult) {
            state = valResult.state;
        }
    }
    // write initializer
    if (ast.initializer) {
        state = (0, exports.writeJsToken)(state, " = ");
        let initResult = (0, exports.compileAstNode)(ast.initializer, state);
        if (initResult) {
            state = initResult.state;
        }
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compilePropertyDeclaration = compilePropertyDeclaration;
const compileForStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ForStatement);
    if (!ast || !state) {
        return undefined;
    }
    // for (
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `for (`);
    // write init 
    let initResult = (0, exports.compileAstNode)(ast.init, state);
    if (initResult) {
        state = initResult.state;
    }
    state = (0, exports.writeJsToken)(state, `; `);
    // write test
    let testResult = (0, exports.compileAstNode)(ast.test, state);
    if (testResult) {
        state = testResult.state;
    }
    state = (0, exports.writeJsToken)(state, `; `);
    // write update
    let updateResult = (0, exports.compileAstNode)(ast.update, state);
    if (updateResult) {
        state = updateResult.state;
    }
    // )
    state = (0, exports.writeJsToken)(state, `) `);
    // write body
    let bodyResult = (0, exports.compileAstNode)(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileForStatement = compileForStatement;
const compileForInStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ForInStatement);
    if (!ast || !state) {
        return undefined;
    }
    // for (
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `for (`);
    // write left
    let leftResult = (0, exports.compileAstNode)(ast.left, state);
    if (leftResult) {
        state = leftResult.state;
    }
    // write in
    state = (0, exports.writeJsToken)(state, ` in `);
    // write right
    if (ast.right) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.right.start);
    }
    let rightResult = (0, exports.compileAstNode)(ast.right, state);
    if (rightResult) {
        state = rightResult.state;
    }
    // )
    state = (0, exports.writeJsToken)(state, `) `);
    // write body
    let bodyResult = (0, exports.compileAstNode)(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileForInStatement = compileForInStatement;
const compileForOfStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ForOfStatement);
    if (!ast || !state) {
        return undefined;
    }
    // for (
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `for (`);
    // write left
    let leftResult = (0, exports.compileAstNode)(ast.left, state);
    if (leftResult) {
        state = leftResult.state;
    }
    // write in
    state = (0, exports.writeJsToken)(state, ` of `);
    // write right
    if (ast.right) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.right.start);
    }
    let rightResult = (0, exports.compileAstNode)(ast.right, state);
    if (rightResult) {
        state = rightResult.state;
    }
    // )
    state = (0, exports.writeJsToken)(state, `) `);
    // write body
    let bodyResult = (0, exports.compileAstNode)(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    // result
    return {
        state,
        result: ast
    };
};
exports.compileForOfStatement = compileForOfStatement;
const compileArrayLiteral = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Array);
    if (!ast || !state) {
        return undefined;
    }
    // [
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `[`);
    state = (0, exports.addTargetIndent)(state, 1);
    // write items
    let items = ast.value;
    if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
            // separator
            if (i > 0) {
                state = (0, exports.writeJsToken)(state, `, `);
            }
            state = (0, exports.writeEndline)(state);
            state = (0, exports.writeTargetIndent)(state);
            // write item
            const itemAst = items[i];
            let itemResult = (0, exports.compileAstNode)(itemAst, state);
            if (itemResult) {
                state = itemResult.state;
            }
        }
    }
    // ]
    state = (0, exports.writeEndline)(state);
    state = (0, exports.addTargetIndent)(state, -1);
    state = (0, exports.writeTargetIndent)(state);
    state = (0, exports.writeJsToken)(state, `]`);
    // result
    return {
        state,
        result: ast
    };
};
exports.compileArrayLiteral = compileArrayLiteral;
const compileObjectLiteral = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Object);
    if (!ast || !state) {
        return undefined;
    }
    // {
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `{`);
    state = (0, exports.addTargetIndent)(state, 1);
    // write properties
    let props = ast.properties;
    if (props && props.length > 0) {
        for (let i = 0; i < props.length; i++) {
            // separator
            if (i > 0) {
                state = (0, exports.writeJsToken)(state, `, `);
            }
            state = (0, exports.writeEndline)(state);
            state = (0, exports.writeTargetIndent)(state);
            // write prop
            const propASt = props[i];
            let propResult = (0, exports.compileAstNode)(propASt, state);
            if (propResult) {
                state = propResult.state;
            }
        }
    }
    // }
    state = (0, exports.writeEndline)(state);
    state = (0, exports.addTargetIndent)(state, -1);
    state = (0, exports.writeTargetIndent)(state);
    state = (0, exports.writeJsToken)(state, `}`);
    // result
    return {
        state,
        result: ast
    };
};
exports.compileObjectLiteral = compileObjectLiteral;
const compileUpdateExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.UpdateExpression);
    if (!ast || !state) {
        return undefined;
    }
    if (ast.prefix === true) {
        // write operator
        if (ast.operator) {
            state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.operator.start);
        }
        let operatorResult = (0, exports.compileAstNode)(ast.operator, state);
        if (operatorResult) {
            state = operatorResult.state;
        }
    }
    // write argument
    let argResult = (0, exports.compileAstNode)(ast.argument, state);
    if (argResult) {
        state = argResult.state;
    }
    if (!ast.prefix) {
        // this is postfix
        // write operator
        let operatorResult = (0, exports.compileAstNode)(ast.operator, state);
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
exports.compileUpdateExpression = compileUpdateExpression;
const compileKeyword = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Keyword);
    if (!ast || !state) {
        return undefined;
    }
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, ast.keywordType);
    return {
        state,
        result: ast
    };
};
exports.compileKeyword = compileKeyword;
const compileConditionalExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ConditionalExpression);
    if (!ast || !state) {
        return undefined;
    }
    // condition ? then : else
    let condResult = (0, exports.compileAstNode)(ast.condition, state);
    if (condResult) {
        state = condResult.state;
    }
    // ?
    state = (0, exports.writeJsToken)(state, ` ? `);
    // then
    if (ast.whenTrue) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.whenTrue.start);
    }
    let thenResult = (0, exports.compileAstNode)(ast.whenTrue, state);
    if (thenResult) {
        state = thenResult.state;
    }
    // :
    state = (0, exports.writeJsToken)(state, ` : `);
    // else
    if (ast.whenFalse) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.whenFalse.start);
    }
    let elseResult = (0, exports.compileAstNode)(ast.whenFalse, state);
    if (elseResult) {
        state = elseResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileConditionalExpression = compileConditionalExpression;
const compileIndexerExpression = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.IndexerExpression);
    if (!ast || !state) {
        return undefined;
    }
    // write object[property]
    let member = ast.member;
    if (member) {
        // write obj
        if (member.object) {
            state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, member.object.start);
        }
        let objResult = (0, exports.compileAstNode)(member.object, state);
        if (objResult) {
            state = objResult.state;
        }
        // write [
        state = (0, exports.writeJsToken)(state, `[`);
        // write property
        let propResult = (0, exports.compileAstNode)(member.property, state);
        if (propResult) {
            state = propResult.state;
        }
        // write ]
        state = (0, exports.writeJsToken)(state, `]`);
    }
    return {
        state,
        result: ast
    };
};
exports.compileIndexerExpression = compileIndexerExpression;
const compileTryStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.TryStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write try
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `try `);
    // write body 
    let bodyResult = (0, exports.compileAstNode)(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    state = (0, exports.writeEndline)(state);
    // write catch
    let catchResult = (0, exports.compileAstNode)(ast.catchClause, state);
    if (catchResult) {
        state = catchResult.state;
    }
    state = (0, exports.writeEndline)(state);
    // write finally
    let finallyResult = (0, exports.compileAstNode)(ast.finallyBlock, state);
    if (finallyResult) {
        state = finallyResult.state;
    }
    state = (0, exports.writeEndline)(state);
    return {
        state,
        result: ast
    };
};
exports.compileTryStatement = compileTryStatement;
const compileCatchStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.CatchStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write catch
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `catch `);
    // write error declaration if any
    if (ast.varDeclaration) {
        state = (0, exports.writeJsToken)(state, `(`);
        let varResult = (0, exports.compileAstNode)(ast.varDeclaration, state);
        if (varResult) {
            state = varResult.state;
        }
        state = (0, exports.writeJsToken)(state, `) `);
    }
    // write body 
    let bodyResult = (0, exports.compileAstNode)(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileCatchStatement = compileCatchStatement;
const compileFinallyStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.FinallyStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write catch
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `finally `);
    // write body 
    let bodyResult = (0, exports.compileAstNode)(ast.body, state);
    if (bodyResult) {
        state = bodyResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileFinallyStatement = compileFinallyStatement;
const compileDebuggerKeyword = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.DebuggerKeyword);
    if (!ast || !state) {
        return undefined;
    }
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, ast.keywordType);
    return {
        state,
        result: ast
    };
};
exports.compileDebuggerKeyword = compileDebuggerKeyword;
const compileThrowStatement = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ThrowStatement);
    if (!ast || !state) {
        return undefined;
    }
    // write throw
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    state = (0, exports.writeJsToken)(state, `throw `);
    // write expression
    let exprResult = (0, exports.compileAstNode)(ast.expression, state);
    if (exprResult) {
        state = exprResult.state;
    }
    return {
        state,
        result: ast
    };
};
exports.compileThrowStatement = compileThrowStatement;
const compileToken = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Token);
    if (!ast || !state) {
        return undefined;
    }
    let value = ast.token.value;
    if (value === "`") {
        value = "\\`";
    }
    state = (0, exports.writeJsToken)(state, value || '');
    return {
        state,
        result: ast
    };
};
exports.compileToken = compileToken;
const compileTokenSequence = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.TokenSequence);
    if (!ast || !state) {
        return undefined;
    }
    for (let i = 0; i < ast.tokens.length; i++) {
        const token = ast.tokens[i];
        state = (0, exports.writeJsToken)(state, token.value || '');
    }
    return {
        state,
        result: ast
    };
};
exports.compileTokenSequence = compileTokenSequence;
const compileOperator = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Operator);
    if (!ast || !state) {
        return undefined;
    }
    state = (0, exports.addSourceMapAtCurrentPlace)(state, ast.value, ast.start);
    state = (0, exports.writeJsToken)(state, ast.value || '');
    return {
        state,
        result: ast
    };
};
exports.compileOperator = compileOperator;
const compileStringLiteral = (node, state) => {
    let ast = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.String);
    if (!ast || !state) {
        return undefined;
    }
    // add sourcemap
    state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, ast.start);
    // open `
    const withIncludes = ast.allowIncludes === true && ast.hasIncludes === true;
    state = (0, exports.writeJsToken)(state, withIncludes ? '`' : '"');
    let content = ast.value;
    for (let i = 0; i < content.length; i++) {
        const contentItem = content[i];
        let compileItemResult = (0, exports.compileAstNode)(contentItem, state);
        if (compileItemResult) {
            state = compileItemResult.state;
        }
    }
    // close `
    state = (0, exports.writeJsToken)(state, withIncludes ? '`' : '"');
    return {
        state,
        result: ast
    };
};
exports.compileStringLiteral = compileStringLiteral;
const writeIndentScope = (indentScope, state, astPos) => {
    if (!state) {
        return undefined;
    }
    if (astPos) {
        state = (0, exports.addSourceMapAtCurrentPlace)(state, undefined, astPos);
    }
    // context['
    state = (0, exports.writeJsToken)(state, `${exports.compilerConfig.contextVarName}`);
    for (let i = 0; i < indentScope.length; i++) {
        const indentItem = indentScope[i];
        const identifier = astFactory_1.astFactory.asNode(indentItem.identifier, AstNodeType_1.AstNodeType.Identifier);
        const isJsIdentifier = identifier && identifier.isJsIdentifier === true;
        if (isJsIdentifier) {
            state = (0, exports.writeJsToken)(state, ".");
        }
        else {
            state = (0, exports.writeJsToken)(state, "[\`");
        }
        // compile indent identifier
        let itemResult = (0, exports.compileAstNode)(indentItem.identifier, state);
        if (itemResult) {
            state = itemResult.state;
        }
        if (!isJsIdentifier) {
            state = (0, exports.writeJsToken)(state, "\`]");
        }
    }
    // done
    return state;
};
exports.writeIndentScope = writeIndentScope;
// SYSTEM FUNCTIONS
const isEndOfFile = (state) => {
    if (!state || !state.sourceState || !state.sourceState.ast || state.sourceState.ast.length === 0) {
        return true;
    }
    let astIndex = state.sourceState.astIndex;
    if (state.sourceState.ast.length > astIndex - 1) {
        return false;
    }
    return true;
};
exports.isEndOfFile = isEndOfFile;
const getParentScope = (indent, state) => {
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
exports.getParentScope = getParentScope;
const addIndentScopeItem = (scopeItem, state) => {
    if (!state || !scopeItem) {
        return state;
    }
    state = Object.assign(Object.assign({}, state), { sourceState: Object.assign(Object.assign({}, state.sourceState), { indentScope: [...state.sourceState.indentScope, scopeItem] }) });
    return state;
};
exports.addIndentScopeItem = addIndentScopeItem;
const setIndentScope = (scope, state) => {
    if (!state || !scope) {
        return state;
    }
    state = Object.assign(Object.assign({}, state), { sourceState: Object.assign(Object.assign({}, state.sourceState), { indentScope: scope }) });
    return state;
};
exports.setIndentScope = setIndentScope;
const skipAst = (state, count = 1) => {
    for (let i = 0; i < count; i++) {
        if ((0, exports.isEndOfFile)(state)) {
            break;
        }
        let astIndex = state.sourceState.astIndex + 1;
        let sourceState = Object.assign(Object.assign({}, state.sourceState), { astIndex });
        state = Object.assign(Object.assign({}, state), { sourceState });
    }
    return state;
};
exports.skipAst = skipAst;
const getAst = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let ast = state.sourceState.ast[state.sourceState.astIndex];
    return ast;
};
exports.getAst = getAst;
const addJavascript = (state, javascript) => {
    if (!state || !javascript) {
        return state;
    }
    let targetState = Object.assign(Object.assign({}, state.targetState), { javascript: [...state.targetState.javascript, ...javascript] });
    state = Object.assign(Object.assign({}, state), { targetState });
    return state;
};
exports.addJavascript = addJavascript;
const getIdentifierFromNode = (node, state) => {
    if (!node) {
        return undefined;
    }
    let identifier = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.Identifier);
    if (identifier) {
        return identifier;
    }
    let rawIdentifier = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.RawIdentifier);
    if (rawIdentifier) {
        identifier = astFactory_1.astFactory.asNode(rawIdentifier.value, AstNodeType_1.AstNodeType.Identifier);
        if (identifier) {
            return identifier;
        }
    }
    let contextIdentifier = astFactory_1.astFactory.asNode(node, AstNodeType_1.AstNodeType.ContextIdentifier);
    if (contextIdentifier) {
        identifier = (0, exports.getIdentifierFromNode)(contextIdentifier.value, state);
        if (identifier) {
            return identifier;
        }
    }
    return undefined;
};
exports.getIdentifierFromNode = getIdentifierFromNode;
const getIdentifierFullName = (node, indentScope, state) => {
    if (!indentScope) {
        return undefined;
    }
    // context['
    let result = [exports.compilerConfig.contextVarName];
    for (let i = 0; i < indentScope.length; i++) {
        const indentItem = indentScope[i];
        result.push('[\`');
        let identifier = (0, exports.getIdentifierFromNode)(indentItem.identifier, state);
        if (identifier) {
            result.push(identifier.value);
        }
        result.push('\`]');
    }
    if (node) {
        result.push(`[\`${node.value}\`]`);
    }
    return result.join('');
};
exports.getIdentifierFullName = getIdentifierFullName;
const addSourceMaps = (state, sourceMaps) => {
    if (!state || !sourceMaps) {
        return state;
    }
    let targetState = Object.assign(Object.assign({}, state.targetState), { sourceMaps: [...state.targetState.sourceMaps, ...sourceMaps] });
    state = Object.assign(Object.assign({}, state), { targetState });
    return state;
};
exports.addSourceMaps = addSourceMaps;
const addSourceMap = (state, sourceMap) => {
    if (!state || !sourceMap) {
        return state;
    }
    let targetState = Object.assign(Object.assign({}, state.targetState), { sourceMaps: [...state.targetState.sourceMaps, sourceMap] });
    state = Object.assign(Object.assign({}, state), { targetState });
    return state;
};
exports.addSourceMap = addSourceMap;
const addSourceMapAtCurrentPlace = (state, tokenName, symbolPos, jsLineOffset, stsLineOffset) => {
    if (!state) {
        return state;
    }
    if (!symbolPos) {
        return state;
    }
    let targetState = state.targetState;
    let cursor = targetState.cursor;
    let sourceFileName = state.sourceState.fileName;
    let sourceMapToken = undefined;
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
                column: symbolPos.column + stsOffset /* column number in StoryTailor source */
            },
            source: sourceFileName /* name of the StoryTailor source file */,
            name: tokenName
        };
    }
    if (sourceMapToken) {
        state = (0, exports.addSourceMap)(state, sourceMapToken);
    }
    return state;
};
exports.addSourceMapAtCurrentPlace = addSourceMapAtCurrentPlace;
const isNeedToLinkSourcemap = (astNode) => {
    if (!astNode) {
        return false;
    }
    if (exports.compilerConfig.sourceMappableAstNodes[astNode.nodeType] === true) {
        return true;
    }
    return false;
};
exports.isNeedToLinkSourcemap = isNeedToLinkSourcemap;
const addTargetIndent = (state, amount = 1) => {
    if (!state || !state.targetState) {
        return state;
    }
    state = (0, exports.setIndent)(state, state.targetState.indent + amount);
    return state;
};
exports.addTargetIndent = addTargetIndent;
const setIndent = (state, indent) => {
    if (!state || !state.targetState) {
        return state;
    }
    let targetState = state.targetState;
    targetState = Object.assign(Object.assign({}, targetState), { indent: indent });
    state = Object.assign(Object.assign({}, state), { targetState });
    return state;
};
exports.setIndent = setIndent;
const writeTargetIndent = (state) => {
    if (!state || !state.targetState || state.targetState.indent === 0) {
        return state;
    }
    state = (0, exports.writeJsToken)(state, "\t".repeat(state.targetState.indent));
    return state;
};
exports.writeTargetIndent = writeTargetIndent;
const writeJavascript = (state, javascript) => {
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
                state = (0, exports.writeJsToken)(state, exports.compilerConfig.endlineSymbol);
            }
            // write line text
            state = (0, exports.writeJsToken)(state, jsLine);
        }
    }
    // prepare result
    return state;
};
exports.writeJavascript = writeJavascript;
const writeEndline = (state) => {
    return (0, exports.writeJavascript)(state, exports.compilerConfig.endlineSymbol);
};
exports.writeEndline = writeEndline;
const writeJsToken = (state, jsToken) => {
    if (!state || !jsToken || jsToken.length === 0) {
        return state;
    }
    let targetState = state.targetState;
    let cursor = targetState.cursor;
    let javascript = targetState.javascript;
    // check is it endline
    if (jsToken.match(/^\r?\n$/)) {
        // endline
        // cursor
        cursor = Object.assign(Object.assign({}, cursor), { line: cursor.line + 1, column: 0, symbol: cursor.symbol + jsToken.length });
        // target state
        javascript = [...javascript, ''];
        targetState = Object.assign(Object.assign({}, targetState), { cursor,
            javascript });
        // update state
        state = Object.assign(Object.assign({}, state), { targetState });
        // return result
        return state;
    }
    // if we here that means token is not endline
    // cursor
    cursor = Object.assign(Object.assign({}, cursor), { column: cursor.column + jsToken.length, symbol: cursor.symbol + jsToken.length });
    // target state
    let jsLine = javascript.length > 0 ? javascript.length - 1 : 0;
    let lastLine = '';
    if (javascript.length > 0) {
        lastLine = javascript[jsLine];
    }
    else {
        javascript = [lastLine];
    }
    lastLine = lastLine + jsToken;
    javascript[jsLine] = lastLine;
    targetState = Object.assign(Object.assign({}, targetState), { cursor,
        javascript });
    // update state
    state = Object.assign(Object.assign({}, state), { targetState });
    return state;
};
exports.writeJsToken = writeJsToken;
const toStringSafe = (value) => {
    if (!value) {
        return undefined;
    }
    return value.toString();
};
exports.toStringSafe = toStringSafe;
