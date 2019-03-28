"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const CodeTokenType_1 = require("../shared/CodeTokenType");
const unescape_1 = require("./unescape");
const path = require("path");
const config = {
    environmentName: '__env',
    environmentPath: 'storytailor/out/environment',
    defaultEnvironmentPath: 'storytailor/out/environment',
    contextName: 'context',
    requireName: 'require',
    moduleName: 'module',
    exportsName: 'exports',
    textName: 'text',
    toStringName: 'objectToString',
    joinName: 'join',
    storyName: 'story',
    serializerName: 'serializer',
    serializeName: 'serialize',
    createStoryName: 'createStory',
    getSerializerName: 'getSerializer',
    thisName: 'this',
    objectName: 'Object',
    functionName: 'Function',
    booleanName: 'Boolean',
    symbolName: 'Symbol',
    errorName: 'Error',
    evanErrorName: 'EvalError',
    internalError: 'InternalError',
    rangeError: 'RangeError',
    referenceError: 'ReferenceError',
    syntaxError: 'SyntaxError',
    typeError: 'TypeError',
    uriError: 'URIError',
    numberName: 'Number',
    mathName: 'Math',
    dateName: 'Date',
    stringName: 'String',
    regexpName: 'RegExp',
    array: 'Array',
    int8Array: 'Int8Array',
    uint8Array: 'Uint8Array',
    uint8ClampedArray: 'Uint8ClampedArray',
    int16Array: 'Int16Array',
    uint16Array: 'Uint16Array',
    int32Array: 'Int32Array',
    uint32Array: 'Uint32Array',
    float32Array: 'Float32Array',
    float64Array: 'Float64Array',
    nanName: 'NaN',
    infinityName: 'Infinity',
    undefinedName: 'undefined',
    nullName: 'null',
    evalName: 'eval',
    isFinite: 'isFinite',
    isNan: 'isNaN',
    parseFloat: 'parseFloat',
    parseInt: 'parseInt',
    decodeUri: 'decodeURI',
    encodeUri: 'encodeURI',
    decodeUriComponent: 'decodeURIComponent',
    encodeUriComponent: 'encodeURIComponent',
    jsonName: 'JSON',
};
const gloablFunctions = [
    config.evalName,
    config.isFinite,
    config.isNan,
    config.parseFloat,
    config.parseInt,
    config.decodeUri,
    config.decodeUriComponent,
    config.encodeUri,
    config.encodeUriComponent
];
const globalObjects = [
    config.objectName,
    config.functionName,
    config.booleanName,
    config.symbolName,
    config.errorName,
    config.evanErrorName,
    config.internalError,
    config.rangeError,
    config.referenceError,
    config.syntaxError,
    config.typeError,
    config.uriError,
    config.numberName,
    config.mathName,
    config.dateName,
    config.stringName,
    config.regexpName,
    config.array,
    config.int8Array,
    config.uint8Array,
    config.uint8ClampedArray,
    config.int16Array,
    config.uint16Array,
    config.int32Array,
    config.uint32Array,
    config.float32Array,
    config.float64Array,
    config.jsonName,
    config.nullName,
    config.undefinedName
];
const globalNames = [
    ...gloablFunctions,
    ...globalObjects,
];
exports.parseModule = (tokens, modulePath, stsConfig) => {
    if (stsConfig.environmentPath) {
        config.environmentPath = stsConfig.environmentPath || config.defaultEnvironmentPath;
        let envPath = path.resolve(stsConfig.sourceRoot, stsConfig.environmentPath + '.js');
        let moduleDir = path.dirname(modulePath);
        let envDir = path.dirname(envPath);
        let relativeModulePath = path.relative(moduleDir, envDir);
        if (relativeModulePath === '') {
            relativeModulePath = '.';
        }
        let envModulePath = relativeModulePath + '/' + stsConfig.environmentPath;
        config.environmentPath = envModulePath;
    }
    if (!config.environmentPath) {
        config.environmentPath = config.defaultEnvironmentPath;
    }
    let environmentPath = config.environmentPath;
    if (!tokens) {
        return undefined;
    }
    let result = ts.createSourceFile(modulePath, '', ts.ScriptTarget.Latest);
    let state = {
        tokens: tokens,
        cursor: 0,
        sourceFile: result,
        scope: [],
        errors: [],
        indent: 0
    };
    /**
     * function createStory() {
     * this.environment = require('storytailor/environment');
     *  this.serializer = environment.getSerializer();
     *  this.text = [];
     *  // ... user code
     *  return this;
     * }
     *
     * const story = createStory();
     * export default story;
     */
    // this.environment = require('storytailor/environment')
    let importEnvironment = ts.createExpressionStatement(ts.createBinary(ts.createPropertyAccess(ts.createThis(), ts.createIdentifier(config.environmentName)), ts.SyntaxKind.EqualsToken, ts.createCall(ts.createIdentifier('require'), undefined, [
        ts.createStringLiteral(environmentPath)
    ])));
    // this.serializer = this.environment.getSerializer();
    let createSerializer = ts.createExpressionStatement(ts.createBinary(ts.createElementAccess(ts.createThis(), ts.createStringLiteral(config.serializerName)), ts.SyntaxKind.EqualsToken, ts.createCall(ts.createElementAccess(ts.createElementAccess(ts.createThis(), ts.createStringLiteral(config.environmentName)), ts.createStringLiteral(config.getSerializerName)), undefined, [])));
    // this.text = [];
    let createResultText = ts.createExpressionStatement(ts.createBinary(ts.createElementAccess(ts.createThis(), ts.createStringLiteral(config.textName)), ts.SyntaxKind.EqualsToken, ts.createArrayLiteral([])));
    let createStoryHeader = [
        importEnvironment,
        createSerializer,
    ];
    let userCode = [];
    while (!exports.isEndOfFile(state)) {
        // skip comment line
        let commentResult;
        while (commentResult = exports.parseEndlineComment(state, true)) {
            state = commentResult.state;
        }
        // check statement
        let statementResult = exports.parseStatement(state);
        if (statementResult) {
            state = statementResult.state;
            userCode = [...userCode, ...statementResult.result];
            continue;
        }
        // if we here, skip unparsed token
        state = exports.skipTokens(state, 1);
    }
    let createStoryFooter = [
        ts.createReturn(ts.createThis())
    ];
    let createStoryFunction = ts.createFunctionDeclaration(undefined, undefined, undefined, ts.createIdentifier(config.createStoryName), undefined, undefined, undefined, ts.createBlock([
        ...createStoryHeader,
        ...userCode,
        ...createStoryFooter
    ], true));
    createStoryFunction = ts.createVariableStatement(undefined, ts.createVariableDeclarationList([
        ts.createVariableDeclaration(ts.createIdentifier(config.createStoryName), undefined, ts.createArrowFunction(undefined, undefined, undefined, undefined, undefined, ts.createBlock([
            ...createStoryHeader,
            ...userCode,
            ...createStoryFooter
        ], true)))
    ], ts.NodeFlags.Const));
    // const story = createStory.call({});
    let createStoryCall = ts.createVariableStatement(undefined, ts.createVariableDeclarationList([
        ts.createVariableDeclaration(ts.createIdentifier(config.storyName), undefined, ts.createCall(ts.createPropertyAccess(ts.createIdentifier(config.createStoryName), ts.createIdentifier('call')), undefined, [
            ts.createObjectLiteral()
        ]))
    ], ts.NodeFlags.Const));
    //export default story;
    let defaultExport = ts.createExportDefault(ts.createIdentifier(config.storyName));
    // module.exports = story;
    let moduleExport = ts.createExpressionStatement(ts.createBinary(ts.createPropertyAccess(ts.createIdentifier('module'), ts.createIdentifier('exports')), ts.SyntaxKind.EqualsToken, ts.createIdentifier(config.storyName)));
    let moduleStatements = [
        createStoryFunction,
        createStoryCall,
        defaultExport,
        moduleExport
    ];
    result.statements = ts.createNodeArray(moduleStatements);
    return {
        state,
        result
    };
};
exports.parseStatement = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // it can be import declaration
    const importResult = exports.parseImportDeclaration(state);
    if (importResult) {
        state = importResult.state;
        let result = [importResult.result];
        return {
            state,
            result
        };
    }
    // it can be variable declaration
    let variableResult = exports.parseVariableDeclaration(state);
    if (variableResult) {
        state = variableResult.state;
        let result = [variableResult.result];
        return {
            state,
            result
        };
    }
    // it can be code block
    let codeblockResult = exports.parseCodeblock(state);
    if (codeblockResult) {
        state = codeblockResult.state;
        let result = codeblockResult.result;
        return {
            state,
            result
        };
    }
    // it can be add text line
    let addtextResult = exports.parseAddTextLine(state);
    if (addtextResult) {
        state = addtextResult.state;
        let result = [addtextResult.result];
        return {
            state,
            result
        };
    }
    return undefined;
};
exports.parseEndlineComment = (state, skipEndline) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // if previous token was / then this is not a comment line
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Backslash], -1)) {
        return undefined;
    }
    // state = skipWhitespace(state);
    if (exports.checkTokenSequence(state, [CodeTokenType_1.CodeTokenType.CommentLine])) {
        let prevToken = exports.getToken(state, -1);
        if (prevToken && prevToken.type === CodeTokenType_1.CodeTokenType.Backslash) {
            return undefined;
        }
        state = exports.skipWhitespace(state);
        state = exports.skipUntil(state, [CodeTokenType_1.CodeTokenType.Endline]);
        if (skipEndline && exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Endline])) {
            state = exports.skipTokens(state, 1);
        }
        return {
            state,
            result: {}
        };
    }
    return undefined;
};
exports.parseImportDeclaration = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // skip empty line before if exists
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = exports.skipTokens(state, 1);
    }
    // read indent
    let indent = 0;
    let whitespaceResult = exports.readWhitespace(state);
    if (whitespaceResult) {
        state = whitespaceResult.state;
        indent = Math.floor((whitespaceResult.result || '').length / 2);
    }
    // read import mark *+
    const markSequence = [CodeTokenType_1.CodeTokenType.Star, CodeTokenType_1.CodeTokenType.Plus, CodeTokenType_1.CodeTokenType.Space];
    if (!exports.checkTokenSequence(state, markSequence)) {
        return undefined;
    }
    state = exports.skipTokens(state, markSequence.length);
    // read import name
    let varnameResult = exports.readString(state, [CodeTokenType_1.CodeTokenType.Endline, CodeTokenType_1.CodeTokenType.CommentLine, CodeTokenType_1.CodeTokenType.Equals, CodeTokenType_1.CodeTokenType.Semicolon], true);
    if (!varnameResult) {
        return undefined;
    }
    state = varnameResult.state;
    let varname = varnameResult.result;
    // skip spaces
    state = exports.skipWhitespace(state);
    // read import path
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Equals])) {
        state = exports.skipTokens(state, 1);
    }
    // skip comment line
    let skipCommentResult = exports.parseEndlineComment(state, false);
    if (skipCommentResult) {
        state = skipCommentResult.state;
    }
    // read the rest of the line as module path
    let modulePath = '';
    let modulePathResult = exports.readString(state, [CodeTokenType_1.CodeTokenType.Endline, CodeTokenType_1.CodeTokenType.Semicolon], true);
    if (modulePathResult) {
        state = modulePathResult.state;
        modulePath = modulePathResult.result;
    }
    // skip semicolon if any
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Semicolon])) {
        state = exports.skipTokens(state, 1);
    }
    // skip endline after import
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = exports.skipTokens(state, 1);
    }
    // skip next line if it empty
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = exports.skipTokens(state, 1);
    }
    // 1. check indent and prepare scope
    let parentsCount = Math.min(indent, state.scope.length);
    let scope = state.scope.slice(0, parentsCount);
    // add current varname to the scope so if next code line will be with greater indent, that will mean that line is a subline of mine
    scope = [...scope, varname];
    // 2. create variable full name starting with this
    let varName = ts.createThis();
    for (let i = 0; i < scope.length; i++) {
        varName = ts.createElementAccess(varName, ts.createStringLiteral(scope[i]));
    }
    // this['varname'] = require('modulePath');
    let result = ts.createExpressionStatement(ts.createBinary(
    // this['varname]
    varName, 
    // =
    ts.SyntaxKind.EqualsToken, 
    // this['varname'] || {}
    ts.createCall(ts.createIdentifier(config.requireName), undefined, [
        ts.createStringLiteral(modulePath)
    ])));
    state = Object.assign({}, state, { scope: scope, indent: indent });
    return {
        state,
        result,
    };
};
exports.parseVariableDeclaration = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // skip empty line before if exists
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = exports.skipTokens(state, 1);
    }
    // read indent
    let indent = 0;
    let whitespaceResult = exports.readWhitespace(state);
    if (whitespaceResult) {
        state = whitespaceResult.state;
        indent = Math.floor((whitespaceResult.result || '').length / 2);
    }
    // read variiable mark *
    const markSequence = [CodeTokenType_1.CodeTokenType.Star, CodeTokenType_1.CodeTokenType.Space];
    if (!exports.checkTokenSequence(state, markSequence)) {
        return undefined;
    }
    state = exports.skipTokens(state, markSequence.length);
    // read variable name
    let varnameResult = exports.readString(state, [CodeTokenType_1.CodeTokenType.Endline, CodeTokenType_1.CodeTokenType.CommentLine], true);
    if (!varnameResult) {
        return undefined;
    }
    state = varnameResult.state;
    let varname = varnameResult.result;
    // skip comment line
    let skipCommentResult = exports.parseEndlineComment(state, false);
    if (skipCommentResult) {
        state = skipCommentResult.state;
    }
    /* skip endline token */
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = exports.skipTokens(state, 1);
    }
    // 1. check indent and prepare scope
    let parentsCount = Math.min(indent, state.scope.length);
    let scope = state.scope.slice(0, parentsCount);
    // add current varname to the scope so if next code line will be with greater indent, that will mean that line is a subline of mine
    scope = [...scope, varname];
    // 2. create variable full name starting with this
    let varName = ts.createThis();
    for (let i = 0; i < scope.length; i++) {
        varName = ts.createElementAccess(varName, ts.createStringLiteral(scope[i]));
    }
    // this['varname'] = this['varname'] || {};
    let result = ts.createExpressionStatement(ts.createBinary(
    // this['varname]
    varName, 
    // =
    ts.SyntaxKind.EqualsToken, 
    // this['varname'] || {}
    ts.createBinary(varName, ts.SyntaxKind.BarBarToken, ts.createObjectLiteral())));
    state = Object.assign({}, state, { scope: scope, indent: indent });
    return {
        state,
        result,
    };
};
exports.parseCodeblock = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // skip empty line before if exists
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = exports.skipTokens(state, 1);
    }
    // read indent
    state = exports.skipWhitespace(state, true);
    // read variiable mark *
    const markSequence = [CodeTokenType_1.CodeTokenType.Star, CodeTokenType_1.CodeTokenType.BraceOpen];
    if (!exports.checkTokenSequence(state, markSequence)) {
        return undefined;
    }
    // skip star, but don't skip {
    state = exports.skipTokens(state, 1);
    // parse {} scope
    let scopeResult = exports.parseScope(state, [CodeTokenType_1.CodeTokenType.BraceOpen], [CodeTokenType_1.CodeTokenType.BraceClose]);
    if (!scopeResult) {
        return undefined;
    }
    state = scopeResult.state;
    let result = scopeResult.result.map((expr) => {
        return ts.createExpressionStatement(expr);
    });
    // skip empty line after if exists
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = exports.skipTokens(state, 1);
    }
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = exports.skipTokens(state, 1);
    }
    return {
        result,
        state
    };
};
exports.parseAddTextLine = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // read indent
    let indent = 0;
    let whitespaceResult = exports.readWhitespace(state);
    if (whitespaceResult) {
        indent = Math.floor((whitespaceResult.result || '').length / 2);
        indent = Math.min(state.scope.length, indent);
        for (let i = 0; i < indent * 2; i++) {
            if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Space])) {
                state = exports.skipTokens(state, 1);
            }
        }
    }
    // parse line text as template
    let templateResult = exports.parseTemplate(state, [CodeTokenType_1.CodeTokenType.Endline]);
    let template;
    if (templateResult) {
        state = templateResult.state;
        template = templateResult.result;
    }
    // skip endline
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = exports.skipTokens(state, 1);
    }
    // 1. check indent and prepare parent
    let parentsCount = Math.min(indent, state.scope.length);
    let scope = state.scope.slice(0, parentsCount);
    state = Object.assign({}, state, { scope: scope });
    // 2. create variable full name starting with this
    let varName = ts.createThis();
    for (let i = 0; i < scope.length; i++) {
        varName = ts.createElementAccess(varName, ts.createStringLiteral(scope[i]));
    }
    // add ['text'] tp varname
    varName = ts.createElementAccess(varName, ts.createStringLiteral(config.textName));
    // this['varname']['text'] = [...(this['varname']['text']), 'new line'];
    let result = ts.createExpressionStatement(ts.createBinary(
    // this['varname]
    varName, 
    // =
    ts.SyntaxKind.EqualsToken, 
    // [...(this['varname']['text']), 'new line']
    ts.createArrayLiteral([
        // ...(this['varname']['text'])
        ts.createSpread(ts.createParen(ts.createBinary(varName, ts.SyntaxKind.BarBarToken, ts.createArrayLiteral()))),
        // 'new line'
        template
    ])));
    return {
        state,
        result
    };
};
exports.parseTemplate = (state, breakTokens) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    if (exports.getTokenOfType(state, breakTokens)) {
        let result = ts.createStringLiteral('');
        state = exports.skipTokens(state, 1);
        return {
            state,
            result
        };
    }
    // parse template items until break tokens
    let templateItemResult;
    let templateItems;
    while (templateItemResult = exports.parseTemplateItem(state, breakTokens)) {
        state = templateItemResult.state;
        templateItems = exports.addItemToArray(templateItems, templateItemResult.result);
        if (exports.getTokenOfType(state, breakTokens)) {
            break;
        }
    }
    // create result
    let result;
    templateItems.forEach((item) => {
        if (!result) {
            result = item;
            return;
        }
        result = ts.createBinary(result, ts.SyntaxKind.PlusToken, item);
    });
    return {
        state,
        result
    };
};
exports.parseTemplateItem = (state, breakTokens) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // template item can be mention or string
    // parse mention
    let mentionResult = exports.parseMention(state);
    if (mentionResult) {
        return mentionResult;
    }
    // parse string
    let stringResult = exports.readString(state, [...breakTokens, CodeTokenType_1.CodeTokenType.Star, CodeTokenType_1.CodeTokenType.CommentLine]);
    if (stringResult) {
        state = stringResult.state;
        let resultText;
        try {
            resultText = stringResult.result || '';
            resultText = resultText.replace(/((?:^|[^\\])(?:\\\\)*)(\\\/)/, '$1/');
            resultText = unescape_1.default(resultText);
        }
        catch (error) {
            console.error(error);
            resultText = stringResult.result;
        }
        let result = ts.createStringLiteral(resultText);
        return {
            result: result,
            state: state
        };
    }
    // if we here and we have * that means this is star without mention. don't skip it
    let nextToken = exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Star]);
    if (nextToken) {
        let result = ts.createStringLiteral(nextToken.value || '*');
        state = exports.skipTokens(state, 1);
        return {
            result,
            state
        };
    }
    return undefined;
};
exports.parseMention = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // check * mark
    if (!exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Star, CodeTokenType_1.CodeTokenType.Endline])) {
        return undefined;
    }
    state = exports.skipTokens(state, 1);
    // parse mention target until ;
    let mtResult = exports.parseExpression(state, false);
    if (!mtResult) {
        return undefined;
    }
    state = mtResult.state;
    let target = mtResult.result;
    // mention is a this.serializer.serialize(target, '\n') call
    let result = ts.createCall(
    // this.serializer.serialize
    ts.createPropertyAccess(
    // this.serializer
    ts.createElementAccess(ts.createThis(), ts.createStringLiteral(config.serializerName)), 
    // serialize
    ts.createIdentifier(config.serializeName)), undefined, 
    // target, separator (default is '\n')
    [
        target,
        ts.createStringLiteral('\n')
    ]);
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Semicolon])) {
        state = exports.skipTokens(state, 1);
    }
    return {
        result: result,
        state: state,
    };
};
exports.parseExpression = (state, isMultiline) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // parse expression start. it can be number, string, identifier, paren operation
    let expressionStartResult = exports.parseOperand(state);
    if (!expressionStartResult) {
        return undefined;
    }
    state = expressionStartResult.state;
    let result = expressionStartResult.result;
    // parse operation
    let breakTokens = [CodeTokenType_1.CodeTokenType.Semicolon, CodeTokenType_1.CodeTokenType.Comma, CodeTokenType_1.CodeTokenType.BracketClose, CodeTokenType_1.CodeTokenType.ParenClose, CodeTokenType_1.CodeTokenType.BraceClose];
    if (!isMultiline) {
        breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Endline];
    }
    while (!exports.getTokenOfType(state, breakTokens) && !exports.isEndOfFile(state)) {
        // skip empty space
        state = exports.skipWhitespace(state, isMultiline);
        if (exports.getTokenOfType(state, breakTokens)) {
            break;
        }
        let operationResult = exports.parseOperation(state, result, isMultiline);
        if (operationResult) {
            state = operationResult.state;
            result = operationResult.result;
            continue;
        }
        state = exports.skipTokens(state, 1);
    }
    return {
        state,
        result
    };
};
exports.parseOperation = (state, leftOperand, isMultiline) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // parse get operation
    let getOperationResult = exports.parseGetOperation(state, leftOperand);
    if (getOperationResult) {
        return getOperationResult;
    }
    // parse call
    let callResult = exports.parseCall(state, leftOperand);
    if (callResult) {
        return callResult;
    }
    // parse indexer
    let indexerResult = exports.parseIndexer(state, leftOperand);
    if (indexerResult) {
        return indexerResult;
    }
    // parse binary
    let binaryResult = exports.parseBinary(state, leftOperand, isMultiline);
    if (binaryResult) {
        return binaryResult;
    }
    return undefined;
};
exports.parseBinary = (state, leftOperand, isMultiline) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // parse operator
    let operatorResult = exports.parseBinaryOperator(state);
    if (!operatorResult) {
        return undefined;
    }
    state = operatorResult.state;
    let operator = operatorResult.result;
    // skip empty space
    state = exports.skipWhitespace(state, isMultiline);
    // parse right expression
    let rightOperand;
    let rightOperandResult = exports.parseExpression(state, isMultiline);
    if (rightOperandResult) {
        state = rightOperandResult.state;
        rightOperand = rightOperandResult.result;
    }
    // prepare result
    let result = ts.createBinary(leftOperand, operator, rightOperand);
    return {
        state,
        result
    };
};
exports.parseCall = (state, leftOperand) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // parse scope
    let scopeResult = exports.parseScope(state, [CodeTokenType_1.CodeTokenType.ParenOpen], [CodeTokenType_1.CodeTokenType.ParenClose]);
    if (!scopeResult) {
        return undefined;
    }
    state = scopeResult.state;
    let result = ts.createCall(leftOperand, undefined, scopeResult.result);
    return {
        state,
        result
    };
};
exports.parseIndexer = (state, leftOperand) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // parse all expressions between [ and ]
    let scopeResult = exports.parseScope(state, [CodeTokenType_1.CodeTokenType.BracketOpen], [CodeTokenType_1.CodeTokenType.BracketClose]);
    if (!scopeResult) {
        return undefined;
    }
    state = scopeResult.state;
    // result is a first expression is a scope. or undefined in case this is an empty scope
    let expression = scopeResult.result.length > 0 ? scopeResult.result[0] : undefined;
    let result = ts.createElementAccess(leftOperand, expression);
    return {
        state,
        result
    };
};
exports.parseGetOperation = (state, leftOperand) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // parse get operator
    if (!exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Dot])) {
        return undefined;
    }
    state = exports.skipTokens(state, 1);
    // parse .'varname'
    let literalResult = exports.parseStringLiteral(state, [CodeTokenType_1.CodeTokenType.Prime], [CodeTokenType_1.CodeTokenType.Prime]);
    if (literalResult) {
        state = literalResult.state;
        let result = ts.createElementAccess(leftOperand, ts.createStringLiteral(literalResult.result));
        return {
            result,
            state
        };
    }
    // parse .varname
    let wordResult = exports.parseWord(state);
    if (wordResult) {
        state = wordResult.state;
        let result = ts.createElementAccess(leftOperand, ts.createStringLiteral(wordResult.result));
        return {
            result,
            state
        };
    }
    return undefined;
};
exports.parseOperand = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // number
    let numberResult = exports.parseNumber(state);
    if (numberResult) {
        state = numberResult.state;
        let result = ts.createNumericLiteral(numberResult.result.toString());
        return {
            state,
            result
        };
    }
    // template literal (text with *mentions)
    let templateLiteralResult = exports.parseTemplateLiteral(state, [CodeTokenType_1.CodeTokenType.Quote], [CodeTokenType_1.CodeTokenType.Quote]);
    if (templateLiteralResult) {
        return templateLiteralResult;
    }
    // string literal
    let stringResult = exports.parseStringLiteral(state, [CodeTokenType_1.CodeTokenType.Quote], [CodeTokenType_1.CodeTokenType.Quote]);
    if (stringResult) {
        state = stringResult.state;
        let result = ts.createStringLiteral(stringResult.result);
        return {
            state,
            result
        };
    }
    // identifier, quoted with prime, a.k. 'variable name'
    let quotedTextResult = exports.parseStringLiteral(state, [CodeTokenType_1.CodeTokenType.Prime], [CodeTokenType_1.CodeTokenType.Prime]);
    if (quotedTextResult) {
        state = quotedTextResult.state;
        let result = exports.createCorrectIdentifierOperand(quotedTextResult.result);
        if (result) {
            return {
                state,
                result
            };
        }
        return undefined;
    }
    // identifier word, a.k. variableName
    let wordResult = exports.parseWord(state);
    if (wordResult) {
        state = wordResult.state;
        let result = exports.createCorrectIdentifierOperand(wordResult.result);
        if (result) {
            return {
                state,
                result
            };
        }
        return undefined;
    }
    // paren expression
    let parenExpressionResult = exports.parseParenthesizedExpression(state);
    if (parenExpressionResult) {
        state = parenExpressionResult.state;
        let result = parenExpressionResult.result;
        return {
            state,
            result
        };
    }
    let arrayLiteralResult = exports.parseArrayLiteral(state);
    if (arrayLiteralResult) {
        state = arrayLiteralResult.state;
        let result = arrayLiteralResult.result;
        return {
            state,
            result
        };
    }
    return undefined;
};
exports.createCorrectIdentifierOperand = (operandText) => {
    if (!operandText) {
        return undefined;
    }
    if (operandText === config.thisName) {
        let result = ts.createThis();
        return result;
    }
    if (globalNames.some((item) => item === operandText)) {
        let result = ts.createIdentifier(operandText);
        return result;
    }
    let result = ts.createElementAccess(ts.createThis(), ts.createStringLiteral(operandText));
    return result;
};
exports.parseTemplateLiteral = (state, openTokens, breakTokens) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // skip oepn token
    if (!exports.getTokenOfType(state, openTokens)) {
        return undefined;
    }
    state = exports.skipTokens(state, 1);
    // parse template items until break tokens
    let templateItemResult;
    let templateItems = [];
    while (templateItemResult = exports.parseTemplateItem(state, breakTokens)) {
        state = templateItemResult.state;
        templateItems = exports.addItemToArray(templateItems, templateItemResult.result);
        if (exports.getTokenOfType(state, breakTokens)) {
            break;
        }
    }
    if (templateItems.length === 0) {
        templateItems = [
            ts.createStringLiteral('')
        ];
    }
    // create result
    let result;
    templateItems.forEach((item) => {
        if (!result) {
            result = item;
            return;
        }
        result = ts.createBinary(result, ts.SyntaxKind.PlusToken, item);
    });
    // skip end token
    if (exports.getTokenOfType(state, breakTokens)) {
        state = exports.skipTokens(state, 1);
    }
    return {
        result: result,
        state: state
    };
};
exports.parseParenthesizedExpression = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // parse all expressions between ( and )
    let scopeResult = exports.parseScope(state, [CodeTokenType_1.CodeTokenType.ParenOpen], [CodeTokenType_1.CodeTokenType.ParenClose]);
    if (!scopeResult) {
        return undefined;
    }
    state = scopeResult.state;
    // result is a first expression is a scope. or undefined in case this is an empty scope
    let expression = scopeResult.result.length > 0 ? scopeResult.result[0] : undefined;
    let result = ts.createParen(expression);
    return {
        state,
        result
    };
};
exports.parseArrayLiteral = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // parse all expressions between ( and )
    let scopeResult = exports.parseScope(state, [CodeTokenType_1.CodeTokenType.BracketOpen], [CodeTokenType_1.CodeTokenType.BracketClose]);
    if (!scopeResult) {
        return undefined;
    }
    state = scopeResult.state;
    // result is a first expression is a scope. or undefined in case this is an empty scope
    let result = ts.createArrayLiteral(scopeResult.result);
    return {
        state,
        result
    };
};
exports.parseScope = (state, openTokens, closeTokens) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // skip open token
    if (!exports.getTokenOfType(state, openTokens)) {
        return undefined;
    }
    state = exports.skipTokens(state, 1);
    let result = [];
    // parse expressions until )
    while (!exports.isEndOfFile(state) && !exports.getTokenOfType(state, closeTokens)) {
        // skip empty space
        state = exports.skipWhitespace(state, true);
        if (exports.getTokenOfType(state, closeTokens)) {
            break;
        }
        // read expression
        let expressionResult = exports.parseExpression(state, true);
        if (expressionResult) {
            state = expressionResult.state;
            result = [...(result || []), expressionResult.result];
            continue;
        }
        let commentsResult = exports.parseEndlineComment(state, false);
        if (commentsResult) {
            state = commentsResult.state;
            continue;
        }
        // if we here, just skip token we weren't able to parse
        state = exports.skipTokens(state, 1);
    }
    // skip close token
    if (exports.getTokenOfType(state, closeTokens)) {
        state = exports.skipTokens(state, 1);
    }
    return {
        state,
        result
    };
};
exports.parseBinaryOperator = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Plus])) {
        state = exports.skipTokens(state, 1);
        let result = ts.SyntaxKind.PlusToken;
        return {
            state,
            result
        };
    }
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Minus])) {
        state = exports.skipTokens(state, 1);
        let result = ts.SyntaxKind.MinusToken;
        return {
            state,
            result
        };
    }
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Slash])) {
        state = exports.skipTokens(state, 1);
        let result = ts.SyntaxKind.SlashToken;
        return {
            state,
            result
        };
    }
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Star])) {
        state = exports.skipTokens(state, 1);
        let result = ts.SyntaxKind.AsteriskToken;
        return {
            state,
            result
        };
    }
    if (exports.checkTokenSequence(state, [CodeTokenType_1.CodeTokenType.OrSign, CodeTokenType_1.CodeTokenType.OrSign])) {
        state = exports.skipTokens(state, 2);
        let result = ts.SyntaxKind.BarBarToken;
        return {
            state,
            result
        };
    }
    if (exports.checkTokenSequence(state, [CodeTokenType_1.CodeTokenType.Equals, CodeTokenType_1.CodeTokenType.Equals, CodeTokenType_1.CodeTokenType.Equals])) {
        state = exports.skipTokens(state, 3);
        let result = ts.SyntaxKind.EqualsEqualsEqualsToken;
        return {
            state,
            result
        };
    }
    if (exports.checkTokenSequence(state, [CodeTokenType_1.CodeTokenType.Equals, CodeTokenType_1.CodeTokenType.Equals])) {
        state = exports.skipTokens(state, 2);
        let result = ts.SyntaxKind.EqualsEqualsToken;
        return {
            state,
            result
        };
    }
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Equals])) {
        state = exports.skipTokens(state, 1);
        let result = ts.SyntaxKind.EqualsToken;
        return {
            state,
            result
        };
    }
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.TupleOpen])) {
        state = exports.skipTokens(state, 1);
        let result = ts.SyntaxKind.LessThanToken;
        return {
            state,
            result
        };
    }
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.TupleClose])) {
        state = exports.skipTokens(state, 1);
        let result = ts.SyntaxKind.GreaterThanToken;
        return {
            state,
            result
        };
    }
    return undefined;
};
exports.parseWord = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // identifier can be word or string literal
    let result;
    // if it's not quoted string
    let word = exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Word]);
    if (word) {
        result = word.value;
        state = exports.skipTokens(state, 1);
        return {
            state,
            result
        };
    }
    return undefined;
};
exports.parseNumber = (state) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    let word = exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Word]);
    if (!word) {
        return undefined;
    }
    // parse first digit
    let firstDigit = Number(word.value);
    if (isNaN(firstDigit)) {
        return undefined;
    }
    state = exports.skipTokens(state, 1);
    let stringResult = '' + firstDigit;
    if (exports.getTokenOfType(state, [CodeTokenType_1.CodeTokenType.Dot])) {
        let substate = exports.skipTokens(state, 1);
        // try parse next digit
        let nextToken = exports.getTokenOfType(substate, [CodeTokenType_1.CodeTokenType.Word]);
        if (nextToken) {
            let nextDigit = Number(nextToken.value);
            if (!isNaN(nextDigit)) {
                stringResult += '.' + nextDigit;
                state = exports.skipTokens(substate, 1);
            }
        }
    }
    let result = Number(stringResult);
    if (!isNaN(result)) {
        return {
            state,
            result
        };
    }
    return undefined;
};
exports.parseStringLiteral = (state, openTokens, breakTokens) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    // skip oepn token
    if (!exports.getTokenOfType(state, openTokens)) {
        return undefined;
    }
    state = exports.skipTokens(state, 1);
    // read everything until end quote
    let stringResult = exports.readString(state, breakTokens);
    let result = '';
    if (stringResult) {
        state = stringResult.state;
        result = stringResult.result || '';
    }
    try {
        result = unescape_1.default(result);
    }
    catch (error) {
        console.error(error);
    }
    // skip end token
    if (exports.getTokenOfType(state, breakTokens)) {
        state = exports.skipTokens(state, 1);
    }
    return {
        result: result,
        state: state
    };
};
exports.readString = (state, breakTokens, trimString = false) => {
    if (exports.isEndOfFile(state)) {
        return undefined;
    }
    let result;
    let nextToken;
    let offset = 0;
    while (nextToken = exports.getToken(state, offset)) {
        if (!nextToken) {
            break;
        }
        if (breakTokens.indexOf(nextToken.type) >= 0) {
            let escapedRegexp = /(^|^.*?[^\\](\\\\)*)\\$/;
            let testResult = escapedRegexp.test(result);
            if (!testResult) {
                break;
            }
        }
        result = (result || '') + nextToken.value;
        offset++;
    }
    if (!result) {
        return undefined;
    }
    state = exports.skipTokens(state, offset);
    if (trimString) {
        result = result.trim();
    }
    if (!result) {
        return undefined;
    }
    return {
        result,
        state
    };
};
// single line!
exports.readWhitespace = (state) => {
    return exports.readTokensAsString(state, [CodeTokenType_1.CodeTokenType.Space]);
};
exports.readTokensAsString = (state, tokenTypes) => {
    let value;
    let nextToken;
    while (nextToken = exports.getTokenOfType(state, tokenTypes)) {
        value = (value || '') + nextToken.value;
        state = exports.skipTokens(state, 1);
    }
    if (!value) {
        return undefined;
    }
    return {
        state: state,
        result: value
    };
};
exports.isEndOfFile = (state, offset = 0) => {
    if (!state || !state.tokens || state.tokens.length <= 0) {
        return true;
    }
    const cursor = state.cursor + offset;
    return state.tokens.length <= cursor;
};
exports.addItemToArray = (source, item) => {
    source = source || [];
    return [
        ...source,
        item
    ];
};
exports.addItemToHash = (source, key, item) => {
    source = source || {};
    return Object.assign({}, source, { [key]: item });
};
exports.getToken = (state, offset = 0) => {
    if (exports.isEndOfFile(state, offset)) {
        return undefined;
    }
    const cursor = state.cursor + offset;
    if (cursor < 0) {
        return undefined;
    }
    return state.tokens[cursor];
};
exports.getTokenOfType = (state, types, offset = 0) => {
    if (exports.isEndOfFile(state, offset)) {
        return undefined;
    }
    const cursor = state.cursor + offset;
    if (cursor < 0) {
        return undefined;
    }
    const token = state.tokens[cursor];
    if (!token) {
        return undefined;
    }
    if (types.indexOf(token.type) < 0) {
        return undefined;
    }
    return token;
};
exports.getCursorPosition = (state) => {
    if (!state) {
        return undefined;
    }
    if (exports.isEndOfFile(state)) {
        if (state.tokens.length > 0) {
            let lastToken = state.tokens[state.tokens.length - 1];
            return lastToken.start;
        }
    }
    const nextToken = exports.getToken(state);
    return nextToken.start;
};
exports.skipWhitespace = (state, multiline = false) => {
    const tokenTypes = multiline
        ? [CodeTokenType_1.CodeTokenType.Space, CodeTokenType_1.CodeTokenType.Endline]
        : [CodeTokenType_1.CodeTokenType.Space];
    return exports.skipTokensOfType(state, tokenTypes);
};
exports.skipTokenOfType = (state, tokenTypes) => {
    let nextToken = exports.getTokenOfType(state, tokenTypes);
    if (nextToken) {
        state = exports.skipTokens(state, 1);
    }
    return state;
};
exports.skipTokensOfType = (state, tokenTypes) => {
    if (exports.isEndOfFile(state)) {
        return state;
    }
    if (!tokenTypes || tokenTypes.length <= 0) {
        return state;
    }
    let nextToken;
    while (nextToken = exports.getToken(state)) {
        if (tokenTypes.indexOf(nextToken.type) < 0) {
            return state;
        }
        state = exports.skipTokens(state, 1);
    }
    return state;
};
exports.skipUntil = (state, tokenTypes) => {
    if (exports.isEndOfFile(state)) {
        return state;
    }
    if (!tokenTypes || tokenTypes.length <= 0) {
        return state;
    }
    let nextToken;
    while (nextToken = exports.getToken(state)) {
        if (tokenTypes.indexOf(nextToken.type) >= 0) {
            return state;
        }
        state = exports.skipTokens(state, 1);
    }
    return state;
};
exports.checkTokenSequence = (state, tokenTypes) => {
    if (exports.isEndOfFile(state)) {
        return false;
    }
    if (!tokenTypes || tokenTypes.length <= 0) {
        return true;
    }
    for (let i = 0; i < tokenTypes.length; i++) {
        const tokenType = tokenTypes[i];
        const token = exports.getToken(state, i);
        if (!token || token.type !== tokenType) {
            // broken sequence
            return undefined;
        }
    }
    return true;
};
exports.skipTokens = (state, tokensCount) => {
    if (exports.isEndOfFile(state)) {
        if (tokensCount === 0)
            return state;
        return undefined;
    }
    const cursor = state.cursor + tokensCount;
    if (state.tokens.length < cursor) {
        return undefined;
    }
    state = Object.assign({}, state, { cursor: cursor });
    return state;
};
