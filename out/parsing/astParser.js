"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseObjectLineTags = exports.parseFunctionParameters = exports.parseCodeBlock = exports.parseRegularCodeBlock = exports.parseRawCodeBlock = exports.parseCommentBlock = exports.parseCommentLine = exports.parseKeywordOfType = exports.parseDebuggerKeyword = exports.parseKeyword = exports.parseUnaryOperatorPostfix = exports.parseUnaryOperatorPrefix = exports.parseBinaryOperator = exports.parseOperatorOfType = exports.parseOperator = exports.parseThrowStatement = exports.parseFinallyStatement = exports.parseCatchStatement = exports.parseTryStatement = exports.parseImportItem = exports.parseRawImportStatement = exports.parseImportPath = exports.parseImportStatement = exports.parseForOfStatement = exports.parseForInStatement = exports.parseForOfConditions = exports.parseForInConditions = exports.parseConditionBlock = exports.parseForCoditions = exports.parseForStatement = exports.parseWhileStatement = exports.parseDoWhileStatement = exports.parseDefaultCaseStatement = exports.parseCaseStatement = exports.parseSwitchStatement = exports.parseIfStatement = exports.parseContinueStatement = exports.parseReturnStatement = exports.parseBreakStatement = exports.parseStaticStatement = exports.parseExportStatement = exports.parseStatement = exports.parseTextLineStatement = exports.parseDeleteLineExpression = exports.parseObjectLine = exports.parseOuterStatementContent = exports.parseOuterStatement = exports.parseRootStatement = exports.parseModule = exports.defaultParserConfig = void 0;
exports.parseErrorTokens = exports.parseScope = exports.parseToken = exports.parseKeywordNode = exports.parseNode = exports.parseTag = exports.parseTypeofExpression = exports.parseDeleteExpression = exports.parseYieldExpression = exports.parseAwaitExpression = exports.parseNewExpression = exports.parseConditionalExpression = exports.parseMemberExpression = exports.parseBinaryExpression = exports.parseUpdateExpressionPostfix = exports.parseIndexerExpression = exports.parseCallArguments = exports.parseCallExpression = exports.parseParenExpression = exports.parseOperation = exports.parseOperand = exports.parseOperationExpression = exports.parseKeywordExpression = exports.parseExpression = exports.parseVariableDeclaration = exports.parseDeconstructionAssignment = exports.parseClassMember = exports.parseClassDeclaration = exports.parseOperandIdentifier = exports.parseContextIdentifier = exports.parseAnyIdentifier = exports.parseRawIdentifier = exports.parseObjectLineIdentifier = exports.parseIdentifierScope = exports.parseIdentifier = exports.parseGetterSetter = exports.parseFunction = exports.parseObjectProperty = exports.parseObjectLiteralItem = exports.parseObject = exports.parseArrayElement = exports.parseArrayLiteral = exports.parseRegexParenScope = exports.parseRegexLiteral = exports.parseBooleanLiteral = exports.parseStringInclude = exports.parseStringLiteralItem = exports.parseStringLiteral = exports.parseNumberLiteral = exports.parseLiteral = void 0;
exports.optionsCodeBlock = exports.optionsOuterLine = exports.emptyOptions = exports.prepareTokens = exports.addInvalidTokenSequenceError = exports.addInvalidTokenError = exports.addParsingError = exports.skipTokens = exports.parseTokenSequences = exports.checkTokenSequences = exports.parseTokenSequence = exports.checkTokenSequence = exports.skipUntil = exports.skipTokensOfType = exports.skipTokenOfType = exports.skipWhitespace = exports.skipCommentBlock = exports.skipCommentLine = exports.skipComments = exports.getCursorPosition = exports.getTokenOfType = exports.getToken = exports.addItemToHash = exports.addItemToArray = exports.isValidJsIdentifier = exports.isEndOfFile = exports.readTokensAsString = exports.calcIndentFromWhitespace = exports.readWhitespace = exports.readString = void 0;
const CodeTokenType_1 = require("../shared/CodeTokenType");
const IParsingError_1 = require("../shared/IParsingError");
const KeywordType_1 = require("../ast/KeywordType");
const VariableDeclarationKind_1 = require("../ast/VariableDeclarationKind");
const OperatorType_1 = require("../ast/OperatorType");
const astFactory_1 = require("../ast/astFactory");
const AstNodeType_1 = require("../ast/AstNodeType");
let keywords = [];
for (const key in KeywordType_1.KeywordType) {
    if (KeywordType_1.KeywordType.hasOwnProperty(key)) {
        const value = KeywordType_1.KeywordType[key];
        keywords = [...keywords, value];
    }
}
const operators = [
    CodeTokenType_1.CodeTokenType.Plus,
    CodeTokenType_1.CodeTokenType.Minus,
    CodeTokenType_1.CodeTokenType.Dot,
    CodeTokenType_1.CodeTokenType.Colon,
    CodeTokenType_1.CodeTokenType.Percent,
    CodeTokenType_1.CodeTokenType.TupleOpen,
    CodeTokenType_1.CodeTokenType.TupleClose,
    CodeTokenType_1.CodeTokenType.Star,
    CodeTokenType_1.CodeTokenType.Slash,
    CodeTokenType_1.CodeTokenType.Equals,
    CodeTokenType_1.CodeTokenType.Question,
    CodeTokenType_1.CodeTokenType.NotSign,
    CodeTokenType_1.CodeTokenType.OrSign,
    CodeTokenType_1.CodeTokenType.Ampersand
];
const separators = [
    ...operators,
    CodeTokenType_1.CodeTokenType.Semicolon,
    CodeTokenType_1.CodeTokenType.Endline,
    CodeTokenType_1.CodeTokenType.ParenOpen,
    CodeTokenType_1.CodeTokenType.ParenClose,
    CodeTokenType_1.CodeTokenType.BraceOpen,
    CodeTokenType_1.CodeTokenType.BraceClose,
    CodeTokenType_1.CodeTokenType.BracketOpen,
    CodeTokenType_1.CodeTokenType.BracketClose,
    CodeTokenType_1.CodeTokenType.Comma
];
exports.defaultParserConfig = {
    indentSize: 2
};
let parserConfig = exports.defaultParserConfig;
let indentWhitespaceString = "  ";
// general
const parseModule = (tokens, modulePath, config) => {
    // prepare config
    if (config) {
        parserConfig = Object.assign({}, config);
        if (!parserConfig.indentSize) {
            parserConfig.indentSize = exports.defaultParserConfig.indentSize;
        }
        if (!parserConfig.indentSize) {
            parserConfig.indentSize = 2;
        }
        indentWhitespaceString = " ".repeat(parserConfig.indentSize);
    }
    // prepare tokens
    tokens = (0, exports.prepareTokens)(tokens);
    if (!tokens) {
        return undefined;
    }
    let symbols = {
        symbols: {},
    };
    let state = {
        cursor: 0,
        errors: [],
        indent: 0,
        tokens: tokens,
        imports: [],
        symbols: symbols
    };
    let programContent = [];
    // parse module content
    while (!(0, exports.isEndOfFile)(state)) {
        var moduleContentResult = (0, exports.parseRootStatement)(state);
        if (moduleContentResult && moduleContentResult.state) {
            state = moduleContentResult.state;
            if (moduleContentResult.result) {
                programContent.push(moduleContentResult.result);
            }
            continue;
        }
        // otherwise just skip token. it's unparsable
        state = (0, exports.skipTokens)(state, 1);
    }
    let moduleStart = {
        symbol: 0,
        line: 0,
        column: 0
    };
    let moduleEnd = Object.assign({}, moduleStart);
    if (programContent.length > 0) {
        moduleEnd = Object.assign({}, programContent[programContent.length - 1].end);
    }
    let astProgram = astFactory_1.astFactory.program(programContent, moduleStart, moduleEnd);
    let astModule = astFactory_1.astFactory.module(tokens, astProgram, state.imports, modulePath);
    var result = {
        result: astModule,
        state: state
    };
    return result;
};
exports.parseModule = parseModule;
// statements
const parseRootStatement = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    const options = {
        isMultiline: false,
        allowContextIdentifiers: true
    };
    // parses any content that can be in the root of module
    // skip comments
    const newState = (0, exports.skipComments)(state, false, Object.assign(Object.assign({}, options), { isMultiline: false }));
    // skip the fully commented line
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endfile]) && newState.cursor > state.cursor) {
        return {
            state: (0, exports.skipTokens)(newState, 1),
            result: undefined
        };
    }
    // if we're here, that means it's not the end of line and we've skipped all the comments already
    // parse outer expression
    let outerExpressionResult = (0, exports.parseOuterStatement)(state, options);
    if (outerExpressionResult) {
        return outerExpressionResult;
    }
    // parse text line
    let textLineResult = (0, exports.parseTextLineStatement)(state, options);
    if (textLineResult) {
        return textLineResult;
    }
    // if we did not manage to find anything, return nothing
    return undefined;
};
exports.parseRootStatement = parseRootStatement;
const parseOuterStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // read whitespace
    let indent = 0;
    let whitespaceResult = (0, exports.readWhitespace)(state);
    if (whitespaceResult) {
        indent = (0, exports.calcIndentFromWhitespace)(whitespaceResult.result);
        state = whitespaceResult.state;
    }
    // check open tokens
    let openSeqResult = (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Star, CodeTokenType_1.CodeTokenType.Space]);
    if (!openSeqResult) {
        return undefined;
    }
    state = openSeqResult.state;
    // skip comments
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: false }));
    // parse statement
    let statement = undefined;
    let contentResult = (0, exports.parseOuterStatementContent)(state, options);
    if (contentResult) {
        state = contentResult.state;
        statement = contentResult.result;
        // check if statement is code block and if so, unwrap code from that block
        let codeBlock = astFactory_1.astFactory.asNode(statement, AstNodeType_1.AstNodeType.BlockStatement);
        if (codeBlock) {
            codeBlock = Object.assign(Object.assign({}, codeBlock), { withoutBraces: true });
            statement = codeBlock;
        }
    }
    // skip comments
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: false }));
    // any excess symbols until endline are invalid
    state = (0, exports.parseErrorTokens)(state, (stat) => (0, exports.getTokenOfType)(stat, [CodeTokenType_1.CodeTokenType.Endline]) !== undefined);
    // skip endline
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.outerStatement(indent, statement, start, end);
    return {
        state: state,
        result: result
    };
};
exports.parseOuterStatement = parseOuterStatement;
const parseOuterStatementContent = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // Parse Block
    let codeLineResult = (0, exports.parseCodeBlock)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
    if (codeLineResult) {
        return codeLineResult;
    }
    let deleteLineResult = (0, exports.parseDeleteLineExpression)(state, options);
    if (deleteLineResult) {
        return deleteLineResult;
    }
    // parse import
    const importResult = (0, exports.parseImportStatement)(state, Object.assign(Object.assign({}, options), { isMultiline: false }));
    if (importResult) {
        return importResult;
    }
    // raw import
    const rawImportResult = (0, exports.parseRawImportStatement)(state, Object.assign(Object.assign({}, options), { isMultiline: false }));
    if (rawImportResult) {
        return rawImportResult;
    }
    // Parse Object Line Statement
    let objectLineResult = (0, exports.parseObjectLine)(state, options);
    if (objectLineResult) {
        return objectLineResult;
    }
    // Parse Statement
    let statementResult = (0, exports.parseStatement)(state, Object.assign(Object.assign({}, options), { isMultiline: false }));
    if (statementResult) {
        return statementResult;
    }
    return undefined;
};
exports.parseOuterStatementContent = parseOuterStatementContent;
const parseObjectLine = (state, options) => {
    var _a;
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // identifier [tags] [= initExpression]
    let identifier = undefined;
    let identifierScopeResult = (0, exports.parseIdentifierScope)(state, options);
    if (identifierScopeResult) {
        identifier = identifierScopeResult.result;
        state = identifierScopeResult.state;
    }
    else {
        let objectLineIdentifier = (0, exports.parseObjectLineIdentifier)(state, options);
        if (objectLineIdentifier) {
            identifier = objectLineIdentifier.result;
            state = objectLineIdentifier.state;
        }
    }
    if (!identifier) {
        return undefined;
    }
    const start = identifier === null || identifier === void 0 ? void 0 : identifier.start;
    // skip comments
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: false }));
    // parse tags
    let tags = undefined;
    const tagsResult = (0, exports.parseObjectLineTags)(state, Object.assign(Object.assign({}, options), { isMultiline: false }));
    if (tagsResult) {
        state = tagsResult.state;
        tags = tagsResult.result;
    }
    // skip comments
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: false }));
    // read init operation
    let initValue = undefined;
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Equals])) {
        state = (0, exports.skipTokens)(state, 1);
        // skip comments
        state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: false }));
        // read init value
        let initValueResult = (0, exports.parseExpression)(state, Object.assign(Object.assign({}, options), { isMultiline: false }));
        if (initValueResult) {
            state = initValueResult.state;
            initValue = initValueResult.result;
        }
    }
    // and skip everything until the end of line
    state = (0, exports.skipUntil)(state, [CodeTokenType_1.CodeTokenType.Endline]);
    // create result ast node
    const result = astFactory_1.astFactory.objectLineStatement(identifier, initValue, tags, start, (_a = initValue === null || initValue === void 0 ? void 0 : initValue.end) !== null && _a !== void 0 ? _a : identifier === null || identifier === void 0 ? void 0 : identifier.end);
    return {
        state,
        result
    };
};
exports.parseObjectLine = parseObjectLine;
const parseDeleteLineExpression = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    const start = (0, exports.getCursorPosition)(state);
    // delete Object Name
    // parse delete keyword
    let deleteResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Delete]);
    if (!deleteResult) {
        return undefined;
    }
    state = deleteResult.state;
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: false }));
    // parse identifier
    let identifier = undefined;
    const identifierResult = (0, exports.parseOperandIdentifier)(state, options);
    if (identifierResult) {
        identifier = identifierResult.result;
        state = identifierResult.state;
    }
    const end = (0, exports.getCursorPosition)(state);
    // create result ast node
    let result = astFactory_1.astFactory.deleteLineExpression(identifier, start, end);
    return {
        state,
        result
    };
};
exports.parseDeleteLineExpression = parseDeleteLineExpression;
const parseTextLineStatement = (state, options) => {
    var _a, _b;
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // check indent
    let indent = 0;
    let whitespaceResult = (0, exports.readWhitespace)(state);
    if (whitespaceResult) {
        indent = (0, exports.calcIndentFromWhitespace)(whitespaceResult.result); //Math.trunc(whitespaceResult.result.length);
        state = whitespaceResult.state;
    }
    // parse text line as string literal content
    let content = [];
    let isSkippedLine = false;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        const contextSymbol = (_a = (0, exports.getCursorPosition)(state)) === null || _a === void 0 ? void 0 : _a.symbol;
        // skip comments
        state = (0, exports.skipComments)(state, false, options);
        // end line ends the text line. If it's a commented line
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endline])) {
            if (((_b = (0, exports.getCursorPosition)(state)) === null || _b === void 0 ? void 0 : _b.symbol) !== contextSymbol) {
                isSkippedLine = true;
            }
            break;
        }
        // parse word
        let stringItem = (0, exports.parseStringLiteralItem)(state, options);
        if (stringItem) {
            state = stringItem.state;
            content = [
                ...content,
                stringItem.result
            ];
        }
        // skip comments
        state = (0, exports.skipComments)(state, false, Object.assign(Object.assign({}, options), { isMultiline: false }));
        continue;
    }
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    let end = (0, exports.getCursorPosition)(state);
    let result = isSkippedLine
        ? undefined
        : astFactory_1.astFactory.textLineStatement(indent, content, start, end);
    return {
        state: state,
        result: result
    };
};
exports.parseTextLineStatement = parseTextLineStatement;
const parseStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    return (0, exports.parseNode)(state, options, [
        exports.parseExportStatement,
        exports.parseStaticStatement,
        exports.parseClassDeclaration,
        exports.parseVariableDeclaration,
        exports.parseDeconstructionAssignment,
        exports.parseBreakStatement,
        exports.parseReturnStatement,
        exports.parseContinueStatement,
        exports.parseIfStatement,
        exports.parseSwitchStatement,
        exports.parseWhileStatement,
        exports.parseDoWhileStatement,
        exports.parseForOfStatement,
        exports.parseForInStatement,
        exports.parseForStatement,
        exports.parseImportStatement,
        exports.parseRawImportStatement,
        exports.parseTryStatement,
        exports.parseCatchStatement,
        exports.parseFinallyStatement,
        exports.parseDebuggerKeyword,
        exports.parseThrowStatement,
        exports.parseExpression
    ]);
};
exports.parseStatement = parseStatement;
const parseExportStatement = (state, options) => {
    return (0, exports.parseKeywordNode)(state, true, options, [KeywordType_1.KeywordType.Export], [exports.parseStatement]);
};
exports.parseExportStatement = parseExportStatement;
const parseStaticStatement = (state, options) => {
    return (0, exports.parseKeywordNode)(state, true, options, [KeywordType_1.KeywordType.Static], [exports.parseStatement]);
};
exports.parseStaticStatement = parseStaticStatement;
const parseBreakStatement = (state, options) => {
    var _a, _b;
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse keyword
    const keywordResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Break]);
    if (!keywordResult) {
        return undefined;
    }
    state = keywordResult.state;
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: false }));
    // next should be endline or semicolon
    const endTokens = [CodeTokenType_1.CodeTokenType.Semicolon, CodeTokenType_1.CodeTokenType.Endline];
    if ((0, exports.getTokenOfType)(state, endTokens)) {
        state = (0, exports.skipTokenOfType)(state, endTokens);
    }
    else {
        state = (0, exports.addInvalidTokenError)(state, (0, exports.getToken)(state));
    }
    return {
        state,
        result: astFactory_1.astFactory.breakStatement((_a = keywordResult.result) === null || _a === void 0 ? void 0 : _a.start, (_b = keywordResult.result) === null || _b === void 0 ? void 0 : _b.end)
    };
};
exports.parseBreakStatement = parseBreakStatement;
const parseReturnStatement = (state, options) => {
    return (0, exports.parseKeywordNode)(state, true, options, [KeywordType_1.KeywordType.Return], [exports.parseExpression]);
};
exports.parseReturnStatement = parseReturnStatement;
const parseContinueStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // parse keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Continue]);
    if (!keywordResult) {
        return undefined;
    }
    state = keywordResult.state;
    // skip whitespace
    state = (0, exports.skipWhitespace)(state, Object.assign(Object.assign({}, options), { isMultiline: false }));
    // skip until ; or endline
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Semicolon, CodeTokenType_1.CodeTokenType.Endline])) {
        let nextToken = (0, exports.getToken)(state);
        let errorStart = (0, exports.getCursorPosition)(state);
        state = (0, exports.skipTokens)(state, 1);
        let errorEnd = (0, exports.getCursorPosition)(state);
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "unexpected symbol '" + nextToken.value || nextToken.type + "'", errorStart, errorEnd);
    }
    // skip ; if any
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Semicolon])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.continueStatement(start, end);
    return {
        result,
        state
    };
};
exports.parseContinueStatement = parseContinueStatement;
const parseIfStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let condition = undefined;
    let thenProgram = undefined;
    let elseProgram = undefined;
    let finalState = undefined;
    let ifResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.If]);
    if (!ifResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = ifResult.state;
    finalState = state;
    // prepare break tokens that will break the statement
    let breakTokens = options.isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    // parse until break tokens
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse condition
        let conditionScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseExpression)(state, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, options));
        if (conditionScopeResult) {
            state = conditionScopeResult.state;
            finalState = state;
            let scope = conditionScopeResult.result;
            if (scope) {
                let conditions = scope.content;
                if (conditions && conditions.length > 0) {
                    condition = conditions[0];
                }
                // TODO: ADD ALL OTHER EXPRESSIONS TO ERROR LIST
                // TEMP: skip all of them
            }
        }
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // skip everything until { or else or breakTokens
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) !== undefined || (0, exports.parseKeyword)(state, options) !== undefined);
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse then body
        let codeBlockResult = (0, exports.parseCodeBlock)(state, options);
        if (codeBlockResult) {
            thenProgram = codeBlockResult.result;
            state = codeBlockResult.state;
            finalState = state;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // skip everything until else or breakTokens
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, breakTokens) !== undefined || (0, exports.parseKeyword)(state, options) !== undefined);
        // parse else
        let elseResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Else]);
        if (elseResult) {
            state = elseResult.state;
            finalState = state;
            // skip comments and whitespaces
            state = (0, exports.skipComments)(state, true, options);
            // skip everything until { or else or breakTokens
            state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) !== undefined);
            // check sequence end
            if ((0, exports.getTokenOfType)(state, breakTokens)) {
                break;
            }
            // parse else body
            if ((0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.If])) {
                // this is nested if statement
                let nestedIfResult = (0, exports.parseIfStatement)(state, options);
                if (nestedIfResult) {
                    state = nestedIfResult.state;
                    finalState = state;
                    elseProgram = nestedIfResult.result;
                }
                else {
                    // if there was if keyword but nothing parsed then
                    break;
                }
            }
            else {
                // if there was no nested if
                // parse else program 
                let codeBlockResult = (0, exports.parseCodeBlock)(state, options);
                if (codeBlockResult) {
                    elseProgram = codeBlockResult.result;
                    state = codeBlockResult.state;
                    finalState = state;
                }
            }
        }
        break;
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.ifStatement(condition, thenProgram, elseProgram, start, end);
    return {
        state,
        result
    };
};
exports.parseIfStatement = parseIfStatement;
const parseSwitchStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let condition = undefined;
    let cases;
    let finalState = undefined;
    let switchResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Switch]);
    if (!switchResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = switchResult.state;
    finalState = state;
    // prepare break tokens that will break the statement
    let breakTokens = options.isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    // parse until break tokens
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse condition
        let conditionScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseExpression)(state, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, options));
        if (conditionScopeResult) {
            state = conditionScopeResult.state;
            finalState = state;
            let scope = conditionScopeResult.result;
            if (scope) {
                let conditions = scope.content;
                if (conditions && conditions.length > 0) {
                    condition = conditions[0];
                }
                // TODO: ADD ALL OTHER EXPRESSIONS TO ERROR LIST
                // TEMP: skip all of them
            }
        }
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // skip everything until { or else or breakTokens
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) !== undefined || (0, exports.parseKeyword)(state, options) !== undefined);
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // parse swich body
        let bodyResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true })), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceOpen]), (state) => {
            // skip comments and whitespaces
            state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
            // case
            let caseResult = (0, exports.parseCaseStatement)(state, options);
            if (caseResult) {
                return caseResult;
            }
            // default case
            let defaultCaseResult = (0, exports.parseDefaultCaseStatement)(state, options);
            if (defaultCaseResult) {
                return defaultCaseResult;
            }
            return undefined;
        }, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceClose]), (state) => (0, exports.skipComments)(state, true, options));
        if (bodyResult) {
            state = bodyResult.state;
            finalState = bodyResult.state;
            if (bodyResult.result) {
                cases = bodyResult.result.content;
            }
        }
        break;
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.switchStatement(condition, cases, start, end);
    return {
        state,
        result
    };
};
exports.parseSwitchStatement = parseSwitchStatement;
const parseCaseStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse case keyword
    let caseResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Case]);
    if (!caseResult) {
        return undefined;
    }
    let breakTokens = [CodeTokenType_1.CodeTokenType.BraceClose];
    let condition = undefined;
    let body = [];
    let consequent = undefined;
    let start = (0, exports.getCursorPosition)(state);
    state = caseResult.state;
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
    let finalState = state;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse condition
        let conditionResult = (0, exports.parseExpression)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
        if (conditionResult) {
            state = conditionResult.state;
            finalState = state;
            condition = conditionResult.result;
        }
        // skip comments and check break tokens
        state = (0, exports.skipComments)(state);
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // parse :
        // skip everything until : or break token
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.Colon]) !== undefined);
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Colon])) {
            state = (0, exports.skipTokens)(state, 1);
        }
        // parse statements until break token or case or default or return keywords
        while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens) && !(0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Case, KeywordType_1.KeywordType.Default, KeywordType_1.KeywordType.Return, KeywordType_1.KeywordType.Break])) {
            // parse body statement
            let bodyStatementResult = (0, exports.parseStatement)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
            if (bodyStatementResult) {
                state = bodyStatementResult.state;
                finalState = state;
                body = [...body, bodyStatementResult.result];
                continue;
            }
            // skip separators
            if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Semicolon])) {
                state = (0, exports.skipTokens)(state, 1);
                finalState = state;
                continue;
            }
            // skip comments and whitespaces
            state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
            if (state.cursor !== finalState.cursor) {
                continue;
            }
            // otherwise it's incorrect token
            state = (0, exports.addInvalidTokenError)(state, (0, exports.getToken)(state));
            state = (0, exports.skipTokens)(state, 1);
        }
        finalState = state;
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
        // skip everything until break tokens or keyword
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens]) !== undefined || (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Case, KeywordType_1.KeywordType.Default, KeywordType_1.KeywordType.Return, KeywordType_1.KeywordType.Break]) !== undefined);
        // parse consequent
        // parse retrun or break statements
        let breakStatementResult = (0, exports.parseBreakStatement)(state, options);
        if (breakStatementResult) {
            consequent = breakStatementResult.result;
            state = breakStatementResult.state;
            finalState = state;
        }
        else {
            let returnStatementResult = (0, exports.parseReturnStatement)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
            if (returnStatementResult) {
                consequent = returnStatementResult.result;
                state = returnStatementResult.state;
                finalState = state;
            }
        }
        break;
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.caseStatement(condition, body, consequent, start, end);
    return {
        result,
        state
    };
};
exports.parseCaseStatement = parseCaseStatement;
const parseDefaultCaseStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse default keyword
    let defaultResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Default]);
    if (!defaultResult) {
        return undefined;
    }
    let breakTokens = [CodeTokenType_1.CodeTokenType.BraceClose];
    let condition = undefined;
    let body = [];
    let consequent = undefined;
    let start = (0, exports.getCursorPosition)(state);
    state = defaultResult.state;
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
    let finalState = state;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse :
        // skip everything until : or break token
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.Colon]) !== undefined);
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Colon])) {
            state = (0, exports.skipTokens)(state, 1);
        }
        // parse statements until break token or case or default or return keywords
        while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens) && !(0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Case, KeywordType_1.KeywordType.Default, KeywordType_1.KeywordType.Return, KeywordType_1.KeywordType.Break])) {
            // parse body statement
            let bodyStatementResult = (0, exports.parseStatement)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
            if (bodyStatementResult) {
                state = bodyStatementResult.state;
                finalState = state;
                body = [...body, bodyStatementResult.result];
                continue;
            }
            // skip separators
            if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Semicolon])) {
                state = (0, exports.skipTokens)(state, 1);
                finalState = state;
                continue;
            }
            // skip comments and whitespaces
            state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
            if (state.cursor !== finalState.cursor) {
                continue;
            }
            // otherwise it's incorrect token
            state = (0, exports.addInvalidTokenError)(state, (0, exports.getToken)(state));
            state = (0, exports.skipTokens)(state, 1);
        }
        finalState = state;
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
        // skip everything until break tokens or keyword
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens]) !== undefined || (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Case, KeywordType_1.KeywordType.Default, KeywordType_1.KeywordType.Return, KeywordType_1.KeywordType.Break]) !== undefined);
        // parse consequent
        // parse retrun or break statements
        let breakStatementResult = (0, exports.parseBreakStatement)(state, options);
        if (breakStatementResult) {
            consequent = breakStatementResult.result;
            state = breakStatementResult.state;
            finalState = state;
        }
        else {
            let returnStatementResult = (0, exports.parseReturnStatement)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
            if (returnStatementResult) {
                consequent = returnStatementResult.result;
                state = returnStatementResult.state;
                finalState = state;
            }
        }
        break;
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.caseStatement(condition, body, consequent, start, end);
    return {
        result,
        state
    };
};
exports.parseDefaultCaseStatement = parseDefaultCaseStatement;
const parseDoWhileStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let condition = undefined;
    let bodyProgram = undefined;
    let finalState = undefined;
    let doResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Do]);
    if (!doResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = doResult.state;
    finalState = state;
    // prepare break tokens that will break the statement
    let breakTokens = options.isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    // parse until break tokens
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // skip everything until { or breakTokens or while
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) !== undefined || (0, exports.parseKeyword)(state, options) !== undefined);
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse body program
        let codeBlockResult = (0, exports.parseCodeBlock)(state, options);
        if (codeBlockResult) {
            bodyProgram = codeBlockResult.result;
            state = codeBlockResult.state;
            finalState = state;
        }
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // skip everything until ( or breakTokens or while
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.ParenOpen]) !== undefined || (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.While]) !== undefined);
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse while
        let whileResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.While]);
        if (whileResult) {
            state = whileResult.state;
            finalState = state;
            // check sequence end
            if ((0, exports.getTokenOfType)(state, breakTokens)) {
                break;
            }
            // skip comments and whitespaces
            state = (0, exports.skipComments)(state, true, options);
            // skip everything until ( or breakTokens or while
            state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.ParenOpen]) !== undefined || (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.While]) !== undefined);
            // check sequence end
            if ((0, exports.getTokenOfType)(state, breakTokens)) {
                break;
            }
            // parse condition
            let conditionScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseExpression)(state, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, options));
            if (conditionScopeResult) {
                state = conditionScopeResult.state;
                finalState = state;
                let scope = conditionScopeResult.result;
                if (scope) {
                    let conditions = scope.content;
                    if (conditions && conditions.length > 0) {
                        condition = conditions[0];
                    }
                    // TODO: ADD ALL OTHER EXPRESSIONS TO ERROR LIST
                    // TEMP: skip all of them
                }
            }
        }
        break;
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.doWhileStatement(condition, bodyProgram, start, end);
    return {
        state,
        result
    };
};
exports.parseDoWhileStatement = parseDoWhileStatement;
const parseWhileStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let condition = undefined;
    let bodyProgram = undefined;
    let finalState = undefined;
    let whileResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.While]);
    if (!whileResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = whileResult.state;
    finalState = state;
    let condStart = (0, exports.getCursorPosition)(state);
    let condEnd = (0, exports.getCursorPosition)(state);
    let codeBlockStart = (0, exports.getCursorPosition)(state);
    // prepare break tokens that will break the statement
    let breakTokens = options.isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    // parse until break tokens
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse condition
        let conditionScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseExpression)(state, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true })));
        if (conditionScopeResult) {
            state = conditionScopeResult.state;
            finalState = state;
            let scope = conditionScopeResult.result;
            if (scope) {
                condStart = scope.start;
                condEnd = scope.end;
                let conditions = scope.content;
                if (conditions && conditions.length > 0) {
                    condition = conditions[0];
                    // TODO: ADD ALL OTHER EXPRESSIONS TO ERROR LIST
                    for (let i = 1; i < conditions.length; i++) {
                        const excessCondition = conditions[i];
                        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, `Excess symbols`, excessCondition.start, excessCondition.end);
                    }
                }
                // TEMP: skip all of them
            }
        }
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // skip everything until { or else or breakTokens
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) !== undefined || (0, exports.parseKeyword)(state, options) !== undefined);
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        codeBlockStart = (0, exports.getCursorPosition)(state);
        // parse body program
        let codeBlockResult = (0, exports.parseCodeBlock)(state, options);
        if (codeBlockResult) {
            bodyProgram = codeBlockResult.result;
            state = codeBlockResult.state;
            finalState = state;
        }
        break;
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.whileStatement(condition, bodyProgram, start, end);
    // check condition
    if (!condition) {
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, `while expression needs condition`, condStart, condEnd);
    }
    // check code block
    if (!condition) {
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, `while expression needs code block`, codeBlockStart, condEnd);
    }
    return {
        state,
        result
    };
};
exports.parseWhileStatement = parseWhileStatement;
const parseForStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let init = undefined;
    let test = undefined;
    let update = undefined;
    let bodyProgram = undefined;
    let finalState = undefined;
    let forResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.For]);
    if (!forResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = forResult.state;
    finalState = state;
    // prepare break tokens that will break the statement
    let breakTokens = options.isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    // parse until break tokens
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse condition
        let conditionScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseStatement)(state, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => {
            // comments
            let cursor = state.cursor;
            state = (0, exports.skipComments)(state, true, options);
            if (state.cursor > cursor) {
                return state;
            }
            // if not comments, then semicolon
            if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Semicolon])) {
                state = (0, exports.skipTokens)(state, 1);
                return state;
            }
            return state;
        });
        if (conditionScopeResult) {
            state = conditionScopeResult.state;
            finalState = state;
            let scope = conditionScopeResult.result;
            if (scope && scope.content) {
                let conditions = scope.content;
                if (conditions.length > 0) {
                    init = conditions[0];
                }
                if (conditions.length > 1) {
                    test = conditions[1];
                }
                if (conditions.length > 2) {
                    update = conditions[2];
                }
                // TODO: ADD ALL OTHER EXPRESSIONS TO ERROR LIST
                // TEMP: skip all of them
            }
        }
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // skip everything until { or else or breakTokens
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) !== undefined || (0, exports.parseKeyword)(state, options) !== undefined);
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse body program
        let codeBlockResult = (0, exports.parseCodeBlock)(state, options);
        if (codeBlockResult) {
            bodyProgram = codeBlockResult.result;
            state = codeBlockResult.state;
            finalState = state;
        }
        break;
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.forStatement(init, test, update, bodyProgram, start, end);
    return {
        state,
        result
    };
};
exports.parseForStatement = parseForStatement;
const parseForCoditions = (state, options) => {
    let result = {
        init: undefined,
        test: undefined,
        update: undefined
    };
    // parse init statement
    let initStatementResult = (0, exports.parseExpression)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
    if (initStatementResult) {
        state = initStatementResult.state;
        result = Object.assign(Object.assign({}, result), { init: initStatementResult.result });
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
    // everything until ; or ) are errors
    state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Semicolon, CodeTokenType_1.CodeTokenType.ParenClose]) !== undefined);
    // if it's ), then return
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose])) {
        return {
            state,
            result
        };
    }
    // skip ; token
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Semicolon])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
    let testExpressionResult = (0, exports.parseExpression)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
    if (testExpressionResult) {
        result = Object.assign(Object.assign({}, result), { test: testExpressionResult.result });
        state = testExpressionResult.state;
    }
    // parse everything until ; or )
    let testErrorResult = (0, exports.readString)(state, [CodeTokenType_1.CodeTokenType.Semicolon, CodeTokenType_1.CodeTokenType.ParenClose]);
    if (testErrorResult) {
        let errorStart = (0, exports.getCursorPosition)(state);
        state = testErrorResult.state;
        let errorEnd = (0, exports.getCursorPosition)(state);
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "unexpected symbols '" + testErrorResult.result + "'. ; expected", errorStart, errorEnd);
    }
    // if it's ), then return
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose])) {
        return {
            state,
            result
        };
    }
    // skip ; token
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Semicolon])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    // parse update statement
    let updateStatementResult = (0, exports.parseExpression)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
    if (updateStatementResult) {
        state = updateStatementResult.state;
        result = Object.assign(Object.assign({}, result), { update: updateStatementResult.result });
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
    // parse everything until or )
    let updateErrorResult = (0, exports.readString)(state, [CodeTokenType_1.CodeTokenType.ParenClose]);
    if (updateErrorResult) {
        let errorStart = (0, exports.getCursorPosition)(state);
        state = updateErrorResult.state;
        let errorEnd = (0, exports.getCursorPosition)(state);
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "unexpected symbols '" + updateErrorResult.result + "'. ) expected", errorStart, errorEnd);
    }
    return {
        result,
        state
    };
};
exports.parseForCoditions = parseForCoditions;
const parseConditionBlock = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse open paren
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenOpen])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
    // parse expression
    let expressionResult = (0, exports.parseExpression)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
    let expression = undefined;
    if (expressionResult) {
        expression = expressionResult.result;
        state = expressionResult.state;
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
    // parse everything until or )
    let updateErrorResult = (0, exports.readString)(state, [CodeTokenType_1.CodeTokenType.ParenClose]);
    if (updateErrorResult) {
        let errorStart = (0, exports.getCursorPosition)(state);
        state = updateErrorResult.state;
        let errorEnd = (0, exports.getCursorPosition)(state);
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "unexpected symbols '" + updateErrorResult.result + "'. ) expected", errorStart, errorEnd);
    }
    return {
        result: expression,
        state
    };
};
exports.parseConditionBlock = parseConditionBlock;
const parseForInConditions = (state, options) => {
    // parse left expression
    let variable = undefined;
    // parse identifier
    let identifierResult = (0, exports.parseOperandIdentifier)(state, options);
    if (identifierResult) {
        state = identifierResult.state;
        variable = identifierResult.result;
    }
    else {
        // if no identifier, parse variable declaration
        let varDeclarationResult = (0, exports.parseVariableDeclaration)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
        if (varDeclarationResult) {
            state = varDeclarationResult.state;
            variable = varDeclarationResult.result;
        }
        else {
            // if we still don't have variable, mark this as error
            state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, `variable declaration or identifier expected`, (0, exports.getCursorPosition)(state), (0, exports.getCursorPosition)(state));
        }
    }
    // check break tokens
    let breakTokens = [CodeTokenType_1.CodeTokenType.ParenClose];
    let finalState = state;
    let expression = undefined;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
        // check in keyword
        let inResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.In]);
        if (inResult) {
            state = inResult.state;
        }
        else {
            // if there is no in keyword
            return undefined;
        }
        finalState = state;
        state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse right expression
        let exprResult = (0, exports.parseExpression)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
        if (exprResult) {
            state = exprResult.state;
            expression = exprResult.result;
            finalState = state;
        }
        break;
    }
    state = finalState;
    // prepare result
    let result = {
        variable,
        expression
    };
    return {
        result,
        state
    };
};
exports.parseForInConditions = parseForInConditions;
const parseForOfConditions = (state, options) => {
    // parse left expression
    let variable = undefined;
    // parse identifier
    let identifierResult = (0, exports.parseOperandIdentifier)(state, options);
    if (identifierResult) {
        state = identifierResult.state;
        variable = identifierResult.result;
    }
    else {
        // if no identifier, parse variable declaration
        let varDeclarationResult = (0, exports.parseVariableDeclaration)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
        if (varDeclarationResult) {
            state = varDeclarationResult.state;
            variable = varDeclarationResult.result;
        }
        else {
            // if we still don't have variable, mark this as error
            state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, `variable declaration or identifier expected`, (0, exports.getCursorPosition)(state), (0, exports.getCursorPosition)(state));
        }
    }
    // check break tokens
    let breakTokens = [CodeTokenType_1.CodeTokenType.ParenClose];
    let finalState = state;
    let expression = undefined;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
        // check of keyword
        let inResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Of]);
        if (inResult) {
            state = inResult.state;
        }
        else {
            // if there is no of keyword
            return undefined;
        }
        finalState = state;
        state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse right expression
        let exprResult = (0, exports.parseExpression)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
        if (exprResult) {
            state = exprResult.state;
            expression = exprResult.result;
            finalState = state;
        }
        break;
    }
    state = finalState;
    // prepare result
    let result = {
        variable,
        expression
    };
    return {
        result,
        state
    };
};
exports.parseForOfConditions = parseForOfConditions;
const parseForInStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse for (initStatement; in updateStatement) {body}
    let forResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.For]);
    if (!forResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = forResult.state;
    // skip comments and whitespases
    state = (0, exports.skipComments)(state, true, options);
    // parse condition block
    // parse open paren (
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenOpen])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    let finalState = state;
    // prepare break tokens
    let breakTokens = [CodeTokenType_1.CodeTokenType.Semicolon];
    breakTokens = options.isMultiline ? breakTokens : [...breakTokens, CodeTokenType_1.CodeTokenType.Endline];
    // parse for in body
    let variable;
    let expression;
    let bodyProgram;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // parse for conditions
        let conditionsResult = (0, exports.parseForInConditions)(state, options);
        if (conditionsResult) {
            state = conditionsResult.state;
            let condition = conditionsResult.result;
            variable = condition.variable;
            expression = condition.expression;
            finalState = state;
        }
        else {
            return undefined;
        }
        state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
        // parse error tokens everything until )
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose]) !== undefined);
        finalState = state;
        // parse and skip ) token
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose])) {
            state = (0, exports.skipTokens)(state, 1);
            finalState = state;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // now it's time to parse body code block
        // skip everything until code block open token
        let bodyErrorTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen];
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, bodyErrorTokens) !== undefined);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse body code block
        let codeBlockResult = (0, exports.parseCodeBlock)(state, options);
        if (codeBlockResult) {
            bodyProgram = codeBlockResult.result;
            state = codeBlockResult.state;
            finalState = state;
        }
        break;
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.forInStatement(variable, expression, bodyProgram, start, end);
    return {
        state,
        result
    };
};
exports.parseForInStatement = parseForInStatement;
const parseForOfStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse for (initStatement; in updateStatement) {body}
    let forResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.For]);
    if (!forResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = forResult.state;
    // skip comments and whitespases
    state = (0, exports.skipComments)(state, true, options);
    // parse condition block
    // parse open paren (
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenOpen])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    let finalState = state;
    // prepare break tokens
    let breakTokens = [CodeTokenType_1.CodeTokenType.Semicolon];
    breakTokens = options.isMultiline ? breakTokens : [...breakTokens, CodeTokenType_1.CodeTokenType.Endline];
    // parse for of body
    let variable;
    let expression;
    let bodyProgram;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // parse for conditions
        let conditionsResult = (0, exports.parseForOfConditions)(state, options);
        if (conditionsResult) {
            state = conditionsResult.state;
            let condition = conditionsResult.result;
            variable = condition.variable;
            expression = condition.expression;
            finalState = state;
        }
        else {
            return undefined;
        }
        state = (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true }));
        // parse error tokens everything until )
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose]) !== undefined);
        finalState = state;
        // parse and skip ) token
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose])) {
            state = (0, exports.skipTokens)(state, 1);
            finalState = state;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // now it's time to parse body code block
        // skip everything until code block open token
        let bodyErrorTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen];
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, bodyErrorTokens) !== undefined);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse body code block
        let codeBlockResult = (0, exports.parseCodeBlock)(state, options);
        if (codeBlockResult) {
            bodyProgram = codeBlockResult.result;
            state = codeBlockResult.state;
            finalState = state;
        }
        break;
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.forOfStatement(variable, expression, bodyProgram, start, end);
    return {
        state,
        result
    };
};
exports.parseForOfStatement = parseForOfStatement;
const parseImportStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // import [variable] as [alias] from [path]$
    // import in [variable] as [alias] from [path]$
    // parse import
    let keywordResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Import]);
    if (!keywordResult) {
        return undefined;
    }
    state = keywordResult.state;
    state = (0, exports.skipComments)(state, true, options);
    // check if there is a 'in' variable next to the 'import': import in * as varname from "path"
    let isImportInContext = false;
    let inKeywordResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.In]);
    if (inKeywordResult) {
        isImportInContext = true;
        state = inKeywordResult.state;
        state = (0, exports.skipComments)(state, true);
    }
    let variableResult = (0, exports.parseOperandIdentifier)(state, options);
    if (!variableResult) {
        return undefined;
    }
    state = variableResult.state;
    const identifier = variableResult.result;
    // parse from
    state = (0, exports.skipComments)(state, true);
    let importPathAst = undefined;
    let fromResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.From]);
    if (!fromResult) {
        return undefined;
    }
    state = fromResult.state;
    state = (0, exports.skipComments)(state, true, options);
    // parse import path
    let importPathResult = (0, exports.parseImportPath)(state, options);
    if (importPathResult) {
        state = importPathResult.state;
        importPathAst = importPathResult.result;
    }
    else {
        // no import path found
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "Import path expected", (0, exports.getCursorPosition)(state), (0, exports.getCursorPosition)(state));
    }
    // all text from now until endline is invalid
    state = (0, exports.skipComments)(state, true);
    let excessTextStart = (0, exports.getCursorPosition)(state);
    let excessTextResult = (0, exports.readString)(state, [CodeTokenType_1.CodeTokenType.Endline]);
    if (excessTextResult && excessTextResult.result && excessTextResult.result.length > 0) {
        state = excessTextResult.state;
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "only spaces, comments or endline allowed after import path", excessTextStart, (0, exports.getCursorPosition)(state));
    }
    // prepare result
    let result = astFactory_1.astFactory.importStatement(identifier, isImportInContext, importPathAst, start, (0, exports.getCursorPosition)(state));
    // add import statement to the imports registry
    state = Object.assign(Object.assign({}, state), { imports: [...state.imports, result] });
    return {
        result,
        state
    };
};
exports.parseImportStatement = parseImportStatement;
const parseImportPath = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let expressionResult = (0, exports.parseExpression)(state, Object.assign(Object.assign({}, options), { isMultiline: false }));
    if (expressionResult) {
        return expressionResult;
    }
    let stringResult = (0, exports.parseStringLiteral)(state, options);
    if (stringResult) {
        return stringResult;
    }
    let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Prime]), (state) => (0, exports.parseStringLiteralItem)(state, Object.assign(Object.assign({}, options), { isMultiline: true })), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Prime]));
    if (!scopeResult) {
        return undefined;
    }
    // prepare result
    state = scopeResult.state;
    let pathContent = scopeResult.result.content;
    let start = scopeResult.result.start;
    let end = scopeResult.result.end;
    let result = astFactory_1.astFactory.stringLiteral(pathContent, true, start, end);
    return {
        result,
        state
    };
};
exports.parseImportPath = parseImportPath;
const parseRawImportStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    const start = (0, exports.getCursorPosition)(state);
    // parse import
    let keywordResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Import]);
    if (!keywordResult) {
        return undefined;
    }
    state = keywordResult.state;
    state = (0, exports.skipComments)(state, true);
    // parse import item or import items
    let identifier = undefined;
    const importItemResult = (0, exports.parseImportItem)(state, options);
    if (importItemResult) {
        state = importItemResult.state;
        identifier = importItemResult.result;
    }
    else {
        let scopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceOpen]), (state) => (0, exports.parseImportItem)(state, options), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceClose]), (state) => (0, exports.skipComments)(state, true, options));
        if (scopeResult) {
            identifier = scopeResult.result.content;
            state = scopeResult.state;
        }
    }
    // skip comments
    state = (0, exports.skipComments)(state, true, options);
    // parse from
    const fromResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.From]);
    if (fromResult) {
        state = fromResult.state;
    }
    else {
        const errorPos = (0, exports.getCursorPosition)(state);
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "Expected 'from' keyword", errorPos, errorPos);
    }
    // skip comments
    state = (0, exports.skipComments)(state, true, options);
    // parse path
    let path = undefined;
    const pathResult = (0, exports.parseImportPath)(state, options);
    if (pathResult) {
        state = pathResult.state;
        path = pathResult.result;
    }
    // done
    const end = (0, exports.getCursorPosition)(state);
    const result = astFactory_1.astFactory.rawImportStatement(identifier, path, start, end);
    return {
        state,
        result
    };
};
exports.parseRawImportStatement = parseRawImportStatement;
const parseImportItem = (state, options) => {
    var _a, _b;
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    const start = (0, exports.getCursorPosition)(state);
    // parse identifier
    let identifier = undefined;
    const identifierResult = (0, exports.parseIdentifier)(state, options);
    if (identifierResult) {
        state = identifierResult.state;
        identifier = identifierResult.result;
    }
    else {
        // try to parse it as raw identifier
        const rawIdentResult = (0, exports.parseRawIdentifier)(state, options);
        if (rawIdentResult) {
            state = rawIdentResult.state;
            identifier = (_a = rawIdentResult.result) === null || _a === void 0 ? void 0 : _a.value;
        }
        else {
            // not an identifier
            // if there is no identifier, parse star
            if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Star])) {
                return undefined;
            }
            const starStart = (0, exports.getCursorPosition)(state);
            state = (0, exports.skipTokens)(state, 1);
            const starEnd = (0, exports.getCursorPosition)(state);
            identifier = astFactory_1.astFactory.identifier('*', true, starStart, starEnd);
        }
    }
    // we always parse it as raw identifier
    identifier = astFactory_1.astFactory.rawIndentifier(identifier, identifier === null || identifier === void 0 ? void 0 : identifier.start, identifier === null || identifier === void 0 ? void 0 : identifier.end);
    state = (0, exports.skipComments)(state, true, options);
    // parse alias
    let alias = undefined;
    const asResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.As]);
    if (asResult) {
        state = asResult.state;
        // skip comments
        state = (0, exports.skipComments)(state, true, options);
        // parse alias
        const aliasResult = (0, exports.parseIdentifier)(state, options);
        if (aliasResult) {
            alias = aliasResult.result;
            state = aliasResult.state;
        }
        else {
            // try to parse raw identifier
            const rawIdentifierResult = (0, exports.parseRawIdentifier)(state, options);
            if (rawIdentifierResult) {
                alias = (_b = rawIdentifierResult.result) === null || _b === void 0 ? void 0 : _b.value;
            }
        }
        // we always parse the alias as raw identifier
        if (alias) {
            alias = astFactory_1.astFactory.rawIndentifier(alias, alias === null || alias === void 0 ? void 0 : alias.start, alias === null || alias === void 0 ? void 0 : alias.end);
        }
    }
    // done
    const end = (0, exports.getCursorPosition)(state);
    const result = astFactory_1.astFactory.importItem(identifier, alias, start, end);
    return {
        state,
        result
    };
};
exports.parseImportItem = parseImportItem;
const parseTryStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse try
    let tryResult = (0, exports.parseKeywordOfType)(state, Object.assign(Object.assign({}, options), { isMultiline: true }), [KeywordType_1.KeywordType.Try]);
    if (!tryResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = tryResult.state;
    let finalState = state;
    let body = undefined;
    let catchClause = undefined;
    let finallyBlock = undefined;
    let breakTokens = options.isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, options);
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse code block
        let codeBlockResult = (0, exports.parseCodeBlock)(state, options);
        if (codeBlockResult) {
            state = codeBlockResult.state;
            body = codeBlockResult.result;
            finalState = state;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) && (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse catch
        let catchResult = (0, exports.parseCatchStatement)(state, options);
        if (catchResult) {
            state = catchResult.state;
            catchClause = catchResult.result;
            finalState = state;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) && (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse finally
        let finallyResult = (0, exports.parseFinallyStatement)(state, options);
        if (finallyResult) {
            state = finallyResult.state;
            finallyBlock = finallyResult.result;
            finalState = state;
        }
        break;
    }
    state = finalState;
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.tryStatement(body, catchClause, finallyBlock, start, end);
    return {
        state,
        result
    };
};
exports.parseTryStatement = parseTryStatement;
const parseCatchStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // catch (varDeclaration) {body}
    // parse catch keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, Object.assign(Object.assign({}, options), { isMultiline: true }), [KeywordType_1.KeywordType.Catch]);
    if (!keywordResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = keywordResult.state;
    let finalState = state;
    let body = undefined;
    let varDeclaration = undefined;
    let breakTokens = options.isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, options);
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse (identifier)
        let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseOperandIdentifier)(state, Object.assign(Object.assign({}, options), { isMultiline: true })), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true })));
        if (scopeResult) {
            // extract first item from parsed scope to 
            let scopeContent = scopeResult.result.content;
            if (scopeContent && scopeContent.length > 0) {
                varDeclaration = scopeContent[0];
            }
            state = scopeResult.state;
            finalState = state;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse body
        let bodyResult = (0, exports.parseCodeBlock)(state, options);
        if (bodyResult) {
            state = bodyResult.state;
            finalState = bodyResult.state;
            body = bodyResult.result;
        }
        break;
    }
    state = finalState;
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.catchStatement(body, varDeclaration, start, end);
    return {
        state,
        result
    };
};
exports.parseCatchStatement = parseCatchStatement;
const parseFinallyStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // finally {body}
    // parse finally keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Finally]);
    if (!keywordResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = keywordResult.state;
    let finalState = state;
    let body = undefined;
    let breakTokens = options.isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, options);
    // check break tokens
    if (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse body
        let bodyResult = (0, exports.parseCodeBlock)(state, options);
        if (bodyResult) {
            state = bodyResult.state;
            finalState = bodyResult.state;
            body = bodyResult.result;
        }
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.finallyStatement(body, start, end);
    return {
        state,
        result
    };
};
exports.parseFinallyStatement = parseFinallyStatement;
const parseThrowStatement = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse throw keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, Object.assign(Object.assign({}, options), { isMultiline: true }), [KeywordType_1.KeywordType.Throw]);
    if (!keywordResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = keywordResult.state;
    let finalState = state;
    let breakTokens = options.isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    let expression = undefined;
    // parse expression
    if (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // parse expression
        let expressionResult = (0, exports.parseExpression)(state, options);
        if (expressionResult) {
            state = expressionResult.state;
            expression = expressionResult.result;
            finalState = state;
        }
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.throwStatement(expression, start, end);
    return {
        result,
        state
    };
};
exports.parseThrowStatement = parseThrowStatement;
const parseOperator = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    let sequence;
    let operatorType;
    // SpreadAssign = "SpreadAssign",
    sequence = [CodeTokenType_1.CodeTokenType.Dot, CodeTokenType_1.CodeTokenType.Dot, CodeTokenType_1.CodeTokenType.Dot];
    operatorType = OperatorType_1.OperatorType.SpreadAssign;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `...`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // PercentEquals = "PercentEquals",
    sequence = [CodeTokenType_1.CodeTokenType.Percent, CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.PercentEquals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `%=`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // Percent = "Percent",
    sequence = [CodeTokenType_1.CodeTokenType.Percent];
    operatorType = OperatorType_1.OperatorType.Percent;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `%`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // PlusEquals = "PlusEquals",
    sequence = [CodeTokenType_1.CodeTokenType.Plus, CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.PlusEquals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `+=`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // MinusEquals = "MinusEquals",
    sequence = [CodeTokenType_1.CodeTokenType.Minus, CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.MinusEquals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `-=`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // MultiplyEquals = "MultiplyEquals",
    sequence = [CodeTokenType_1.CodeTokenType.Star, CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.MultiplyEquals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `*=`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // DivideEquals = "DivideEquals",
    sequence = [CodeTokenType_1.CodeTokenType.Slash, CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.DivideEquals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `/=`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // MoreMoreMore = "MoreMoreMore",
    sequence = [CodeTokenType_1.CodeTokenType.TupleClose, CodeTokenType_1.CodeTokenType.TupleClose, CodeTokenType_1.CodeTokenType.TupleClose];
    operatorType = OperatorType_1.OperatorType.MoreMoreMore;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `>>>`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // MoreMore = "MoreMore",
    sequence = [CodeTokenType_1.CodeTokenType.TupleClose, CodeTokenType_1.CodeTokenType.TupleClose];
    operatorType = OperatorType_1.OperatorType.MoreMore;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `>>`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // LessLess = "LessLess",
    sequence = [CodeTokenType_1.CodeTokenType.TupleOpen, CodeTokenType_1.CodeTokenType.TupleOpen];
    operatorType = OperatorType_1.OperatorType.LessLess;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `<<`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // QuestionQuestion = "QuestionQuestion",
    sequence = [CodeTokenType_1.CodeTokenType.Question, CodeTokenType_1.CodeTokenType.Question];
    operatorType = OperatorType_1.OperatorType.QuestionQuestion;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `??`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // PlusPlus = "PlusPlus",
    sequence = [CodeTokenType_1.CodeTokenType.Plus, CodeTokenType_1.CodeTokenType.Plus];
    operatorType = OperatorType_1.OperatorType.PlusPlus;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `++`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // Plus = "Plus",
    sequence = [CodeTokenType_1.CodeTokenType.Plus];
    operatorType = OperatorType_1.OperatorType.Plus;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `+`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // MinusMinus = "MinusMinus",
    sequence = [CodeTokenType_1.CodeTokenType.Minus, CodeTokenType_1.CodeTokenType.Minus];
    operatorType = OperatorType_1.OperatorType.MinusMinus;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `--`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // Minus = "Minus",
    sequence = [CodeTokenType_1.CodeTokenType.Minus];
    operatorType = OperatorType_1.OperatorType.Minus;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `-`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // Multiply = "Multiply",
    sequence = [CodeTokenType_1.CodeTokenType.Star];
    operatorType = OperatorType_1.OperatorType.Multiply;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `*`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // Divide = "Divide",
    sequence = [CodeTokenType_1.CodeTokenType.Slash];
    operatorType = OperatorType_1.OperatorType.Divide;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `/`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // GreaterOrEquals = "GreaterOrEquals",
    sequence = [CodeTokenType_1.CodeTokenType.TupleClose, CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.GreaterOrEquals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `>=`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // LessOrEquals = "LessOrEquals",
    sequence = [CodeTokenType_1.CodeTokenType.TupleOpen, CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.LessOrEquals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `<=`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // Greater = "Greater",
    sequence = [CodeTokenType_1.CodeTokenType.TupleClose];
    operatorType = OperatorType_1.OperatorType.Greater;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `>`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // Less = "Less",
    sequence = [CodeTokenType_1.CodeTokenType.TupleOpen];
    operatorType = OperatorType_1.OperatorType.Less;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `<`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // NotEqualsEquals = "NotEqualsEquals",
    sequence = [CodeTokenType_1.CodeTokenType.NotSign, CodeTokenType_1.CodeTokenType.Equals, CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.NotEqualsEquals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `!==`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // NotEquals = "NotEquals",
    sequence = [CodeTokenType_1.CodeTokenType.NotSign, CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.NotEquals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `!=`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // Not = "Not",
    sequence = [CodeTokenType_1.CodeTokenType.NotSign];
    operatorType = OperatorType_1.OperatorType.Not;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `!`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // TripleEquals = "TripleEquals",
    sequence = [CodeTokenType_1.CodeTokenType.Equals, CodeTokenType_1.CodeTokenType.Equals, CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.TripleEquals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `===`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // DoubleEquals = "DoubleEquals",
    sequence = [CodeTokenType_1.CodeTokenType.Equals, CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.DoubleEquals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `==`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // Equals = "Equals",
    sequence = [CodeTokenType_1.CodeTokenType.Equals];
    operatorType = OperatorType_1.OperatorType.Equals;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `=`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // OrOr = "OrOr",
    sequence = [CodeTokenType_1.CodeTokenType.OrSign, CodeTokenType_1.CodeTokenType.OrSign];
    operatorType = OperatorType_1.OperatorType.OrOr;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `||`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // AndAnd = "AndAnd",
    sequence = [CodeTokenType_1.CodeTokenType.Ampersand, CodeTokenType_1.CodeTokenType.Ampersand];
    operatorType = OperatorType_1.OperatorType.AndAnd;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `&&`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // SingleAnd = "SingleAnd",
    sequence = [CodeTokenType_1.CodeTokenType.Ampersand];
    operatorType = OperatorType_1.OperatorType.SingleAnd;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `&`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    // SingleOr = "SingleOr",
    sequence = [CodeTokenType_1.CodeTokenType.OrSign];
    operatorType = OperatorType_1.OperatorType.SingleOr;
    if ((0, exports.checkTokenSequence)(state, sequence)) {
        state = (0, exports.skipTokens)(state, sequence.length);
        let end = (0, exports.getCursorPosition)(state);
        let opText = `|`;
        let result = astFactory_1.astFactory.operator(operatorType, opText, start, end);
        return {
            state,
            result
        };
    }
    return undefined;
};
exports.parseOperator = parseOperator;
const parseOperatorOfType = (state, options, operatorTypes) => {
    if ((0, exports.isEndOfFile)(state) || !operatorTypes) {
        return undefined;
    }
    let operatorResult = (0, exports.parseOperator)(state, options);
    if (!operatorResult) {
        return undefined;
    }
    let operator = operatorResult.result;
    for (let i = 0; i < operatorTypes.length; i++) {
        const operatorType = operatorTypes[i];
        if (operator.operatorType === operatorType) {
            return operatorResult;
        }
    }
    return undefined;
};
exports.parseOperatorOfType = parseOperatorOfType;
const parseBinaryOperator = (state, options) => {
    return (0, exports.parseOperatorOfType)(state, options, [
        OperatorType_1.OperatorType.PercentEquals,
        OperatorType_1.OperatorType.Percent,
        OperatorType_1.OperatorType.GreaterOrEquals,
        OperatorType_1.OperatorType.Greater,
        OperatorType_1.OperatorType.LessOrEquals,
        OperatorType_1.OperatorType.LessLess,
        OperatorType_1.OperatorType.Less,
        OperatorType_1.OperatorType.PlusEquals,
        OperatorType_1.OperatorType.MinusEquals,
        OperatorType_1.OperatorType.MultiplyEquals,
        OperatorType_1.OperatorType.DivideEquals,
        OperatorType_1.OperatorType.QuestionQuestion,
        OperatorType_1.OperatorType.MoreMoreMore,
        OperatorType_1.OperatorType.MoreMore,
        OperatorType_1.OperatorType.QuestionQuestion,
        OperatorType_1.OperatorType.Minus,
        OperatorType_1.OperatorType.Multiply,
        OperatorType_1.OperatorType.NotEqualsEquals,
        OperatorType_1.OperatorType.NotEquals,
        OperatorType_1.OperatorType.Plus,
        OperatorType_1.OperatorType.Divide,
        OperatorType_1.OperatorType.TripleEquals,
        OperatorType_1.OperatorType.DoubleEquals,
        OperatorType_1.OperatorType.Equals,
        OperatorType_1.OperatorType.OrOr,
        OperatorType_1.OperatorType.AndAnd,
        OperatorType_1.OperatorType.SingleAnd,
        OperatorType_1.OperatorType.SingleOr
    ]);
};
exports.parseBinaryOperator = parseBinaryOperator;
const parseUnaryOperatorPrefix = (state, options) => {
    return (0, exports.parseOperatorOfType)(state, options, [
        OperatorType_1.OperatorType.SpreadAssign,
        OperatorType_1.OperatorType.PlusPlus,
        OperatorType_1.OperatorType.MinusMinus,
        OperatorType_1.OperatorType.Not,
        OperatorType_1.OperatorType.Minus
    ]);
};
exports.parseUnaryOperatorPrefix = parseUnaryOperatorPrefix;
const parseUnaryOperatorPostfix = (state, options) => {
    return (0, exports.parseOperatorOfType)(state, options, [
        OperatorType_1.OperatorType.PlusPlus,
        OperatorType_1.OperatorType.MinusMinus
    ]);
};
exports.parseUnaryOperatorPostfix = parseUnaryOperatorPostfix;
const parseKeyword = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // keyword is a word only
    let nextToken = (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Word]);
    if (!nextToken) {
        return undefined;
    }
    // check all possible keywords
    for (const keywordId in KeywordType_1.KeywordType) {
        let keyword = KeywordType_1.KeywordType[keywordId];
        if (nextToken.value === keyword) {
            let start = (0, exports.getCursorPosition)(state);
            state = (0, exports.skipTokens)(state, 1);
            let end = (0, exports.getCursorPosition)(state);
            let keywordType = keyword;
            let result = astFactory_1.astFactory.keyword(keywordType, start, end);
            return {
                result,
                state
            };
        }
    }
    return undefined;
};
exports.parseKeyword = parseKeyword;
const parseDebuggerKeyword = (state, options) => {
    let keywordResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Debugger]);
    if (!keywordResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = keywordResult.state;
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.debuggerKeyword(KeywordType_1.KeywordType.Debugger, start, end);
    return {
        result,
        state
    };
};
exports.parseDebuggerKeyword = parseDebuggerKeyword;
const parseKeywordOfType = (state, options, keywordTypes) => {
    let keywordResult = (0, exports.parseKeyword)(state, options);
    if (!keywordResult || !keywordResult.result) {
        return undefined;
    }
    for (let i = 0; i < keywordTypes.length; i++) {
        const keywordType = keywordTypes[i];
        if (keywordResult.result.keywordType === keywordType) {
            return keywordResult;
        }
    }
    return undefined;
};
exports.parseKeywordOfType = parseKeywordOfType;
const parseCommentLine = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // parse start captures
    if (!(0, exports.checkTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Slash, CodeTokenType_1.CodeTokenType.Slash])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 2);
    // parse comment text
    let commentText = "";
    let commentTextResult = (0, exports.readString)(state, [CodeTokenType_1.CodeTokenType.Endline]);
    if (commentTextResult) {
        commentText = commentTextResult.result || "";
        state = commentTextResult.state;
    }
    let end = (0, exports.getCursorPosition)(state);
    // prepare result
    let result = astFactory_1.astFactory.commentLine(commentText, start, end);
    return {
        result,
        state
    };
};
exports.parseCommentLine = parseCommentLine;
const parseCommentBlock = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // parse start captures
    if (!(0, exports.checkTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Slash, CodeTokenType_1.CodeTokenType.Star])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 2);
    // parse comment text
    let commentText = "";
    while (true) {
        let commentTextResult = (0, exports.readString)(state, [CodeTokenType_1.CodeTokenType.Star]);
        if (commentTextResult) {
            commentText = commentTextResult.result || "";
            state = commentTextResult.state;
        }
        // check end of comment block
        if ((0, exports.checkTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Star, CodeTokenType_1.CodeTokenType.Slash])) {
            state = (0, exports.skipTokens)(state, 2);
            break;
        }
        // if this is not the end of comment block, add current token to comment text and continue reading
        let nextToken = (0, exports.getToken)(state);
        if (nextToken) {
            commentText = commentText + nextToken.value || "";
            state = (0, exports.skipTokens)(state, 1);
            continue;
        }
        // if we here, that means we're at the end of file
        break;
    }
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.commentBlock(commentText, start, end);
    return {
        result,
        state
    };
};
exports.parseCommentBlock = parseCommentBlock;
const parseRawCodeBlock = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse @
    const atResult = (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.AtSign]);
    if (!atResult) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    const codeBlockResult = (0, exports.parseCodeBlock)(state, Object.assign(Object.assign({}, options), { isMultiline: true, allowContextIdentifiers: false }));
    if (codeBlockResult) {
        return codeBlockResult;
    }
    return undefined;
};
exports.parseRawCodeBlock = parseRawCodeBlock;
const parseRegularCodeBlock = (state, options) => {
    var _a, _b, _c;
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    const scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceOpen]), (state) => (0, exports.parseStatement)(state, Object.assign(Object.assign({}, options), { isMultiline: true })), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceClose]), (state) => (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true })), undefined, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Semicolon]));
    if (!scopeResult) {
        return undefined;
    }
    state = scopeResult.state;
    const content = ((_a = scopeResult.result) === null || _a === void 0 ? void 0 : _a.content) || [];
    return {
        state,
        result: astFactory_1.astFactory.blockStatement(content, (_b = scopeResult.result) === null || _b === void 0 ? void 0 : _b.start, (_c = scopeResult.result) === null || _c === void 0 ? void 0 : _c.end)
    };
};
exports.parseRegularCodeBlock = parseRegularCodeBlock;
const parseCodeBlock = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    const rawCodeBlock = (0, exports.parseRawCodeBlock)(state, options);
    if (rawCodeBlock) {
        return rawCodeBlock;
    }
    const regularCodeBlock = (0, exports.parseRegularCodeBlock)(state, options);
    if (regularCodeBlock) {
        return regularCodeBlock;
    }
    return undefined;
};
exports.parseCodeBlock = parseCodeBlock;
const parseFunctionParameters = (state, options) => {
    var _a, _b;
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse function params scope
    let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseAnyIdentifier)(state, Object.assign(Object.assign({}, options), { isMultiline: true })), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true })), undefined, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Comma]));
    if (!scopeResult) {
        return undefined;
    }
    // extract function arguments
    state = scopeResult.state;
    const result = (_b = (_a = scopeResult.result) === null || _a === void 0 ? void 0 : _a.content) !== null && _b !== void 0 ? _b : [];
    return {
        state,
        result
    };
};
exports.parseFunctionParameters = parseFunctionParameters;
const parseObjectLineTags = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    const brakeTokens = options.isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    const result = [];
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, brakeTokens)) {
        let tagResult = (0, exports.parseTag)(state, options);
        if (!tagResult) {
            break;
        }
        if (tagResult.result) {
            result.push(tagResult.result);
        }
        state = (0, exports.skipComments)(state, true, options);
    }
    return {
        state,
        result
    };
};
exports.parseObjectLineTags = parseObjectLineTags;
// literals
const parseLiteral = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    return (0, exports.parseNode)(state, options, [
        exports.parseFunction,
        exports.parseNumberLiteral,
        exports.parseBooleanLiteral,
        exports.parseStringLiteral,
        (state, options) => (0, exports.parseArrayLiteral)(state, options, false),
        exports.parseObject,
        exports.parseRegexLiteral
    ]);
};
exports.parseLiteral = parseLiteral;
const parseNumberLiteral = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    let word = (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Word]);
    if (!word) {
        return undefined;
    }
    // parse first digit
    let firstDigit = Number(word.value);
    if (isNaN(firstDigit)) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    let stringResult = '' + firstDigit;
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Dot])) {
        let substate = (0, exports.skipTokens)(state, 1);
        // try parse next digit
        let nextToken = (0, exports.getTokenOfType)(substate, [CodeTokenType_1.CodeTokenType.Word]);
        if (nextToken) {
            let nextDigit = Number(nextToken.value);
            if (!isNaN(nextDigit)) {
                stringResult += '.' + nextDigit;
                state = (0, exports.skipTokens)(substate, 1);
            }
        }
    }
    let result = Number(stringResult);
    if (!isNaN(result)) {
        let end = (0, exports.getCursorPosition)(state);
        return {
            state,
            result: astFactory_1.astFactory.numberLiteral(result, start, end)
        };
    }
    return undefined;
};
exports.parseNumberLiteral = parseNumberLiteral;
const parseStringLiteral = (state, options, allowIncludes = true) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Quote])) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // skip open mark
    state = (0, exports.skipTokens)(state, 1);
    // read content until close mark
    let content = [];
    while (true) {
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Quote])) {
            break;
        }
        // parse array item
        let stringItem = (0, exports.parseStringLiteralItem)(state, Object.assign(Object.assign({}, options), { isMultiline: false }), allowIncludes);
        if (stringItem) {
            state = stringItem.state;
            content.push(stringItem.result);
        }
        continue;
    }
    // close mark
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Quote])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    else {
        // no close mark
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "Unexpected token " + ((0, exports.getToken)(state) ? ((0, exports.getToken)(state).value || (0, exports.getToken)(state).type) : "ENDFILE") + ". \" expected", (0, exports.getCursorPosition)(state), (0, exports.getCursorPosition)(state));
    }
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.stringLiteral(content, allowIncludes, start, end);
    return {
        result,
        state
    };
};
exports.parseStringLiteral = parseStringLiteral;
const parseStringLiteralItem = (state, options, allowIncludes = true) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse include
    if (allowIncludes) {
        let stringIncludeResult = (0, exports.parseStringInclude)(state, options);
        if (stringIncludeResult) {
            return stringIncludeResult;
        }
    }
    // parse word
    let nextToken = (0, exports.getToken)(state);
    // check escaped char
    if (nextToken.type === CodeTokenType_1.CodeTokenType.Backslash) {
        // escaped char
        state = (0, exports.skipTokens)(state, 1);
        // parse both tokens as one token sequence
        let wordToken = (0, exports.getToken)(state);
        state = (0, exports.skipTokens)(state, 1);
        let tokenSeq = astFactory_1.astFactory.tokenSequence([nextToken, wordToken], nextToken.start, wordToken.end);
        return {
            result: tokenSeq,
            state
        };
    }
    if (nextToken.type == CodeTokenType_1.CodeTokenType.Prime && !allowIncludes) {
        state = (0, exports.skipTokens)(state, 1);
        // add backslash before tilde
        let backslashToken = Object.assign(Object.assign({}, nextToken), { type: CodeTokenType_1.CodeTokenType.Backslash, value: "\\" });
        let tokenSeq = astFactory_1.astFactory.tokenSequence([backslashToken, nextToken], nextToken.start, nextToken.end);
        return {
            result: tokenSeq,
            state
        };
    }
    // parse any other
    let tokenResult = (0, exports.parseToken)(state);
    if (tokenResult) {
        return tokenResult;
    }
    return undefined;
};
exports.parseStringLiteralItem = parseStringLiteralItem;
const parseStringInclude = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse star
    if (!(0, exports.checkTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Star])) {
        return undefined;
    }
    // start and space is not an include
    if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Space, CodeTokenType_1.CodeTokenType.Endline])) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = (0, exports.skipTokens)(state, 1);
    // *[space|comment|endline|endfile] is not an include
    // skip comments and whitespace
    let nextState = (0, exports.skipComments)(state, true, exports.emptyOptions);
    if (nextState && nextState.cursor > state.cursor) {
        return undefined;
    }
    // parse expression
    let expression = undefined;
    let expressionResult = (0, exports.parseExpression)(state, Object.assign(Object.assign({}, options), { isMultiline: false }));
    if (expressionResult) {
        expression = expressionResult.result;
        state = expressionResult.state;
    }
    // skip comments
    state = (0, exports.skipComments)(state, true, exports.emptyOptions);
    // check for semicolon
    state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endline, CodeTokenType_1.CodeTokenType.Semicolon]) !== undefined);
    // skip ; if any
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Semicolon])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.stringIncludeStatement(expression, start, end);
    return {
        state,
        result
    };
};
exports.parseStringInclude = parseStringInclude;
const parseBooleanLiteral = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let nextToken = (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Word]);
    if (!nextToken) {
        return undefined;
    }
    if (nextToken.value === "true" || nextToken.value === "false") {
        let boolValue = nextToken.value === "true";
        let start = (0, exports.getCursorPosition)(state);
        state = (0, exports.skipTokens)(state, 1);
        let end = (0, exports.getCursorPosition)(state);
        let result = astFactory_1.astFactory.booleanLiteral(boolValue, start, end);
        return {
            state,
            result
        };
    }
    return undefined;
};
exports.parseBooleanLiteral = parseBooleanLiteral;
const parseRegexLiteral = (state, options) => {
    var _a, _b, _c, _d;
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse start token '/'
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Slash])) {
        return undefined;
    }
    const start = (0, exports.getCursorPosition)(state);
    const firstTokenResult = (0, exports.parseToken)(state);
    if (!firstTokenResult) {
        return undefined;
    }
    state = firstTokenResult.state;
    const values = [(_b = (_a = firstTokenResult.result) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.value];
    let escapeSymbol = false;
    let isEndOfRegex = false;
    let end = (0, exports.getCursorPosition)(state);
    // parse all the next tokens until braking 
    while (!(0, exports.isEndOfFile)(state) && !isEndOfRegex) {
        let nextToken = (0, exports.getToken)(state);
        if (!nextToken) {
            continue;
        }
        // check the end of regex line
        if (nextToken.type == CodeTokenType_1.CodeTokenType.Slash) {
            if (!escapeSymbol) {
                // end of regex line
                isEndOfRegex = true;
            }
        }
        if (nextToken.type == CodeTokenType_1.CodeTokenType.Endline) {
            // we don't have / symbol before endline, so this is not a regex line
            return undefined;
        }
        // check escape symbol
        if (nextToken.type == CodeTokenType_1.CodeTokenType.Backslash) {
            escapeSymbol = !escapeSymbol;
        }
        // if it's not an escaped ( symbol, we need to add the entire string until ) to regex
        if (nextToken.type == CodeTokenType_1.CodeTokenType.ParenOpen && !escapeSymbol) {
            let regexParenScopeResult = (0, exports.parseRegexParenScope)(state, options);
            if (regexParenScopeResult) {
                state = regexParenScopeResult.state;
                values.push((_c = regexParenScopeResult.result) === null || _c === void 0 ? void 0 : _c.value);
                nextToken = (_d = regexParenScopeResult.result) === null || _d === void 0 ? void 0 : _d.nextToken;
                continue;
            }
        }
        else {
            // add token to result values
            values.push(nextToken.value);
            end = nextToken.end;
        }
        if (nextToken.type != CodeTokenType_1.CodeTokenType.Backslash) {
            escapeSymbol = false;
        }
        state = (0, exports.skipTokens)(state, 1);
    }
    // now parse the regex flags (if any)
    let flagsToken = (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Word]);
    if (flagsToken) {
        // now this word must contain gimusy letters only
        let wordValue = flagsToken.value || "";
        if (!wordValue.match(/^[gimusy]+$/)) {
            return undefined;
        }
        // if we here, that means we have a correct flags
        values.push(wordValue);
        end = flagsToken.end;
        state = (0, exports.skipTokens)(state, 1);
    }
    const regexValue = values.join('');
    const result = astFactory_1.astFactory.regexLiteral(regexValue, start, end);
    return {
        state,
        result
    };
};
exports.parseRegexLiteral = parseRegexLiteral;
const parseRegexParenScope = (state, options) => {
    var _a, _b, _c;
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse first symbol (
    const firstToken = (0, exports.getToken)(state);
    if (!firstToken || firstToken.type !== CodeTokenType_1.CodeTokenType.ParenOpen) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    // now parse everything until ) token. Parse all nested paren scopes
    const values = [firstToken.value];
    let escapeSymbol = false;
    let isEndOfScope = false;
    let end = (0, exports.getCursorPosition)(state);
    let nextToken = firstToken;
    // parse all the next tokens until braking 
    while (!(0, exports.isEndOfFile)(state) && !isEndOfScope) {
        nextToken = (0, exports.getToken)(state);
        if (!nextToken) {
            continue;
        }
        // check the end of regex paren scope
        if (nextToken.type == CodeTokenType_1.CodeTokenType.ParenClose) {
            if (!escapeSymbol) {
                // end of regex scope
                isEndOfScope = true;
            }
        }
        // check escape symbol
        if (nextToken.type == CodeTokenType_1.CodeTokenType.Backslash) {
            escapeSymbol = !escapeSymbol;
        }
        // if it's not an escaped ( symbol, we need to add the entire string until ) to regex
        if (nextToken.type == CodeTokenType_1.CodeTokenType.ParenOpen && !escapeSymbol) {
            let regexParenScopeResult = (0, exports.parseRegexParenScope)(state, options);
            if (regexParenScopeResult) {
                state = regexParenScopeResult.state;
                values.push((_a = regexParenScopeResult.result) === null || _a === void 0 ? void 0 : _a.value);
                end = ((_c = (_b = regexParenScopeResult.result) === null || _b === void 0 ? void 0 : _b.nextToken) === null || _c === void 0 ? void 0 : _c.end) || end;
                continue;
            }
        }
        else {
            // add token to result values
            values.push(nextToken.value);
            end = nextToken.end;
        }
        if (nextToken.type != CodeTokenType_1.CodeTokenType.Backslash) {
            escapeSymbol = false;
        }
        state = (0, exports.skipTokens)(state, 1);
    }
    let scopeValue = values.join('');
    return {
        state,
        result: {
            value: scopeValue,
            nextToken
        }
    };
};
exports.parseRegexParenScope = parseRegexParenScope;
const parseArrayLiteral = (state, options, allowEmptyItems) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse array scope
    let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BracketOpen]), (state) => (0, exports.parseArrayElement)(state, Object.assign(Object.assign({}, options), { isMultiline: true }), allowEmptyItems), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BracketClose]), (state) => (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true })), undefined, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Comma]));
    if (!scopeResult) {
        return undefined;
    }
    // prepare result
    state = scopeResult.state;
    let scope = scopeResult.result;
    let arrayContent = scope.content;
    let start = scope.start;
    let end = scope.end;
    let result = astFactory_1.astFactory.arrayLiteral(arrayContent, start, end);
    return {
        state,
        result
    };
};
exports.parseArrayLiteral = parseArrayLiteral;
const parseArrayElement = (state, options, allowEmptyItems) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let expressionResult = (0, exports.parseExpression)(state, options);
    if (expressionResult) {
        return expressionResult;
    }
    // check for empty array element
    if (allowEmptyItems) {
        // check for coma
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Comma])) {
            let emptyToken = {
                start: (0, exports.getCursorPosition)(state),
                end: (0, exports.getCursorPosition)(state),
                type: CodeTokenType_1.CodeTokenType.Word,
                value: '',
                length: 0
            };
            return {
                state,
                result: astFactory_1.astFactory.token(emptyToken, emptyToken.start)
            };
        }
    }
    return undefined;
};
exports.parseArrayElement = parseArrayElement;
const parseObject = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse array scope
    let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceOpen]), (state) => (0, exports.parseObjectLiteralItem)(state, Object.assign(Object.assign({}, options), { isMultiline: true })), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceClose]), (state) => (0, exports.skipComments)(state, true, Object.assign(Object.assign({}, options), { isMultiline: true })), undefined, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Comma]));
    if (!scopeResult) {
        return undefined;
    }
    // prepare result
    state = scopeResult.state;
    let scope = scopeResult.result;
    let arrayContent = scope.content;
    let start = scope.start;
    let end = scope.end;
    let result = astFactory_1.astFactory.objectLiteral(arrayContent, start, end);
    return {
        state,
        result
    };
};
exports.parseObject = parseObject;
const parseObjectLiteralItem = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    return (0, exports.parseNode)(state, options, [
        exports.parseGetterSetter,
        exports.parseFunction,
        exports.parseObjectProperty,
        exports.parseExpression
    ]);
};
exports.parseObjectLiteralItem = parseObjectLiteralItem;
const parseObjectProperty = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    const start = (0, exports.getCursorPosition)(state);
    // parse identifier
    let identifier = undefined;
    let literalIdentResult = (0, exports.parseStringLiteral)(state, Object.assign(Object.assign({}, options), { isMultiline: false }), false);
    if (literalIdentResult) {
        state = literalIdentResult.state;
        identifier = literalIdentResult.result;
    }
    else {
        let identifierResult = (0, exports.parseAnyIdentifier)(state, options);
        if (identifierResult) {
            state = identifierResult.state;
            identifier = identifierResult.result;
        }
        else {
            let arrayResult = (0, exports.parseArrayLiteral)(state, options, false);
            if (arrayResult != null) {
                state = arrayResult.state;
                identifier = arrayResult.result;
            }
        }
    }
    if (!identifier) {
        return undefined;
    }
    const end = identifier === null || identifier === void 0 ? void 0 : identifier.end;
    state = (0, exports.skipComments)(state, true, options);
    let value;
    let initializer;
    // parse =
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Equals])) {
        state = (0, exports.skipTokens)(state, 1);
        state = (0, exports.skipComments)(state, true, options);
        // parse value
        let valueResult = (0, exports.parseExpression)(state, options);
        if (valueResult) {
            state = valueResult.state;
            initializer = valueResult.result;
        }
    }
    // parse colon
    else if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Colon])) {
        state = (0, exports.skipTokens)(state, 1);
        state = (0, exports.skipComments)(state, true, options);
        // parse value
        let valueResult = (0, exports.parseExpression)(state, options);
        if (valueResult) {
            state = valueResult.state;
            value = valueResult.result;
        }
    }
    let result = astFactory_1.astFactory.propertyDeclaration(identifier, value, initializer, start, end);
    return {
        state,
        result
    };
};
exports.parseObjectProperty = parseObjectProperty;
const parseFunction = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // [async] function ([args]) {[operations]}
    // or
    // [async] ([args]) => {[operations]}
    // save start point
    const start = (0, exports.getCursorPosition)(state);
    // parse async
    let isAsync = false;
    const asyncResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Async]);
    if (asyncResult) {
        state = asyncResult.state;
        isAsync = true;
    }
    state = (0, exports.skipComments)(state, true, options);
    // skip comments and whitespaces
    // parse keyword
    const keywordResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Function]);
    if (keywordResult) {
        state = keywordResult.state;
    }
    let isGenerator = false;
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Star])) {
        isGenerator = true;
        state = (0, exports.skipTokens)(state, 1);
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, options);
    // parse function name
    let name;
    const nameResult = (0, exports.parseIdentifier)(state, options);
    if (nameResult) {
        name = nameResult.result;
        state = nameResult.state;
        state = (0, exports.skipComments)(state, true, options);
    }
    // parse function parameters
    let parametersResult = (0, exports.parseFunctionParameters)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
    if (!parametersResult) {
        return undefined;
    }
    state = parametersResult.state;
    const args = parametersResult.result || [];
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, options);
    // parse =>
    let isLambda = false;
    const arrowResult = (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Equals, CodeTokenType_1.CodeTokenType.TupleClose]);
    if (keywordResult && arrowResult) {
        // it's lambda and 'function' function!
        state = arrowResult.state;
        state = (0, exports.addInvalidTokenSequenceError)(state, arrowResult.result);
    }
    if (arrowResult) {
        state = arrowResult.state;
        isLambda = true;
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, options);
    // parse function body
    let bodyResult = (0, exports.parseCodeBlock)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
    if (!bodyResult) {
        return undefined;
    }
    state = bodyResult.state;
    const body = bodyResult.result;
    // prepare result
    const end = (0, exports.getCursorPosition)(state);
    const isNoKeyword = keywordResult ? false : true;
    const result = astFactory_1.astFactory.functionLiteral(name, args, body, isLambda, isAsync, isNoKeyword, isGenerator, start, end);
    return {
        state,
        result
    };
};
exports.parseFunction = parseFunction;
const parseGetterSetter = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    return (0, exports.parseKeywordNode)(state, true, options, [
        KeywordType_1.KeywordType.Get,
        KeywordType_1.KeywordType.Set
    ], [
        exports.parseFunction
    ]);
};
exports.parseGetterSetter = parseGetterSetter;
// identifiers
const parseIdentifier = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // read until keyword, separator
    let variableName = undefined;
    let nextToken;
    let whitespace = "";
    while (nextToken = (0, exports.getToken)(state)) {
        // parse escaped char
        let isEscapedChar = false;
        if (nextToken.type === CodeTokenType_1.CodeTokenType.Backslash) {
            let escapedToken = (0, exports.getToken)(state, 1);
            if (escapedToken) {
                state = (0, exports.skipTokens)(state, 1);
                nextToken = escapedToken;
                isEscapedChar = true;
            }
        }
        if (!isEscapedChar && separators.some((separatorType) => nextToken.type === separatorType)) {
            // we've found separator. variable ends
            break;
        }
        // check for keywords
        if (!isEscapedChar && keywords.some((keyword) => keyword === nextToken.value)) {
            // we've found keyword. variable ends
            break;
        }
        // check space
        if (!isEscapedChar && nextToken.type === CodeTokenType_1.CodeTokenType.Space) {
            // variables don't start with space
            if (variableName === undefined) {
                return undefined;
            }
            whitespace += " ";
            state = (0, exports.skipTokens)(state, 1);
            continue;
        }
        // we don't add whitespace at the begining of variable name
        if (variableName === undefined) {
            whitespace = "";
        }
        // otherwise this token is part of variable
        variableName = variableName || '';
        let nextTokenValue = nextToken.value || '';
        let nextTokenChar = '';
        if (nextTokenValue.length > 0) {
            nextTokenChar = nextTokenValue[0];
        }
        // check escaped \t \r \n
        if (isEscapedChar && nextToken.type === CodeTokenType_1.CodeTokenType.Word) {
            switch (nextTokenChar) {
                case "t":
                case "r":
                case "n":
                    {
                        nextTokenValue = `\\${nextTokenValue}`;
                    }
                    break;
            }
        }
        else if (isEscapedChar) {
            // this is escaped char, but not escaped word
            // check \'
            if (isEscapedChar && nextToken.type === CodeTokenType_1.CodeTokenType.Prime) {
                nextTokenValue = `\\'`;
            }
            // check \"
            else if (isEscapedChar && nextToken.type === CodeTokenType_1.CodeTokenType.Quote) {
                nextTokenValue = `\\"`;
            }
            // any other escaped token
            else {
                nextTokenValue = `\\${nextTokenValue}`;
            }
        }
        variableName = variableName + whitespace + nextTokenValue;
        state = (0, exports.skipTokens)(state, 1);
        whitespace = "";
    }
    if (variableName === undefined) {
        return undefined;
    }
    const isJsIdentifier = (0, exports.isValidJsIdentifier)(variableName);
    // prepare result
    let result = astFactory_1.astFactory.identifier(variableName, isJsIdentifier, start, (0, exports.getCursorPosition)(state));
    return {
        state,
        result
    };
};
exports.parseIdentifier = parseIdentifier;
const parseIdentifierScope = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Prime]), (state) => (0, exports.parseStringLiteralItem)(state, Object.assign(Object.assign({}, options), { isMultiline: true })), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Prime]));
    if (!scopeResult) {
        return undefined;
    }
    state = scopeResult.state;
    let value = scopeResult.result.content;
    let end = (0, exports.getCursorPosition)(state);
    // prepare result
    let result = astFactory_1.astFactory.IdentifierScope(value, start, end);
    return {
        result,
        state
    };
};
exports.parseIdentifierScope = parseIdentifierScope;
const parseObjectLineIdentifier = (state, options) => {
    var _a;
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // parse everything until the end of line or the '=' symbol
    const resultValues = [];
    let isEscaping = false;
    while (!(0, exports.isEndOfFile)(state)) {
        const token = (0, exports.getToken)(state);
        if (token.type == CodeTokenType_1.CodeTokenType.Endline || token.type == CodeTokenType_1.CodeTokenType.Endfile) {
            break;
        }
        if (!isEscaping && token.type == CodeTokenType_1.CodeTokenType.Equals) {
            break;
        }
        state = (0, exports.skipTokens)(state, 1);
        resultValues.push((_a = token.value) !== null && _a !== void 0 ? _a : '');
        if (!isEscaping) {
            state = (0, exports.skipComments)(state, false, exports.emptyOptions);
        }
        if (token.type == CodeTokenType_1.CodeTokenType.Slash) {
            isEscaping = !isEscaping;
        }
    }
    const value = resultValues.join('').trim();
    const end = (0, exports.getCursorPosition)(state);
    const isJsIdentifier = (0, exports.isValidJsIdentifier)(value);
    // prepare result
    let result = astFactory_1.astFactory.identifier(value, isJsIdentifier, start, end);
    return {
        result,
        state
    };
};
exports.parseObjectLineIdentifier = parseObjectLineIdentifier;
const parseRawIdentifier = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // check @ mark
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.AtSign])) {
        let start = (0, exports.getCursorPosition)(state);
        state = (0, exports.skipTokens)(state, 1);
        // identifier scope
        let identScopeResult = (0, exports.parseIdentifierScope)(state, options);
        if (identScopeResult) {
            state = identScopeResult.state;
            let end = (0, exports.getCursorPosition)(state);
            let result = astFactory_1.astFactory.rawIndentifier(identScopeResult.result, start, end);
            return {
                state,
                result
            };
        }
        // identifier
        let identifierResult = (0, exports.parseIdentifier)(state, options);
        if (identifierResult) {
            state = identifierResult.state;
            let end = (0, exports.getCursorPosition)(state);
            let result = astFactory_1.astFactory.rawIndentifier(identifierResult.result, start, end);
            return {
                result,
                state
            };
        }
    }
    return undefined;
};
exports.parseRawIdentifier = parseRawIdentifier;
const parseAnyIdentifier = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    return (0, exports.parseNode)(state, Object.assign(Object.assign({}, options), { isMultiline: false }), [
        exports.parseRawIdentifier,
        exports.parseIdentifierScope,
        exports.parseIdentifier
    ]);
};
exports.parseAnyIdentifier = parseAnyIdentifier;
const parseContextIdentifier = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let identifierResult = (0, exports.parseAnyIdentifier)(state, options);
    if (!identifierResult) {
        return undefined;
    }
    // prepare result
    state = identifierResult.state;
    let identifier = identifierResult.result;
    let start = identifier.start;
    let end = identifier.end;
    let result = astFactory_1.astFactory.contextIndentifier(identifier, start, end);
    return {
        state,
        result
    };
};
exports.parseContextIdentifier = parseContextIdentifier;
/**
 * Operand identifier means: if no '@' symbol before identifier, it's context identifier (context['identifier'])
 */
const parseOperandIdentifier = (state, options) => {
    const parsers = options.allowContextIdentifiers
        ? [exports.parseRawIdentifier, exports.parseContextIdentifier]
        : [exports.parseRawIdentifier, exports.parseIdentifierScope, exports.parseIdentifier];
    const nodeResult = (0, exports.parseNode)(state, Object.assign(Object.assign({}, options), { isMultiline: false }), parsers);
    if (nodeResult && !options.allowContextIdentifiers) {
        const identifierScope = astFactory_1.astFactory.asNode(nodeResult.result, AstNodeType_1.AstNodeType.IdentifierScope);
        if (identifierScope) {
            nodeResult.result = astFactory_1.astFactory.contextIndentifier(identifierScope, identifierScope.start, identifierScope.end);
        }
        else {
            const identifierResult = astFactory_1.astFactory.asNode(nodeResult.result, AstNodeType_1.AstNodeType.Identifier);
            if (identifierResult && identifierResult.isJsIdentifier !== true) {
                nodeResult.result = astFactory_1.astFactory.contextIndentifier(identifierResult, identifierResult.start, identifierResult.end);
            }
        }
    }
    return nodeResult;
};
exports.parseOperandIdentifier = parseOperandIdentifier;
// declarations
const parseClassDeclaration = (state, options) => {
    var _a, _b;
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    const start = (0, exports.getCursorPosition)(state);
    // parse class keyword
    const classResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Class]);
    if (!classResult) {
        return undefined;
    }
    state = classResult.state;
    state = (0, exports.skipComments)(state, true, options);
    // parse name
    const nameResult = (0, exports.parseAnyIdentifier)(state, options);
    if (!nameResult) {
        return undefined;
    }
    const name = nameResult.result;
    state = nameResult.state;
    state = (0, exports.skipComments)(state, true, options);
    // parse extends
    let parent;
    const extendsResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Extends]);
    if (extendsResult) {
        state = extendsResult.state;
        state = (0, exports.skipComments)(state, true, options);
        const parentResult = (0, exports.parseExpression)(state, options);
        if (parentResult) {
            parent = parentResult.result;
            state = parentResult.state;
            state = (0, exports.skipComments)(state, true, options);
        }
    }
    // parse contents
    const contentsResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceOpen]), (state) => (0, exports.parseClassMember)(state, Object.assign(Object.assign({}, options), { isMultiline: true })), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceClose]), (state) => {
        state = (0, exports.skipComments)(state, true, options);
        state = (0, exports.skipTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Semicolon, CodeTokenType_1.CodeTokenType.Comma]);
        return state;
    }, undefined, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Semicolon, CodeTokenType_1.CodeTokenType.Colon, CodeTokenType_1.CodeTokenType.Endline]));
    let contents = [];
    if (contentsResult) {
        state = contentsResult.state;
        contents = (_b = (_a = contentsResult.result) === null || _a === void 0 ? void 0 : _a.content) !== null && _b !== void 0 ? _b : [];
    }
    const end = (0, exports.getCursorPosition)(state);
    const result = astFactory_1.astFactory.classDeclaration(name, contents, parent, start, end);
    return {
        state,
        result
    };
};
exports.parseClassDeclaration = parseClassDeclaration;
const parseClassMember = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // const staticResult = parseKeywordNode(state, true, options,
    // 	[KeywordType.Static],
    // 	[parseExpression]
    // );
    // if (staticResult) {
    // 	return staticResult;
    // }
    // parse object literal item
    const itemResult = (0, exports.parseObjectLiteralItem)(state, options);
    if (itemResult) {
        return itemResult;
    }
    // parse any statement? 
    const statementResult = (0, exports.parseStatement)(state, options);
    if (statementResult) {
        return statementResult;
    }
    return undefined;
};
exports.parseClassMember = parseClassMember;
const parseDeconstructionAssignment = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    const start = (0, exports.getCursorPosition)(state);
    // parse array literal
    let variables = undefined;
    const arrayResult = (0, exports.parseArrayLiteral)(state, Object.assign(Object.assign({}, options), { isMultiline: true }), true);
    if (arrayResult) {
        state = arrayResult.state;
        variables = arrayResult.result;
    }
    else {
        const objResult = (0, exports.parseObject)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
        if (objResult) {
            state = objResult.state;
            variables = objResult.result;
        }
    }
    if (!variables) {
        return undefined;
    }
    state = (0, exports.skipComments)(state, true, options);
    // parse =
    const equalsResult = (0, exports.parseOperatorOfType)(state, options, [OperatorType_1.OperatorType.Equals]);
    if (!equalsResult) {
        return undefined;
    }
    state = equalsResult.state;
    state = (0, exports.skipComments)(state, true, options);
    // parse identifier
    let initializer = undefined;
    const identifierResult = (0, exports.parseExpression)(state, options);
    if (identifierResult) {
        state = identifierResult.state;
        initializer = identifierResult.result;
    }
    else {
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, 'initialization expected', (0, exports.getCursorPosition)(state), (0, exports.getCursorPosition)(state));
    }
    const end = (0, exports.getCursorPosition)(state);
    const result = astFactory_1.astFactory.deconstructionAssignment(variables, initializer, start, end);
    return {
        state,
        result
    };
};
exports.parseDeconstructionAssignment = parseDeconstructionAssignment;
const parseVariableDeclaration = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // save start position
    let start = (0, exports.getCursorPosition)(state);
    // var|let|const Identifier = Expression
    // parse keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Var, KeywordType_1.KeywordType.Let, KeywordType_1.KeywordType.Const]);
    if (!keywordResult) {
        return undefined;
    }
    let keyword = keywordResult.result;
    state = keywordResult.state;
    // read declaration kind
    let kind = undefined;
    switch (keyword.keywordType) {
        case KeywordType_1.KeywordType.Var:
            {
                kind = VariableDeclarationKind_1.VariableDeclarationKind.Var;
            }
            break;
        case KeywordType_1.KeywordType.Const:
            {
                kind = VariableDeclarationKind_1.VariableDeclarationKind.Const;
            }
            break;
        case KeywordType_1.KeywordType.Let:
            {
                kind = VariableDeclarationKind_1.VariableDeclarationKind.Let;
            }
            break;
        default: return undefined;
    }
    // prepare break tokens
    let breakTokens = [CodeTokenType_1.CodeTokenType.Endfile, CodeTokenType_1.CodeTokenType.Semicolon];
    let identifiers = [];
    let initValue = undefined;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        state = (0, exports.skipComments)(state, true, options);
        // parse identifier
        let identifierResult = (0, exports.parseAnyIdentifier)(state, options);
        if (identifierResult) {
            state = identifierResult.state;
            identifiers.push(identifierResult.result);
        }
        else {
            // parse object expression
            let objResult = (0, exports.parseObject)(state, options);
            if (objResult) {
                state = objResult.state;
                identifiers.push(objResult.result);
            }
            else {
                // parse array expression
                let arrayResult = (0, exports.parseArrayLiteral)(state, Object.assign(Object.assign({}, options), { isMultiline: true }), true);
                if (arrayResult) {
                    state = arrayResult.state;
                    identifiers.push(arrayResult.result);
                }
            }
        }
        state = (0, exports.skipComments)(state, true, exports.emptyOptions);
        // now there can be a ',' which means we have another variable to parse
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Comma])) {
            state = (0, exports.skipTokens)(state, 1);
            continue;
        }
        break;
    }
    state = (0, exports.skipComments)(state, true, options);
    // parse equals
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Equals])) {
        /// skip equals token
        state = (0, exports.skipTokens)(state, 1);
        state = (0, exports.skipComments)(state, true, options);
        // parse init value expression
        let expressionResult = (0, exports.parseExpression)(state, options);
        if (expressionResult) {
            state = expressionResult.state;
            initValue = expressionResult.result;
        }
    }
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.variableListDeclaration(identifiers, kind, initValue, start, end);
    return {
        state,
        result
    };
};
exports.parseVariableDeclaration = parseVariableDeclaration;
// expression statements
const parseExpression = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    return (0, exports.parseNode)(state, options, [
        exports.parseKeywordExpression,
        exports.parseOperationExpression
    ]);
};
exports.parseExpression = parseExpression;
const parseKeywordExpression = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    return (0, exports.parseKeywordNode)(state, true, options, [
        KeywordType_1.KeywordType.New,
        KeywordType_1.KeywordType.Await,
        KeywordType_1.KeywordType.Yield,
        KeywordType_1.KeywordType.Delete,
        KeywordType_1.KeywordType.Typeof
    ], [exports.parseExpression]);
};
exports.parseKeywordExpression = parseKeywordExpression;
const parseOperationExpression = (state, options) => {
    // prefix
    let prefixStart = (0, exports.getCursorPosition)(state);
    // parse unary prefix
    let prefixOperatorResult = (0, exports.parseUnaryOperatorPrefix)(state, options);
    if (prefixOperatorResult) {
        state = prefixOperatorResult.state;
    }
    // parse first operand
    let operandResult = (0, exports.parseOperand)(state, options);
    if (!operandResult) {
        return undefined;
    }
    state = operandResult.state;
    let result = operandResult.result;
    // check is there unary prefix
    if (prefixOperatorResult) {
        let prefixOperator = prefixOperatorResult.result;
        let prefixEnd = (0, exports.getCursorPosition)(state);
        result = astFactory_1.astFactory.updateExpression(result, prefixOperator, true, prefixStart, prefixEnd);
    }
    // parse operation
    let breakTokens = [CodeTokenType_1.CodeTokenType.Semicolon, CodeTokenType_1.CodeTokenType.Comma, CodeTokenType_1.CodeTokenType.BracketClose, CodeTokenType_1.CodeTokenType.ParenClose, CodeTokenType_1.CodeTokenType.BraceClose, CodeTokenType_1.CodeTokenType.Colon];
    if (!options.isMultiline) {
        breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Endline];
    }
    let finalState = state;
    while (!(0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments
        let curPos = state.cursor;
        state = (0, exports.skipComments)(state, true, options);
        if (state.cursor !== curPos) {
            continue;
        }
        // parse operation
        let operationResult = (0, exports.parseOperation)(state, result, options);
        if (operationResult) {
            state = operationResult.state;
            result = operationResult.result;
            finalState = state;
            continue;
        }
        // if we here that means we've found some token that is not an operator and expression should terminate
        break;
    }
    state = finalState;
    return {
        result,
        state
    };
};
exports.parseOperationExpression = parseOperationExpression;
const parseOperand = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    return (0, exports.parseNode)(state, options, [
        exports.parseLiteral,
        exports.parseParenExpression,
        exports.parseOperandIdentifier,
        (state) => (0, exports.parseKeywordOfType)(state, options, [KeywordType_1.KeywordType.Null, KeywordType_1.KeywordType.Undefined])
    ]);
};
exports.parseOperand = parseOperand;
const parseOperation = (state, leftOperand, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse member expression
    let memberResult = (0, exports.parseMemberExpression)(state, leftOperand, options);
    if (memberResult) {
        return memberResult;
    }
    // parse call expression
    let callResult = (0, exports.parseCallExpression)(state, leftOperand, options);
    if (callResult) {
        return callResult;
    }
    // parse indexer expression
    let indexerResult = (0, exports.parseIndexerExpression)(state, leftOperand, options);
    if (indexerResult) {
        return indexerResult;
    }
    // parse update expression
    let updateResult = (0, exports.parseUpdateExpressionPostfix)(state, leftOperand, options);
    if (updateResult) {
        return updateResult;
    }
    // parse binary expression
    let binaryResult = (0, exports.parseBinaryExpression)(state, leftOperand, options);
    if (binaryResult) {
        return binaryResult;
    }
    // parse conditional expression
    let conditionalExpressionResult = (0, exports.parseConditionalExpression)(state, leftOperand, options);
    if (conditionalExpressionResult) {
        return conditionalExpressionResult;
    }
    return undefined;
};
exports.parseOperation = parseOperation;
const parseParenExpression = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse open paren
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenOpen])) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = (0, exports.skipTokens)(state, 1);
    // skip comments
    state = (0, exports.skipComments)(state, true, options);
    // parse expression
    let expression = undefined;
    let expressionResult = (0, exports.parseExpression)(state, options);
    if (expressionResult) {
        expression = expressionResult.result;
        state = expressionResult.state;
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, options);
    // skip everything until close token )
    state = (0, exports.parseErrorTokens)(state, (st) => (0, exports.getTokenOfType)(st, [CodeTokenType_1.CodeTokenType.ParenClose]) !== undefined);
    // parse close paren
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    else {
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "Expected ) token not found", (0, exports.getCursorPosition)(state), (0, exports.getCursorPosition)(state));
    }
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.parenExpression(expression, start, end);
    return {
        result,
        state
    };
};
exports.parseParenExpression = parseParenExpression;
const parseCallExpression = (state, leftOperand, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, options);
    let start = (0, exports.getCursorPosition)(state);
    // parse function args
    let funcArgsResult = (0, exports.parseCallArguments)(state, Object.assign(Object.assign({}, options), { isMultiline: true }));
    if (!funcArgsResult) {
        return undefined;
    }
    state = funcArgsResult.state;
    let args = funcArgsResult.result;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.callExpression(leftOperand, args, start, end);
    return {
        result,
        state
    };
};
exports.parseCallExpression = parseCallExpression;
const parseCallArguments = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse open token
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenOpen])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    // parse expressions separated by , or ; or endline until close token
    let result = [];
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose])) {
        // skip whitespace and comments
        state = (0, exports.skipComments)(state, true, options);
        // parse expression
        let expressionResult = (0, exports.parseExpression)(state, options);
        if (expressionResult) {
            state = expressionResult.state;
            result = [
                ...result,
                expressionResult.result
            ];
            continue;
        }
        // skip separator
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Comma, CodeTokenType_1.CodeTokenType.Endline, CodeTokenType_1.CodeTokenType.Semicolon])) {
            state = (0, exports.skipTokens)(state, 1);
            continue;
        }
        // skip whitespace
        let prevCursor = state.cursor;
        let newState = (0, exports.skipComments)(state, true, options);
        if (newState && newState.cursor > prevCursor) {
            state = newState;
            continue;
        }
        // check break tokens
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose])) {
            break;
        }
        // otherwise it's invalid symbol
        let nextToken = (0, exports.getToken)(state);
        let errorStart = (0, exports.getCursorPosition)(state);
        state = (0, exports.skipTokens)(state, 1);
        let errorEnd = (0, exports.getCursorPosition)(state);
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "invalid symbol '" + nextToken.value || nextToken.type + "'", errorStart, errorEnd);
    }
    // parse close token
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    return {
        result,
        state
    };
};
exports.parseCallArguments = parseCallArguments;
const parseIndexerExpression = (state, leftOperand, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse leftOperand [ indexerValue ]
    let start = (0, exports.getCursorPosition)(state);
    // parse open token
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.BracketOpen])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, options);
    // parse property
    let property = undefined;
    let expressionResult = (0, exports.parseExpression)(state, options);
    if (expressionResult) {
        property = expressionResult.result;
        state = expressionResult.state;
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, options);
    // skip everything until close token
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.BracketClose])) {
        let errorStart = (0, exports.getCursorPosition)(state);
        let errorToken = (0, exports.getToken)(state);
        state = (0, exports.skipTokens)(state, 1);
        let errorEnd = (0, exports.getCursorPosition)(state);
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, `invalid token '${errorToken.value || errorToken.type}'`, errorStart, errorEnd);
    }
    // parse close token
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.BracketClose])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let member = astFactory_1.astFactory.memberExpression(leftOperand, property, false, start, end);
    let result = astFactory_1.astFactory.IndexerExpression(member, start, end);
    return {
        result,
        state
    };
};
exports.parseIndexerExpression = parseIndexerExpression;
const parseUpdateExpressionPostfix = (state, leftOperand, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let operatorResult = (0, exports.parseUnaryOperatorPostfix)(state, options);
    if (!operatorResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = operatorResult.state;
    let operator = operatorResult.result;
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.updateExpression(leftOperand, operator, false, start, end);
    return {
        state,
        result
    };
};
exports.parseUpdateExpressionPostfix = parseUpdateExpressionPostfix;
const parseBinaryExpression = (state, leftOperand, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse operator
    let operatorResult = (0, exports.parseBinaryOperator)(state, options);
    if (!operatorResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = operatorResult.state;
    let operator = operatorResult.result;
    let rightStart = (0, exports.getCursorPosition)(state);
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, options);
    // parse right operand
    let rightOperand;
    let rightOperandResult = (0, exports.parseExpression)(state, options);
    if (rightOperandResult) {
        state = rightOperandResult.state;
        rightOperand = rightOperandResult.result;
    }
    else {
        // add parsing error
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, `here should be right operand, but no one parsed`, rightStart, (0, exports.getCursorPosition)(state));
    }
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.binaryExpression(leftOperand, operator, rightOperand, start, end);
    return {
        result,
        state
    };
};
exports.parseBinaryExpression = parseBinaryExpression;
const parseMemberExpression = (state, leftOperand, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse leftOperand . [identifier]
    // parse ? (optional chaining)
    let isOptional = false;
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Question])) {
        isOptional = true;
        state = (0, exports.skipTokens)(state, 1);
    }
    // parse .
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Dot])) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = (0, exports.skipTokens)(state, 1);
    // skip comments and whitespace
    state = (0, exports.skipComments)(state, true, options);
    // parse identifier
    let identifierResult = (0, exports.parseAnyIdentifier)(state, options);
    if (identifierResult) {
        state = identifierResult.state;
        let identifier = identifierResult.result;
        // prepare result
        let end = (0, exports.getCursorPosition)(state);
        let result = astFactory_1.astFactory.memberExpression(leftOperand, identifier, isOptional, start, end);
        return {
            state,
            result
        };
    }
    return undefined;
};
exports.parseMemberExpression = parseMemberExpression;
const parseConditionalExpression = (state, condition, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse question token
    let questionTokenResult = (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Question]);
    if (!questionTokenResult) {
        return undefined;
    }
    let questionToken = astFactory_1.astFactory.token(questionTokenResult, questionTokenResult.start);
    let start = (0, exports.getCursorPosition)(state);
    state = (0, exports.skipTokens)(state, 1);
    let finalState = state;
    let breakTokens = options.isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens.push(CodeTokenType_1.CodeTokenType.Semicolon);
    let whenTrue;
    let whenFalse;
    let colonToken;
    // parse operator content
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // parse when true
        let rightOperandResult = (0, exports.parseExpression)(state, options);
        if (rightOperandResult) {
            state = rightOperandResult.state;
            whenTrue = rightOperandResult.result;
            finalState = state;
        }
        state = (0, exports.skipComments)(state, true, options);
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // skip everything until break tokens or colon
        state = (0, exports.parseErrorTokens)(state, (state) => (0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.Colon]) !== undefined);
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // parse colon
        let colToken = (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Colon]);
        if (colToken) {
            state = (0, exports.skipTokens)(state, 1);
            finalState = state;
            colonToken = astFactory_1.astFactory.token(colToken, colToken.start);
        }
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, options);
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // parse whenFalse
        let whenFalseResult = (0, exports.parseExpression)(state, options);
        if (whenFalseResult) {
            whenFalse = whenFalseResult.result;
            state = whenFalseResult.state;
            finalState = whenFalseResult.state;
        }
        break;
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.conditionalExpression(condition, whenTrue, whenFalse, colonToken, questionToken, start, end);
    return {
        result,
        state
    };
};
exports.parseConditionalExpression = parseConditionalExpression;
const parseNewExpression = (state, options) => {
    return (0, exports.parseKeywordNode)(state, true, options, [KeywordType_1.KeywordType.New], [exports.parseExpression]);
};
exports.parseNewExpression = parseNewExpression;
const parseAwaitExpression = (state, options) => {
    return (0, exports.parseKeywordNode)(state, true, options, [KeywordType_1.KeywordType.Await], [exports.parseExpression]);
};
exports.parseAwaitExpression = parseAwaitExpression;
const parseYieldExpression = (state, options) => {
    return (0, exports.parseKeywordNode)(state, true, options, [KeywordType_1.KeywordType.Yield], [exports.parseExpression]);
};
exports.parseYieldExpression = parseYieldExpression;
const parseDeleteExpression = (state, options) => {
    return (0, exports.parseKeywordNode)(state, true, options, [KeywordType_1.KeywordType.Delete], [exports.parseExpression]);
};
exports.parseDeleteExpression = parseDeleteExpression;
const parseTypeofExpression = (state, options) => {
    return (0, exports.parseKeywordNode)(state, true, options, [KeywordType_1.KeywordType.Typeof], [exports.parseExpression]);
};
exports.parseTypeofExpression = parseTypeofExpression;
// storytailor-specific
const parseTag = (state, options) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse scope from < to >
    let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.TupleOpen]), (state) => (0, exports.parseToken)(state), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.TupleClose]), undefined, (state) => (0, exports.checkTokenSequence)(state, [CodeTokenType_1.CodeTokenType.TupleClose]));
    if (!scopeResult) {
        return undefined;
    }
    state = scopeResult.state;
    let scope = scopeResult.result;
    let result = astFactory_1.astFactory.tag(scope.content, scope.open, scope.close, scope.start, scope.end);
    return {
        state,
        result
    };
};
exports.parseTag = parseTag;
// SYSTEM FUNCTIONS
const parseNode = (state, options, parsers) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    if (!parsers || parsers.length <= 0) {
        return undefined;
    }
    for (let fIndex = 0; fIndex < parsers.length; fIndex++) {
        const parser = parsers[fIndex];
        const parseResult = parser(state, options);
        if (parseResult) {
            return parseResult;
        }
    }
    return undefined;
};
exports.parseNode = parseNode;
const parseKeywordNode = (state, isKeywordFirst, options, keywords, parsers) => {
    if ((0, exports.isEndOfFile)(state) || !parsers || parsers.length <= 0 || !keywords || keywords.length <= 0) {
        return undefined;
    }
    const start = (0, exports.getCursorPosition)(state);
    // parse keyword
    let keyword = undefined;
    if (isKeywordFirst === true) {
        const keywordResult = (0, exports.parseKeywordOfType)(state, options, keywords);
        if (!keywordResult) {
            return undefined;
        }
        keyword = keywordResult.result;
        state = keywordResult.state;
        state = (0, exports.skipComments)(state, true, options);
    }
    // parse node
    let node = undefined;
    for (let pIndex = 0; pIndex < parsers.length; pIndex++) {
        const parser = parsers[pIndex];
        if (!parser) {
            continue;
        }
        const nodeResult = parser(state, options);
        if (!nodeResult) {
            continue;
        }
        node = nodeResult.result;
        state = nodeResult.state;
        break;
    }
    if (!isKeywordFirst) {
        state = (0, exports.skipComments)(state, true, options);
        const keywordResult = (0, exports.parseKeywordOfType)(state, options, keywords);
        if (!keywordResult) {
            return undefined;
        }
        keyword = keywordResult.result;
        state = keywordResult.state;
    }
    const end = (0, exports.getCursorPosition)(state);
    const result = astFactory_1.astFactory.keywordNode(keyword, node, isKeywordFirst, start, end);
    return {
        state,
        result
    };
};
exports.parseKeywordNode = parseKeywordNode;
const parseToken = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // get token and create ast node
    var token = (0, exports.getToken)(state);
    var astToken = astFactory_1.astFactory.token(token, (0, exports.getCursorPosition)(state));
    // skip 1 token 
    state = (0, exports.skipTokens)(state, 1);
    return {
        result: astToken,
        state: state
    };
};
exports.parseToken = parseToken;
const parseScope = (state, openFilter, itemFilter, closeFilter, skipOptional, breakFilter, separatorFilter) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    if (!openFilter || !itemFilter || !closeFilter) {
        return undefined;
    }
    // save start position
    let start = (0, exports.getCursorPosition)(state);
    // parse open node
    let openResult = openFilter(state);
    if (!openResult) {
        return undefined;
    }
    let open = openResult.result;
    state = openResult.state;
    // prepare breakFilter
    if (!breakFilter) {
        breakFilter = () => false;
    }
    // parse items
    let items = [];
    let finalState = state;
    while (!(0, exports.isEndOfFile)(state) && !closeFilter(state) && !breakFilter(state)) {
        // skip optional symbols
        if (skipOptional) {
            let prevState = state;
            state = skipOptional(state) || state;
            finalState = state;
            if (prevState.cursor < state.cursor) {
                continue;
            }
        }
        // parse item
        let itemResult = itemFilter(state);
        if (itemResult) {
            // item parsed
            state = itemResult.state;
            items = [...items, itemResult.result];
            finalState = state;
            // skip separator
            if (separatorFilter) {
                let separatorResult = separatorFilter(state);
                if (separatorResult) {
                    state = separatorResult.state;
                    finalState = state;
                }
            }
            continue;
        }
        // if we here, that means here is not the item
        // check if it optional symbol
        // skip optional symbols
        if (skipOptional) {
            let prevState = state;
            state = skipOptional(state) || state;
            finalState = state;
            if (prevState.cursor < state.cursor) {
                continue;
            }
        }
        // if we here that means token we found is not valid at this point
        state = (0, exports.addInvalidTokenError)(state, (0, exports.getToken)(state));
        state = (0, exports.skipTokens)(state, 1);
        finalState = state;
    }
    state = finalState;
    // parse close node
    let closeResult = closeFilter(state);
    let close = undefined;
    if (closeResult) {
        close = closeResult.result;
        state = closeResult.state;
    }
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.scope(items, open, close, start, end);
    return {
        result,
        state
    };
};
exports.parseScope = parseScope;
/// Every token until the endSequence filter will be marked as incorrect token
const parseErrorTokens = (state, endSequence) => {
    while (!(0, exports.isEndOfFile)(state)) {
        // skip comments if any
        let curPos = state.cursor;
        state = (0, exports.skipComments)(state, false, exports.emptyOptions);
        if (curPos != state.cursor) {
            // comments was skipped
            continue;
        }
        // otherwise there was no comments
        //check user filter and break if it doesn't pass
        if (endSequence && endSequence(state)) {
            break;
        }
        // if we here, that means we have unexpected token
        let errorStart = (0, exports.getCursorPosition)(state);
        let errorToken = (0, exports.getToken)(state);
        state = (0, exports.skipTokens)(state, 1);
        let errorEnd = (0, exports.getCursorPosition)(state);
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "Unexpected token '" + errorToken.value || errorToken.type + "'", errorStart, errorEnd);
    }
    return state;
};
exports.parseErrorTokens = parseErrorTokens;
const readString = (state, breakTokens, trimString = false) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let result;
    let nextToken;
    let offset = 0;
    while (nextToken = (0, exports.getToken)(state, offset)) {
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
    state = (0, exports.skipTokens)(state, offset);
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
exports.readString = readString;
const readWhitespace = (state) => {
    let result = (0, exports.readTokensAsString)(state, [CodeTokenType_1.CodeTokenType.Space, CodeTokenType_1.CodeTokenType.Tab]);
    return result;
};
exports.readWhitespace = readWhitespace;
const calcIndentFromWhitespace = (whitespace) => {
    if (!whitespace) {
        return 0;
    }
    whitespace = whitespace.replace(/\t/g, indentWhitespaceString);
    const result = Math.trunc(whitespace.length);
    return result;
};
exports.calcIndentFromWhitespace = calcIndentFromWhitespace;
const readTokensAsString = (state, tokenTypes) => {
    let value;
    let nextToken;
    while (nextToken = (0, exports.getTokenOfType)(state, tokenTypes)) {
        value = (value || '') + nextToken.value;
        state = (0, exports.skipTokens)(state, 1);
    }
    if (!value) {
        return undefined;
    }
    return {
        state: state,
        result: value
    };
};
exports.readTokensAsString = readTokensAsString;
const isEndOfFile = (state, offset = 0) => {
    if (!state || !state.tokens || state.tokens.length <= 0) {
        return true;
    }
    const cursor = state.cursor + offset;
    return state.tokens.length <= cursor;
};
exports.isEndOfFile = isEndOfFile;
const isValidJsIdentifier = (variableName) => {
    if (!variableName || variableName === '') {
        return false;
    }
    // check is this identifier is a valid javascript identifier
    const regex = /^[$_\p{L}][$_\p{L}\p{N}]*$/u;
    const isJsIdentifier = regex.test(variableName);
    return isJsIdentifier;
};
exports.isValidJsIdentifier = isValidJsIdentifier;
const addItemToArray = (source, item) => {
    source = source || [];
    return [
        ...source,
        item
    ];
};
exports.addItemToArray = addItemToArray;
const addItemToHash = (source, key, item) => {
    source = source || {};
    return Object.assign(Object.assign({}, source), { [key]: item });
};
exports.addItemToHash = addItemToHash;
const getToken = (state, offset = 0) => {
    if ((0, exports.isEndOfFile)(state, offset)) {
        return undefined;
    }
    const cursor = state.cursor + offset;
    if (cursor < 0) {
        return undefined;
    }
    return state.tokens[cursor];
};
exports.getToken = getToken;
const getTokenOfType = (state, types, offset = 0) => {
    if ((0, exports.isEndOfFile)(state, offset)) {
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
exports.getTokenOfType = getTokenOfType;
const getCursorPosition = (state) => {
    if (!state) {
        return undefined;
    }
    if ((0, exports.isEndOfFile)(state)) {
        if (state.tokens.length > 0) {
            let lastToken = state.tokens[state.tokens.length - 1];
            return lastToken.start;
        }
    }
    const nextToken = (0, exports.getToken)(state);
    return nextToken.start;
};
exports.getCursorPosition = getCursorPosition;
const skipComments = (state, isSkipWhitespace = false, options = exports.emptyOptions) => {
    while (true) {
        if (isSkipWhitespace === true) {
            state = (0, exports.skipWhitespace)(state, options);
        }
        let commentBlockResult = (0, exports.parseCommentBlock)(state, options);
        if (commentBlockResult) {
            state = commentBlockResult.state;
            continue;
        }
        let commentLineResult = (0, exports.parseCommentLine)(state, options);
        if (commentLineResult) {
            state = commentLineResult.state;
            continue;
        }
        if (isSkipWhitespace === true) {
            state = (0, exports.skipWhitespace)(state, options);
        }
        break;
    }
    return state;
};
exports.skipComments = skipComments;
const skipCommentLine = (state, options) => {
    let parseResult = (0, exports.parseCommentLine)(state, options);
    if (parseResult) {
        return parseResult.state;
    }
    return undefined;
};
exports.skipCommentLine = skipCommentLine;
const skipCommentBlock = (state, options) => {
    let parseResult = (0, exports.parseCommentBlock)(state, options);
    if (parseResult) {
        return parseResult.state;
    }
    return undefined;
};
exports.skipCommentBlock = skipCommentBlock;
const skipWhitespace = (state, options) => {
    const tokenTypes = (options === null || options === void 0 ? void 0 : options.isMultiline) === true
        ? [CodeTokenType_1.CodeTokenType.Space, CodeTokenType_1.CodeTokenType.Tab, CodeTokenType_1.CodeTokenType.Endline]
        : [CodeTokenType_1.CodeTokenType.Space, CodeTokenType_1.CodeTokenType.Tab];
    return (0, exports.skipTokensOfType)(state, tokenTypes);
};
exports.skipWhitespace = skipWhitespace;
const skipTokenOfType = (state, tokenTypes) => {
    let nextToken = (0, exports.getTokenOfType)(state, tokenTypes);
    if (nextToken) {
        state = (0, exports.skipTokens)(state, 1);
    }
    return state;
};
exports.skipTokenOfType = skipTokenOfType;
const skipTokensOfType = (state, tokenTypes) => {
    if ((0, exports.isEndOfFile)(state)) {
        return state;
    }
    if (!tokenTypes || tokenTypes.length <= 0) {
        return state;
    }
    let nextToken;
    while (nextToken = (0, exports.getToken)(state)) {
        if (tokenTypes.indexOf(nextToken.type) < 0) {
            return state;
        }
        state = (0, exports.skipTokens)(state, 1);
    }
    return state;
};
exports.skipTokensOfType = skipTokensOfType;
const skipUntil = (state, tokenTypes) => {
    if ((0, exports.isEndOfFile)(state)) {
        return state;
    }
    if (!tokenTypes || tokenTypes.length <= 0) {
        return state;
    }
    let nextToken;
    while (nextToken = (0, exports.getToken)(state)) {
        if (tokenTypes.indexOf(nextToken.type) >= 0) {
            return state;
        }
        state = (0, exports.skipTokens)(state, 1);
    }
    return state;
};
exports.skipUntil = skipUntil;
const checkTokenSequence = (state, tokenTypes) => {
    if ((0, exports.isEndOfFile)(state)) {
        return false;
    }
    if (!tokenTypes || tokenTypes.length <= 0) {
        return true;
    }
    for (let i = 0; i < tokenTypes.length; i++) {
        const tokenType = tokenTypes[i];
        const token = (0, exports.getToken)(state, i);
        if (!token || token.type !== tokenType) {
            // broken sequence
            return undefined;
        }
    }
    return true;
};
exports.checkTokenSequence = checkTokenSequence;
const parseTokenSequence = (state, tokenTypes) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    if (!tokenTypes || tokenTypes.length <= 0) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    let tokens = [];
    for (let i = 0; i < tokenTypes.length; i++) {
        const tokenType = tokenTypes[i];
        const token = (0, exports.getToken)(state);
        if (!token || token.type !== tokenType) {
            // broken sequence
            return undefined;
        }
        // otherwise, add token to result sequence
        tokens = [...tokens, token];
        state = (0, exports.skipTokens)(state, 1);
    }
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.tokenSequence(tokens, start, end);
    return {
        result,
        state
    };
};
exports.parseTokenSequence = parseTokenSequence;
const checkTokenSequences = (state, sequences) => {
    if (exports.isEndOfFile) {
        return undefined;
    }
    // parse open sequence
    for (let seqIndex = 0; seqIndex < sequences.length; seqIndex++) {
        const sequence = sequences[seqIndex];
        if ((0, exports.checkTokenSequence)(state, sequence)) {
            return sequence;
        }
    }
    return undefined;
};
exports.checkTokenSequences = checkTokenSequences;
const parseTokenSequences = (state, sequences) => {
    if (exports.isEndOfFile) {
        return undefined;
    }
    // parse open sequence
    for (let seqIndex = 0; seqIndex < sequences.length; seqIndex++) {
        const sequence = sequences[seqIndex];
        let sequenceResult = (0, exports.parseTokenSequence)(state, sequence);
        if (sequenceResult) {
            // prepare result
            let result = {
                tokens: sequence,
                sequence: sequenceResult.result
            };
            return {
                state,
                result
            };
        }
    }
    return undefined;
};
exports.parseTokenSequences = parseTokenSequences;
const skipTokens = (state, tokensCount) => {
    if ((0, exports.isEndOfFile)(state)) {
        if (tokensCount === 0)
            return state;
        return undefined;
    }
    const cursor = state.cursor + tokensCount;
    if (state.tokens.length < cursor) {
        return undefined;
    }
    state = Object.assign(Object.assign({}, state), { cursor: cursor });
    return state;
};
exports.skipTokens = skipTokens;
const addParsingError = (state, severity, message, start, end, code, source) => {
    if (!state) {
        return undefined;
    }
    let parsingError = {
        severity,
        message,
        range: {
            start,
            end
        },
        code,
        source
    };
    state = Object.assign(Object.assign({}, state), { errors: [...state.errors, parsingError] });
    return state;
};
exports.addParsingError = addParsingError;
const addInvalidTokenError = (state, token) => {
    if (!token || !state) {
        return state;
    }
    return (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, `Invalid token '${token.value || token.type}'`, token.start, token.end);
};
exports.addInvalidTokenError = addInvalidTokenError;
const addInvalidTokenSequenceError = (state, tokens) => {
    var _a;
    let tokensText = [];
    (_a = tokens === null || tokens === void 0 ? void 0 : tokens.tokens) === null || _a === void 0 ? void 0 : _a.forEach(token => {
        tokensText.push(token.value || token.type);
    });
    return (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, `invalid tokens '${tokensText.join("")}'`, tokens.start, tokens.end);
};
exports.addInvalidTokenSequenceError = addInvalidTokenSequenceError;
const prepareTokens = (tokens) => {
    if (!tokens) {
        return tokens;
    }
    let result = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === CodeTokenType_1.CodeTokenType.CommentLine) {
            result = [
                ...result,
                {
                    start: token.start,
                    end: Object.assign(Object.assign({}, token.start), { symbol: token.start.symbol + 1, column: token.start.column + 1 }),
                    length: 1,
                    type: CodeTokenType_1.CodeTokenType.Slash,
                    value: "/"
                },
                {
                    start: Object.assign(Object.assign({}, token.start), { symbol: token.start.symbol + 1, column: token.start.column + 1 }),
                    end: token.end,
                    length: 1,
                    type: CodeTokenType_1.CodeTokenType.Slash,
                    value: "/"
                }
            ];
            continue;
        }
        if (token.type === CodeTokenType_1.CodeTokenType.CommentBlockOpen) {
            result = [
                ...result,
                {
                    start: token.start,
                    end: Object.assign(Object.assign({}, token.start), { symbol: token.start.symbol + 1, column: token.start.column + 1 }),
                    length: 1,
                    type: CodeTokenType_1.CodeTokenType.Slash,
                    value: "/"
                },
                {
                    start: Object.assign(Object.assign({}, token.start), { symbol: token.start.symbol + 1, column: token.start.column + 1 }),
                    end: token.end,
                    length: 1,
                    type: CodeTokenType_1.CodeTokenType.Star,
                    value: "*"
                }
            ];
            continue;
        }
        if (token.type === CodeTokenType_1.CodeTokenType.CommentBlockClose) {
            result = [
                ...result,
                {
                    start: token.start,
                    end: Object.assign(Object.assign({}, token.start), { symbol: token.start.symbol + 1, column: token.start.column + 1 }),
                    length: 1,
                    type: CodeTokenType_1.CodeTokenType.Star,
                    value: "*"
                },
                {
                    start: Object.assign(Object.assign({}, token.start), { symbol: token.start.symbol + 1, column: token.start.column + 1 }),
                    end: token.end,
                    length: 1,
                    type: CodeTokenType_1.CodeTokenType.Slash,
                    value: "/"
                }
            ];
            continue;
        }
        result = [
            ...result,
            token
        ];
    }
    return result;
};
exports.prepareTokens = prepareTokens;
exports.emptyOptions = {
    isMultiline: false,
    allowContextIdentifiers: false
};
exports.optionsOuterLine = {
    isMultiline: false,
    allowContextIdentifiers: true
};
exports.optionsCodeBlock = {
    isMultiline: true,
    allowContextIdentifiers: false
};
