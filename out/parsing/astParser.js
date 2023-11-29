"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseForInConditions = exports.parseConditionBlock = exports.parseForCoditions = exports.parseForStatement = exports.parseWhileStatement = exports.parseDoWhileStatement = exports.parseDefaultCaseStatement = exports.parseCaseStatement = exports.parseSwitchStatement = exports.parseIfStatement = exports.parseBlockStatement = exports.parseContinueStatement = exports.parseTypeofExpression = exports.parseDeleteExpression = exports.parseReturnStatement = exports.parseBreakStatement = exports.parseStatement = exports.parsePropertyDeclaration = exports.parseVariableDeclaration = exports.parseLambdaFunctionDeclaration = exports.parseSimpleFunctionDeclaration = exports.parseFunctionDeclaration = exports.parseOperandIdentifier = exports.parseContextIdentifier = exports.parseAnyIdentifier = exports.parseRawIdentifier = exports.parseIdentifierScope = exports.parseIdentifier = exports.parseArrayItem = exports.parseArrayLiteral = exports.parseBooleanLiteral = exports.parseStringInclude = exports.parseStringLiteralItem = exports.parseStringLiteral = exports.parseNumberLiteral = exports.parseLiteral = exports.parseCommentBlock = exports.parseCommentLine = exports.parseKeywordOfType = exports.parseDebuggerKeyword = exports.parseKeyword = exports.parseUnaryOperatorPostfix = exports.parseUnaryOperatorPrefix = exports.parseBinaryOperator = exports.parseOperatorOfType = exports.parseOperator = exports.parseToken = exports.parseModuleContent = exports.parseModule = exports.defaultParserConfig = void 0;
exports.parseTokenSequence = exports.checkTokenSequence = exports.skipUntil = exports.skipTokensOfType = exports.skipTokenOfType = exports.skipWhitespace = exports.skipCommentBlock = exports.skipCommentLine = exports.skipComments = exports.getCursorPosition = exports.getTokenOfType = exports.getToken = exports.addItemToHash = exports.addItemToArray = exports.isEndOfFile = exports.readTokensAsString = exports.calcIndentFromWhitespace = exports.readWhitespace = exports.readString = exports.parseErrorTokens = exports.parseScope = exports.parseTag = exports.parsePrototypeExpression = exports.parseDeleteLineExpression = exports.parseObjectLine = exports.parseTextLineStatement = exports.parseOuterStatementContent = exports.parseOuterStatement = exports.parseNewExpression = exports.parseConditionalExpression = exports.parseMemberExpression = exports.parseBinaryExpression = exports.parseUpdateExpressionPostfix = exports.parseIndexerExpression = exports.parseCallArguments = exports.parseCallExpression = exports.parseObjectExpression = exports.parseParenExpression = exports.parseOperation = exports.parseOperand = exports.parseExpression = exports.parseThrowStatement = exports.parseFinallyStatement = exports.parseCatchStatement = exports.parseTryStatement = exports.parseImportPath = exports.parseImportStatement = exports.parseForOfStatement = exports.parseForInStatement = exports.parseForOfConditions = void 0;
exports.prepareTokens = exports.addInvalidTokenError = exports.addParsingError = exports.skipTokens = exports.parseTokenSequences = exports.checkTokenSequences = void 0;
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
// && operator doesn't work in if (condition) statement
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
        var moduleContentResult = (0, exports.parseModuleContent)(state);
        if (moduleContentResult) {
            state = moduleContentResult.state;
            if (moduleContentResult.result) {
                programContent = [
                    ...programContent,
                    moduleContentResult.result
                ];
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
const parseModuleContent = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // if whole line commented, skip it
    if (state.cursor === 0 || (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endline], -1)) {
        let oldPos = state.cursor;
        state = (0, exports.skipComments)(state, false, false);
        if (state.cursor > oldPos) {
            if ((0, exports.isEndOfFile)(state)) {
                return {
                    state,
                    result: undefined
                };
            }
            if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endline])) {
                // this is an empty commented line. skip it
                if (!(0, exports.isEndOfFile)(state)) {
                    state = (0, exports.skipTokens)(state, 1);
                }
                return {
                    state,
                    result: undefined
                };
            }
        }
    }
    state = (0, exports.skipComments)(state, false, false);
    // parse outer expression
    let outerExpressionResult = (0, exports.parseOuterStatement)(state);
    if (outerExpressionResult) {
        return outerExpressionResult;
    }
    // parse text line
    let textLineResult = (0, exports.parseTextLineStatement)(state);
    if (textLineResult) {
        return textLineResult;
    }
    // otherwise we don't know what it is
    return undefined;
};
exports.parseModuleContent = parseModuleContent;
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
const parseOperator = (state) => {
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
const parseOperatorOfType = (state, operatorTypes) => {
    if ((0, exports.isEndOfFile)(state) || !operatorTypes) {
        return undefined;
    }
    let operatorResult = (0, exports.parseOperator)(state);
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
const parseBinaryOperator = (state) => {
    return (0, exports.parseOperatorOfType)(state, [
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
const parseUnaryOperatorPrefix = (state) => {
    return (0, exports.parseOperatorOfType)(state, [
        OperatorType_1.OperatorType.SpreadAssign,
        OperatorType_1.OperatorType.PlusPlus,
        OperatorType_1.OperatorType.MinusMinus,
        OperatorType_1.OperatorType.Not,
        OperatorType_1.OperatorType.Minus
    ]);
};
exports.parseUnaryOperatorPrefix = parseUnaryOperatorPrefix;
const parseUnaryOperatorPostfix = (state) => {
    return (0, exports.parseOperatorOfType)(state, [
        OperatorType_1.OperatorType.PlusPlus,
        OperatorType_1.OperatorType.MinusMinus
    ]);
};
exports.parseUnaryOperatorPostfix = parseUnaryOperatorPostfix;
const parseKeyword = (state) => {
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
const parseDebuggerKeyword = (state) => {
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Debugger]);
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
const parseKeywordOfType = (state, keywordTypes) => {
    let keywordResult = (0, exports.parseKeyword)(state);
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
const parseCommentLine = (state) => {
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
const parseCommentBlock = (state) => {
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
// literals
const parseLiteral = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // number
    let numberResult = (0, exports.parseNumberLiteral)(state);
    if (numberResult) {
        return numberResult;
    }
    // boolean
    let booleanResult = (0, exports.parseBooleanLiteral)(state);
    if (booleanResult) {
        return booleanResult;
    }
    // string
    let stringResult = (0, exports.parseStringLiteral)(state);
    if (stringResult) {
        return stringResult;
    }
    // array
    let arrayResult = (0, exports.parseArrayLiteral)(state);
    if (arrayResult) {
        return arrayResult;
    }
    return undefined;
};
exports.parseLiteral = parseLiteral;
const parseNumberLiteral = (state) => {
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
const parseStringLiteral = (state, allowIncludes = true) => {
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
        let stringItem = (0, exports.parseStringLiteralItem)(state, allowIncludes);
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
const parseStringLiteralItem = (state, allowIncludes = true) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse include
    if (allowIncludes) {
        let stringIncludeResult = (0, exports.parseStringInclude)(state);
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
const parseStringInclude = (state) => {
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
    let nextState = (0, exports.skipComments)(state, true, false);
    if (nextState && nextState.cursor > state.cursor) {
        return undefined;
    }
    // parse expression
    let expression = undefined;
    let expressionResult = (0, exports.parseExpression)(state, false);
    if (expressionResult) {
        expression = expressionResult.result;
        state = expressionResult.state;
    }
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
    let result = astFactory_1.astFactory.stringIncludeStatement(expression, start, end);
    return {
        state,
        result
    };
};
exports.parseStringInclude = parseStringInclude;
const parseBooleanLiteral = (state) => {
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
const parseArrayLiteral = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse array scope
    let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BracketOpen]), (state) => (0, exports.parseStatement)(state, true), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BracketClose]), (state) => (0, exports.skipComments)(state, true, true), undefined, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Comma]));
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
const parseArrayItem = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // literal
    let literalResult = (0, exports.parseLiteral)(state);
    if (literalResult) {
        return literalResult;
    }
    // expression
    let expressionResult = (0, exports.parseExpression)(state, true);
    if (expressionResult) {
        return expressionResult;
    }
    return undefined;
};
exports.parseArrayItem = parseArrayItem;
// identifiers
const parseIdentifier = (state) => {
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
    // prepare result
    let result = astFactory_1.astFactory.identifier(variableName, start, (0, exports.getCursorPosition)(state));
    return {
        state,
        result
    };
};
exports.parseIdentifier = parseIdentifier;
const parseIdentifierScope = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Prime]), (state) => (0, exports.parseStringLiteralItem)(state, true), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Prime]));
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
const parseRawIdentifier = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // check @ mark
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.AtSign])) {
        let start = (0, exports.getCursorPosition)(state);
        state = (0, exports.skipTokens)(state, 1);
        // identifier scope
        let identScopeResult = (0, exports.parseIdentifierScope)(state);
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
        let identifierResult = (0, exports.parseIdentifier)(state);
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
const parseAnyIdentifier = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let rawIndentifierResult = (0, exports.parseRawIdentifier)(state);
    if (rawIndentifierResult) {
        return rawIndentifierResult;
    }
    let identifierScopeResult = (0, exports.parseIdentifierScope)(state);
    if (identifierScopeResult) {
        return identifierScopeResult;
    }
    let identifierResult = (0, exports.parseIdentifier)(state);
    if (identifierResult) {
        return identifierResult;
    }
    return undefined;
};
exports.parseAnyIdentifier = parseAnyIdentifier;
const parseContextIdentifier = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let identifierResult = (0, exports.parseAnyIdentifier)(state);
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
const parseOperandIdentifier = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // raw identifier
    let rawResult = (0, exports.parseRawIdentifier)(state);
    if (rawResult) {
        return rawResult;
    }
    // context identifier
    let contextResult = (0, exports.parseContextIdentifier)(state);
    if (contextResult) {
        return contextResult;
    }
    return undefined;
};
exports.parseOperandIdentifier = parseOperandIdentifier;
// declarations
const parseFunctionDeclaration = (state, isMultiline) => {
    let functionResult = (0, exports.parseSimpleFunctionDeclaration)(state, isMultiline);
    if (functionResult) {
        return functionResult;
    }
    let lambdaResult = (0, exports.parseLambdaFunctionDeclaration)(state, isMultiline);
    if (lambdaResult) {
        return lambdaResult;
    }
    return undefined;
};
exports.parseFunctionDeclaration = parseFunctionDeclaration;
const parseSimpleFunctionDeclaration = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse function (args) {operations...}
    // save start point
    let start = (0, exports.getCursorPosition)(state);
    // parse async
    let isAsync = false;
    let asyncResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Async]);
    if (asyncResult) {
        state = asyncResult.state;
        isAsync = true;
    }
    // parse keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Function]);
    if (!keywordResult) {
        return undefined;
    }
    state = keywordResult.state;
    // parse function params scope
    let paramsScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseAnyIdentifier)(state), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, true), undefined, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Comma]));
    if (!paramsScopeResult) {
        return undefined;
    }
    // extract function arguments
    state = paramsScopeResult.state;
    let args = [];
    if (paramsScopeResult.result) {
        args = paramsScopeResult.result.content || [];
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, isMultiline);
    // parse function body
    // let blockScopeResult = parseBlockStatement(state);
    let blockScopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceOpen]), (state) => (0, exports.parseStatement)(state, true), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceClose]), (state) => (0, exports.skipComments)(state, true, true), undefined, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Semicolon]));
    let body;
    if (blockScopeResult) {
        state = blockScopeResult.state;
        let blockScope = blockScopeResult.result;
        body = astFactory_1.astFactory.blockStatement(blockScope.content, blockScope.start, blockScope.end);
    }
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.functionDeclaration(args, body, false, isAsync, start, end);
    return {
        state,
        result
    };
};
exports.parseSimpleFunctionDeclaration = parseSimpleFunctionDeclaration;
const parseLambdaFunctionDeclaration = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse function (args) {operations...}
    // save start point
    let start = (0, exports.getCursorPosition)(state);
    // parse async
    let isAsync = false;
    let asyncResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Async]);
    if (asyncResult) {
        state = asyncResult.state;
        isAsync = true;
    }
    // parse function params scope
    let paramsScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseAnyIdentifier)(state), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, true), undefined, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Comma]));
    if (!paramsScopeResult) {
        return undefined;
    }
    state = paramsScopeResult.state;
    state = (0, exports.skipComments)(state, true, isMultiline);
    // parse =>
    let arrowResult = (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Equals, CodeTokenType_1.CodeTokenType.TupleClose]);
    if (!arrowResult) {
        return undefined;
    }
    state = arrowResult.state;
    // extract function arguments
    let args = [];
    if (paramsScopeResult.result) {
        args = paramsScopeResult.result.content || [];
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, isMultiline);
    // parse function body
    // let blockScopeResult = parseBlockStatement(state);
    let blockScopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceOpen]), (state) => (0, exports.parseStatement)(state, true), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceClose]), (state) => (0, exports.skipComments)(state, true, true), undefined, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Semicolon]));
    let body;
    if (blockScopeResult) {
        state = blockScopeResult.state;
        let blockScope = blockScopeResult.result;
        body = astFactory_1.astFactory.blockStatement(blockScope.content, blockScope.start, blockScope.end);
    }
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.functionDeclaration(args, body, true, isAsync, start, end);
    return {
        state,
        result
    };
};
exports.parseLambdaFunctionDeclaration = parseLambdaFunctionDeclaration;
const parseVariableDeclaration = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // save start position
    let start = (0, exports.getCursorPosition)(state);
    // var|let|const Identifier = Expression
    // parse keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Var, KeywordType_1.KeywordType.Let, KeywordType_1.KeywordType.Const, KeywordType_1.KeywordType.Class]);
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
    // following algorithm can be broken by semicolon or endline, so let's wrap it in while scope that we can easilly break
    let identifier = undefined;
    let initValue = undefined;
    do {
        // check end of statement
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // skip comments and whitespace
        state = (0, exports.skipComments)(state, true, false);
        // check end of statement
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse identifier
        let identifierResult = (0, exports.parseAnyIdentifier)(state);
        if (identifierResult) {
            state = identifierResult.state;
            identifier = identifierResult.result;
        }
        // check end of statement
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // skip comments and whitespace
        state = (0, exports.skipComments)(state, true, false);
        // check end of statement
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse equals
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Equals])) {
            /// skip equals token
            state = (0, exports.skipTokens)(state, 1);
            // check end of statement
            if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
                break;
            }
            // skip comments and whitespace
            state = (0, exports.skipComments)(state, true, false);
            // check end of statement
            if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
                break;
            }
            // parse init value expression
            let expressionResult = (0, exports.parseExpression)(state, isMultiline);
            if (expressionResult) {
                state = expressionResult.state;
                initValue = expressionResult.result;
            }
        }
    } while (false);
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.variableDeclaration(identifier, kind, initValue, start, end);
    return {
        state,
        result
    };
};
exports.parseVariableDeclaration = parseVariableDeclaration;
const parsePropertyDeclaration = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // identifier : value
    // identifier
    let identifier = undefined;
    let stringResult = (0, exports.parseStringLiteral)(state, false);
    if (stringResult) {
        identifier = stringResult.result;
        state = stringResult.state;
    }
    else {
        let identifierResult = (0, exports.parseAnyIdentifier)(state);
        if (identifierResult) {
            state = identifierResult.state;
            identifier = identifierResult.result;
        }
        else {
            return undefined;
        }
    }
    let finalState = state;
    let breakTokens = [CodeTokenType_1.CodeTokenType.Semicolon];
    let initValue = undefined;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespace
        let prevState = state;
        state = (0, exports.skipComments)(state, true, true);
        if (state.cursor > prevState.cursor) {
            continue;
        }
        // colon
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Colon])) {
            // skip colon
            state = (0, exports.skipTokens)(state, 1);
            // skip comments and whitespace
            state = (0, exports.skipComments)(state, true, true);
            let functionResult = (0, exports.parseFunctionDeclaration)(state, true);
            if (functionResult) {
                state = functionResult.state;
                initValue = functionResult.result;
                finalState = state;
                break;
            }
            // parse expression
            let expressionResult = (0, exports.parseExpression)(state, true);
            if (expressionResult) {
                state = expressionResult.state;
                initValue = expressionResult.result;
                finalState = state;
            }
        }
        break;
    }
    state = finalState;
    // skip comments and whitespace
    state = (0, exports.skipComments)(state, true, true);
    // skip comma
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Comma])) {
        state = (0, exports.skipTokens)(state, 1);
        finalState = state;
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.propertyDeclaration(identifier, initValue, start, end);
    return {
        result,
        state
    };
};
exports.parsePropertyDeclaration = parsePropertyDeclaration;
// statements
const parseStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // var declaration
    let varDeclarResult = (0, exports.parseVariableDeclaration)(state, isMultiline);
    if (varDeclarResult) {
        return varDeclarResult;
    }
    // break
    let breakResult = (0, exports.parseBreakStatement)(state);
    if (breakResult) {
        return breakResult;
    }
    // return
    let returnResult = (0, exports.parseReturnStatement)(state, isMultiline);
    if (returnResult) {
        return returnResult;
    }
    // continue
    let continueResult = (0, exports.parseContinueStatement)(state);
    if (continueResult) {
        return continueResult;
    }
    // if
    let ifResult = (0, exports.parseIfStatement)(state, isMultiline);
    if (ifResult) {
        return ifResult;
    }
    // switch
    let switchResult = (0, exports.parseSwitchStatement)(state, isMultiline);
    if (switchResult) {
        return switchResult;
    }
    // while
    let whileResult = (0, exports.parseWhileStatement)(state, isMultiline);
    if (whileResult) {
        return whileResult;
    }
    // doWhile
    let doWhileResult = (0, exports.parseDoWhileStatement)(state, isMultiline);
    if (doWhileResult) {
        return doWhileResult;
    }
    // for of
    let forOfResult = (0, exports.parseForOfStatement)(state, isMultiline);
    if (forOfResult) {
        return forOfResult;
    }
    // for in
    let forInResult = (0, exports.parseForInStatement)(state, isMultiline);
    if (forInResult) {
        return forInResult;
    }
    // for
    let forResult = (0, exports.parseForStatement)(state, isMultiline);
    if (forResult) {
        return forResult;
    }
    // import
    let importResult = (0, exports.parseImportStatement)(state);
    if (importResult) {
        return importResult;
    }
    // try
    let tryResult = (0, exports.parseTryStatement)(state, isMultiline);
    if (tryResult) {
        return tryResult;
    }
    // catch
    let catchResult = (0, exports.parseCatchStatement)(state, isMultiline);
    if (catchResult) {
        return catchResult;
    }
    // finally
    let finallyResult = (0, exports.parseFinallyStatement)(state, isMultiline);
    if (finallyResult) {
        return finallyResult;
    }
    // debugger keyword
    let debuggerKeywordResult = (0, exports.parseDebuggerKeyword)(state);
    if (debuggerKeywordResult) {
        return debuggerKeywordResult;
    }
    // throw statement
    let throwStatementResult = (0, exports.parseThrowStatement)(state, isMultiline);
    if (throwStatementResult) {
        return throwStatementResult;
    }
    // expression
    let expressionResult = (0, exports.parseExpression)(state, false);
    if (expressionResult) {
        return expressionResult;
    }
    return undefined;
};
exports.parseStatement = parseStatement;
const parseBreakStatement = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // parse keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Break]);
    if (!keywordResult) {
        return undefined;
    }
    state = keywordResult.state;
    // skip whitespace
    state = (0, exports.skipWhitespace)(state, false);
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
    let result = astFactory_1.astFactory.breakStatement(start, end);
    return {
        result,
        state
    };
};
exports.parseBreakStatement = parseBreakStatement;
const parseReturnStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // parse return keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Return]);
    if (!keywordResult) {
        return undefined;
    }
    state = keywordResult.state;
    // skip comments and whitespace
    state = (0, exports.skipComments)(state, true, isMultiline);
    // parse return expression
    let expression = undefined;
    let expressionResult = (0, exports.parseExpression)(state, isMultiline);
    if (expressionResult) {
        expression = expressionResult.result;
        state = expressionResult.state;
    }
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
    let result = astFactory_1.astFactory.returnStatement(expression, start, end);
    return {
        result,
        state
    };
};
exports.parseReturnStatement = parseReturnStatement;
const parseDeleteExpression = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // parse return keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Delete]);
    if (!keywordResult) {
        return undefined;
    }
    state = keywordResult.state;
    // skip comments and whitespace
    state = (0, exports.skipComments)(state, true, isMultiline);
    // parse expression of delete
    let expression = undefined;
    let expressionResult = (0, exports.parseExpression)(state, isMultiline);
    if (expressionResult) {
        expression = expressionResult.result;
        state = expressionResult.state;
    }
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.deleteExpression(expression, start, end);
    return {
        result,
        state
    };
};
exports.parseDeleteExpression = parseDeleteExpression;
const parseTypeofExpression = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // parse return keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Typeof]);
    if (!keywordResult) {
        return undefined;
    }
    state = keywordResult.state;
    // skip comments and whitespace
    state = (0, exports.skipComments)(state, true, isMultiline);
    // parse expression of delete
    let expression = undefined;
    let expressionResult = (0, exports.parseExpression)(state, isMultiline);
    if (expressionResult) {
        expression = expressionResult.result;
        state = expressionResult.state;
    }
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.typeofExpression(expression, start, end);
    return {
        result,
        state
    };
};
exports.parseTypeofExpression = parseTypeofExpression;
const parseContinueStatement = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // parse keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Continue]);
    if (!keywordResult) {
        return undefined;
    }
    state = keywordResult.state;
    // skip whitespace
    state = (0, exports.skipWhitespace)(state, false);
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
const parseBlockStatement = (state) => {
    let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceOpen]), (state) => (0, exports.parseStatement)(state, true), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceClose]), (state) => {
        if (!state) {
            return state;
        }
        while (!(0, exports.isEndOfFile)(state)) {
            state = (0, exports.skipComments)(state, true, true);
            if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endline, CodeTokenType_1.CodeTokenType.Semicolon])) {
                state = (0, exports.skipTokens)(state, 1);
                continue;
            }
            break;
        }
        return state;
    });
    if (!scopeResult || !scopeResult.result) {
        return undefined;
    }
    // prepare result
    let scope = scopeResult.result;
    let scopeContent = scope.content;
    state = scopeResult.state;
    let result = astFactory_1.astFactory.blockStatement(scopeContent, scope.start, scope.end);
    return {
        state,
        result
    };
};
exports.parseBlockStatement = parseBlockStatement;
const parseIfStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let condition = undefined;
    let thenProgram = undefined;
    let elseProgram = undefined;
    let finalState = undefined;
    let ifResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.If]);
    if (!ifResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = ifResult.state;
    finalState = state;
    // prepare break tokens that will break the statement
    let breakTokens = isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    // parse until break tokens
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse condition
        let conditionScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseExpression)(state, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, isMultiline));
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
        state = (0, exports.skipComments)(state, true, isMultiline);
        // skip everything until { or else or breakTokens
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) && !(0, exports.parseKeyword)(state));
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse then body
        let codeBlockResult = (0, exports.parseBlockStatement)(state);
        if (codeBlockResult) {
            thenProgram = codeBlockResult.result;
            state = codeBlockResult.state;
            finalState = state;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // skip everything until else or breakTokens
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, breakTokens) && !(0, exports.parseKeyword)(state));
        // parse else
        let elseResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Else]);
        if (elseResult) {
            state = elseResult.state;
            finalState = state;
            // skip comments and whitespaces
            state = (0, exports.skipComments)(state, true, isMultiline);
            // skip everything until { or else or breakTokens
            state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) && !(0, exports.parseKeyword)(state));
            // check sequence end
            if ((0, exports.getTokenOfType)(state, breakTokens)) {
                break;
            }
            // parse else body
            if ((0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.If])) {
                // this is nested if statement
                let nestedIfResult = (0, exports.parseIfStatement)(state, isMultiline);
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
                let codeBlockResult = (0, exports.parseBlockStatement)(state);
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
const parseSwitchStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let condition = undefined;
    let cases;
    let finalState = undefined;
    let switchResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Switch]);
    if (!switchResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = switchResult.state;
    finalState = state;
    // prepare break tokens that will break the statement
    let breakTokens = isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    // parse until break tokens
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse condition
        let conditionScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseExpression)(state, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, isMultiline));
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
        state = (0, exports.skipComments)(state, true, isMultiline);
        // skip everything until { or else or breakTokens
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) && !(0, exports.parseKeyword)(state));
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // parse swich body
        let bodyResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, true), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceOpen]), (state) => {
            // skip comments and whitespaces
            state = (0, exports.skipComments)(state, true, true);
            // case
            let caseResult = (0, exports.parseCaseStatement)(state);
            if (caseResult) {
                return caseResult;
            }
            // default case
            let defaultCaseResult = (0, exports.parseDefaultCaseStatement)(state);
            if (defaultCaseResult) {
                return defaultCaseResult;
            }
            return undefined;
        }, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.BraceClose]), (state) => (0, exports.skipComments)(state, true, isMultiline));
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
const parseCaseStatement = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse case keyword
    let caseResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Case]);
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
    state = (0, exports.skipComments)(state, true, true);
    let finalState = state;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse condition
        let conditionResult = (0, exports.parseExpression)(state, true);
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
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.Colon]));
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Colon])) {
            state = (0, exports.skipTokens)(state, 1);
        }
        // parse statements until break token or case or default or return keywords
        while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens) && !(0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Case, KeywordType_1.KeywordType.Default, KeywordType_1.KeywordType.Return, KeywordType_1.KeywordType.Break])) {
            // parse body statement
            let bodyStatementResult = (0, exports.parseStatement)(state, true);
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
            state = (0, exports.skipComments)(state, true, true);
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
        state = (0, exports.skipComments)(state, true, true);
        // skip everything until break tokens or keyword
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens]) && !(0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Case, KeywordType_1.KeywordType.Default, KeywordType_1.KeywordType.Return, KeywordType_1.KeywordType.Break]));
        // parse consequent
        // parse retrun or break statements
        let breakStatementResult = (0, exports.parseBreakStatement)(state);
        if (breakStatementResult) {
            consequent = breakStatementResult.result;
            state = breakStatementResult.state;
            finalState = state;
        }
        else {
            let returnStatementResult = (0, exports.parseReturnStatement)(state, true);
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
const parseDefaultCaseStatement = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse default keyword
    let defaultResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Default]);
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
    state = (0, exports.skipComments)(state, true, true);
    let finalState = state;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse :
        // skip everything until : or break token
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.Colon]));
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Colon])) {
            state = (0, exports.skipTokens)(state, 1);
        }
        // parse statements until break token or case or default or return keywords
        while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens) && !(0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Case, KeywordType_1.KeywordType.Default, KeywordType_1.KeywordType.Return, KeywordType_1.KeywordType.Break])) {
            // parse body statement
            let bodyStatementResult = (0, exports.parseStatement)(state, true);
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
            state = (0, exports.skipComments)(state, true, true);
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
        state = (0, exports.skipComments)(state, true, true);
        // skip everything until break tokens or keyword
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens]) && !(0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Case, KeywordType_1.KeywordType.Default, KeywordType_1.KeywordType.Return, KeywordType_1.KeywordType.Break]));
        // parse consequent
        // parse retrun or break statements
        let breakStatementResult = (0, exports.parseBreakStatement)(state);
        if (breakStatementResult) {
            consequent = breakStatementResult.result;
            state = breakStatementResult.state;
            finalState = state;
        }
        else {
            let returnStatementResult = (0, exports.parseReturnStatement)(state, true);
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
const parseDoWhileStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let condition = undefined;
    let bodyProgram = undefined;
    let finalState = undefined;
    let doResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Do]);
    if (!doResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = doResult.state;
    finalState = state;
    // prepare break tokens that will break the statement
    let breakTokens = isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    // parse until break tokens
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // skip everything until { or breakTokens or while
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) && !(0, exports.parseKeyword)(state));
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse body program
        let codeBlockResult = (0, exports.parseBlockStatement)(state);
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
        state = (0, exports.skipComments)(state, true, isMultiline);
        // skip everything until ( or breakTokens or while
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.ParenOpen]) && !(0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.While]));
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse while
        let whileResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.While]);
        if (whileResult) {
            state = whileResult.state;
            finalState = state;
            // check sequence end
            if ((0, exports.getTokenOfType)(state, breakTokens)) {
                break;
            }
            // skip comments and whitespaces
            state = (0, exports.skipComments)(state, true, isMultiline);
            // skip everything until ( or breakTokens or while
            state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.ParenOpen]) && !(0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.While]));
            // check sequence end
            if ((0, exports.getTokenOfType)(state, breakTokens)) {
                break;
            }
            // parse condition
            let conditionScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseExpression)(state, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, isMultiline));
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
const parseWhileStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let condition = undefined;
    let bodyProgram = undefined;
    let finalState = undefined;
    let whileResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.While]);
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
    let breakTokens = isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    // parse until break tokens
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse condition
        let conditionScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseExpression)(state, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, true));
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
        state = (0, exports.skipComments)(state, true, isMultiline);
        // skip everything until { or else or breakTokens
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) && !(0, exports.parseKeyword)(state));
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        codeBlockStart = (0, exports.getCursorPosition)(state);
        // parse body program
        let codeBlockResult = (0, exports.parseBlockStatement)(state);
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
const parseForStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let init = undefined;
    let test = undefined;
    let update = undefined;
    let bodyProgram = undefined;
    let finalState = undefined;
    let forResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.For]);
    if (!forResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = forResult.state;
    finalState = state;
    // prepare break tokens that will break the statement
    let breakTokens = isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    // parse until break tokens
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse condition
        let conditionScopeResult = (0, exports.parseScope)((0, exports.skipComments)(state, true, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseStatement)(state, isMultiline), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => {
            // comments
            let cursor = state.cursor;
            state = (0, exports.skipComments)(state, true, isMultiline);
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
        state = (0, exports.skipComments)(state, true, isMultiline);
        // skip everything until { or else or breakTokens
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen]) && !(0, exports.parseKeyword)(state));
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse body program
        let codeBlockResult = (0, exports.parseBlockStatement)(state);
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
const parseForCoditions = (state) => {
    let result = {
        init: undefined,
        test: undefined,
        update: undefined
    };
    // parse init statement
    let initStatementResult = (0, exports.parseExpression)(state, true);
    if (initStatementResult) {
        state = initStatementResult.state;
        result = Object.assign(Object.assign({}, result), { init: initStatementResult.result });
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, true);
    // everything until ; or ) are errors
    state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Semicolon, CodeTokenType_1.CodeTokenType.ParenClose]));
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
    state = (0, exports.skipComments)(state, true, true);
    let testExpressionResult = (0, exports.parseExpression)(state, true);
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
    let updateStatementResult = (0, exports.parseExpression)(state, true);
    if (updateStatementResult) {
        state = updateStatementResult.state;
        result = Object.assign(Object.assign({}, result), { update: updateStatementResult.result });
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, true);
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
const parseConditionBlock = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse open paren
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenOpen])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, true);
    // parse expression
    let expressionResult = (0, exports.parseExpression)(state, true);
    let expression = undefined;
    if (expressionResult) {
        expression = expressionResult.result;
        state = expressionResult.state;
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, true);
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
const parseForInConditions = (state) => {
    // parse left expression
    let variable = undefined;
    // parse identifier
    let identifierResult = (0, exports.parseOperandIdentifier)(state);
    if (identifierResult) {
        state = identifierResult.state;
        variable = identifierResult.result;
    }
    else {
        // if no identifier, parse variable declaration
        let varDeclarationResult = (0, exports.parseVariableDeclaration)(state, true);
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
        state = (0, exports.skipComments)(state, true, true);
        // check in keyword
        let inResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.In]);
        if (inResult) {
            state = inResult.state;
        }
        else {
            // if there is no in keyword
            return undefined;
        }
        finalState = state;
        state = (0, exports.skipComments)(state, true, true);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse right expression
        let exprResult = (0, exports.parseExpression)(state, true);
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
const parseForOfConditions = (state) => {
    // parse left expression
    let variable = undefined;
    // parse identifier
    let identifierResult = (0, exports.parseOperandIdentifier)(state);
    if (identifierResult) {
        state = identifierResult.state;
        variable = identifierResult.result;
    }
    else {
        // if no identifier, parse variable declaration
        let varDeclarationResult = (0, exports.parseVariableDeclaration)(state, true);
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
        state = (0, exports.skipComments)(state, true, true);
        // check of keyword
        let inResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Of]);
        if (inResult) {
            state = inResult.state;
        }
        else {
            // if there is no of keyword
            return undefined;
        }
        finalState = state;
        state = (0, exports.skipComments)(state, true, true);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse right expression
        let exprResult = (0, exports.parseExpression)(state, true);
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
const parseForInStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse for (initStatement; in updateStatement) {body}
    let forResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.For]);
    if (!forResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = forResult.state;
    // skip comments and whitespases
    state = (0, exports.skipComments)(state, true, isMultiline);
    // parse condition block
    // parse open paren (
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenOpen])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    let finalState = state;
    // prepare break tokens
    let breakTokens = [CodeTokenType_1.CodeTokenType.Semicolon];
    breakTokens = isMultiline ? breakTokens : [...breakTokens, CodeTokenType_1.CodeTokenType.Endline];
    // parse for in body
    let variable;
    let expression;
    let bodyProgram;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // parse for conditions
        let conditionsResult = (0, exports.parseForInConditions)(state);
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
        state = (0, exports.skipComments)(state, true, true);
        // parse error tokens everything until )
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose]));
        finalState = state;
        // parse and skip ) token
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose])) {
            state = (0, exports.skipTokens)(state, 1);
            finalState = state;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // now it's time to parse body code block
        // skip everything until code block open token
        let bodyErrorTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen];
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, bodyErrorTokens));
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse body code block
        let codeBlockResult = (0, exports.parseBlockStatement)(state);
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
const parseForOfStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse for (initStatement; in updateStatement) {body}
    let forResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.For]);
    if (!forResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = forResult.state;
    // skip comments and whitespases
    state = (0, exports.skipComments)(state, true, isMultiline);
    // parse condition block
    // parse open paren (
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenOpen])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    let finalState = state;
    // prepare break tokens
    let breakTokens = [CodeTokenType_1.CodeTokenType.Semicolon];
    breakTokens = isMultiline ? breakTokens : [...breakTokens, CodeTokenType_1.CodeTokenType.Endline];
    // parse for of body
    let variable;
    let expression;
    let bodyProgram;
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // parse for conditions
        let conditionsResult = (0, exports.parseForOfConditions)(state);
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
        state = (0, exports.skipComments)(state, true, true);
        // parse error tokens everything until )
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose]));
        finalState = state;
        // parse and skip ) token
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.ParenClose])) {
            state = (0, exports.skipTokens)(state, 1);
            finalState = state;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // now it's time to parse body code block
        // skip everything until code block open token
        let bodyErrorTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.BraceOpen];
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, bodyErrorTokens));
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse body code block
        let codeBlockResult = (0, exports.parseBlockStatement)(state);
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
const parseImportStatement = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // import [variable] as [alias] from [path]$
    // import in [variable] as [alias] from [path]$
    // parse import
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Import]);
    if (!keywordResult) {
        return undefined;
    }
    state = keywordResult.state;
    state = (0, exports.skipComments)(state, true);
    // check if there is a 'in' variable next to the 'import': import in * as varname from "path"
    let isImportInContext = false;
    let inKeywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.In]);
    if (inKeywordResult) {
        isImportInContext = true;
        state = inKeywordResult.state;
        state = (0, exports.skipComments)(state, true);
    }
    // parse variable until $, as, from, operator
    let variableStart = (0, exports.getCursorPosition)(state);
    let variableEnd = Object.assign({}, variableStart);
    let alias;
    // parse star
    let starToken = (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Star]);
    if (starToken) {
        state = (0, exports.skipTokens)(state, 1);
        variableEnd = (0, exports.getCursorPosition)(state);
        alias = astFactory_1.astFactory.identifier(starToken.value, variableStart, variableEnd);
    }
    else {
        // if not star then parse variable
        let variableResult = (0, exports.parseAnyIdentifier)(state);
        if (variableResult) {
            state = variableResult.state;
            alias = variableResult.result;
        }
    }
    // parsing error if no varname
    if (!alias) {
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "variable name expected", variableEnd, variableEnd);
    }
    // parse alias
    state = (0, exports.skipComments)(state, true);
    let aliasAst = undefined;
    let asResult = (0, exports.getToken)(state);
    if (asResult && asResult.value === "as") {
        state = (0, exports.skipTokens)(state, 1);
        // parse alias until $, from, operator
        state = (0, exports.skipComments)(state, true);
        let varAliasResult = (0, exports.parseOperandIdentifier)(state);
        if (varAliasResult) {
            state = varAliasResult.state;
            aliasAst = varAliasResult.result;
        }
        else {
            // if we have as keyword but no alias name, add parsing error
            state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "alias name expected", (0, exports.getCursorPosition)(state), (0, exports.getCursorPosition)(state));
        }
    }
    // parse from
    state = (0, exports.skipComments)(state, true);
    let importPathAst = undefined;
    let fromResult = (0, exports.getToken)(state);
    if (fromResult && fromResult.value === "from") {
        state = (0, exports.skipTokens)(state, 1);
        state = (0, exports.skipComments)(state, true);
        // parse import path
        let importPathResult = (0, exports.parseImportPath)(state);
        if (importPathResult && importPathResult.result) {
            state = importPathResult.state;
            importPathAst = importPathResult.result;
        }
        else {
            // no import path found
            state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "Import path expected", (0, exports.getCursorPosition)(state), (0, exports.getCursorPosition)(state));
        }
    }
    else {
        // no from closure
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "from keyword expected", (0, exports.getCursorPosition)(state), (0, exports.getCursorPosition)(state));
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
    let result = astFactory_1.astFactory.importStatement(alias, aliasAst, isImportInContext, importPathAst, start, (0, exports.getCursorPosition)(state));
    // add import statement to the imports registry
    state = Object.assign(Object.assign({}, state), { imports: [...state.imports, result] });
    return {
        result,
        state
    };
};
exports.parseImportStatement = parseImportStatement;
const parseImportPath = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let expressionResult = (0, exports.parseExpression)(state, false);
    if (expressionResult) {
        return expressionResult;
    }
    let stringResult = (0, exports.parseStringLiteral)(state);
    if (stringResult) {
        return stringResult;
    }
    let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Prime]), (state) => (0, exports.parseStringLiteralItem)(state, true), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.Prime]));
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
const parseTryStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse try
    let tryResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Try]);
    if (!tryResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = tryResult.state;
    let finalState = state;
    let body = undefined;
    let catchClause = undefined;
    let finallyBlock = undefined;
    let breakTokens = isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, isMultiline);
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse code block
        let codeBlockResult = (0, exports.parseBlockStatement)(state);
        if (codeBlockResult) {
            state = codeBlockResult.state;
            body = codeBlockResult.result;
            finalState = state;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) && (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse catch
        let catchResult = (0, exports.parseCatchStatement)(state, isMultiline);
        if (catchResult) {
            state = catchResult.state;
            catchClause = catchResult.result;
            finalState = state;
        }
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) && (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse finally
        let finallyResult = (0, exports.parseFinallyStatement)(state, isMultiline);
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
const parseCatchStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // catch (varDeclaration) {body}
    // parse catch keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Catch]);
    if (!keywordResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = keywordResult.state;
    let finalState = state;
    let body = undefined;
    let varDeclaration = undefined;
    let breakTokens = isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, isMultiline);
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse (identifier)
        let scopeResult = (0, exports.parseScope)(state, (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenOpen]), (state) => (0, exports.parseOperandIdentifier)(state), (state) => (0, exports.parseTokenSequence)(state, [CodeTokenType_1.CodeTokenType.ParenClose]), (state) => (0, exports.skipComments)(state, true, true));
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
        state = (0, exports.skipComments)(state, true, isMultiline);
        // check break tokens
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // parse body
        let bodyResult = (0, exports.parseBlockStatement)(state);
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
const parseFinallyStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // finally {body}
    // parse finally keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Finally]);
    if (!keywordResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = keywordResult.state;
    let finalState = state;
    let body = undefined;
    let breakTokens = isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, isMultiline);
    // check break tokens
    if (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // parse body
        let bodyResult = (0, exports.parseBlockStatement)(state);
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
const parseThrowStatement = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse throw keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Throw]);
    if (!keywordResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = keywordResult.state;
    let finalState = state;
    let breakTokens = isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    let expression = undefined;
    // parse expression
    if (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // parse expression
        let expressionResult = (0, exports.parseExpression)(state, isMultiline);
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
// expression statements
const parseExpression = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse new expression
    let newExpressionResult = (0, exports.parseNewExpression)(state, isMultiline);
    if (newExpressionResult) {
        return newExpressionResult;
    }
    // delete expression
    let deleteResult = (0, exports.parseDeleteExpression)(state, isMultiline);
    if (deleteResult) {
        return deleteResult;
    }
    // typeof expression
    let typeofResult = (0, exports.parseTypeofExpression)(state, isMultiline);
    if (typeofResult) {
        return typeofResult;
    }
    // lambda expression
    let lambdaExpression = (0, exports.parseLambdaFunctionDeclaration)(state, isMultiline);
    if (lambdaExpression) {
        return lambdaExpression;
    }
    // prefix
    let prefixStart = (0, exports.getCursorPosition)(state);
    // parse unary prefix
    let prefixOperatorResult = (0, exports.parseUnaryOperatorPrefix)(state);
    if (prefixOperatorResult) {
        state = prefixOperatorResult.state;
    }
    // parse first operand
    let operandResult = (0, exports.parseOperand)(state, isMultiline);
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
    if (!isMultiline) {
        breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Endline];
    }
    let finalState = state;
    while (!(0, exports.isEndOfFile)(state)) {
        if ((0, exports.getTokenOfType)(state, breakTokens)) {
            break;
        }
        // skip comments
        let curPos = state.cursor;
        state = (0, exports.skipComments)(state, true, isMultiline);
        if (state.cursor !== curPos) {
            continue;
        }
        // parse operation
        let operationResult = (0, exports.parseOperation)(state, result, isMultiline);
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
exports.parseExpression = parseExpression;
const parseOperand = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // literal
    let literalResult = (0, exports.parseLiteral)(state);
    if (literalResult) {
        return literalResult;
    }
    // function expression
    let funcExpression = (0, exports.parseFunctionDeclaration)(state, isMultiline);
    if (funcExpression != null) {
        return funcExpression;
    }
    // object expression
    let objectExpressionResult = (0, exports.parseObjectExpression)(state);
    if (objectExpressionResult) {
        return objectExpressionResult;
    }
    // paren expression
    let parenExpressionResult = (0, exports.parseParenExpression)(state);
    if (parenExpressionResult) {
        return parenExpressionResult;
    }
    // identifier
    let identifierResult = (0, exports.parseOperandIdentifier)(state);
    if (identifierResult) {
        return identifierResult;
    }
    // keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Null, KeywordType_1.KeywordType.Undefined, KeywordType_1.KeywordType.Await]);
    if (keywordResult) {
        return keywordResult;
    }
    return undefined;
};
exports.parseOperand = parseOperand;
const parseOperation = (state, leftOperand, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse member expression
    let memberResult = (0, exports.parseMemberExpression)(state, leftOperand, isMultiline);
    if (memberResult) {
        return memberResult;
    }
    // parse call expression
    let callResult = (0, exports.parseCallExpression)(state, leftOperand, isMultiline);
    if (callResult) {
        return callResult;
    }
    // parse indexer expression
    let indexerResult = (0, exports.parseIndexerExpression)(state, leftOperand, isMultiline);
    if (indexerResult) {
        return indexerResult;
    }
    // parse update expression
    let updateResult = (0, exports.parseUpdateExpressionPostfix)(state, leftOperand);
    if (updateResult) {
        return updateResult;
    }
    // parse binary expression
    let binaryResult = (0, exports.parseBinaryExpression)(state, leftOperand, isMultiline);
    if (binaryResult) {
        return binaryResult;
    }
    // parse conditional expression
    let conditionalExpressionResult = (0, exports.parseConditionalExpression)(state, leftOperand, isMultiline);
    if (conditionalExpressionResult) {
        return conditionalExpressionResult;
    }
    return undefined;
};
exports.parseOperation = parseOperation;
const parseParenExpression = (state) => {
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
    state = (0, exports.skipComments)(state, true, true);
    // parse expression
    let expression = undefined;
    let expressionResult = (0, exports.parseExpression)(state, true);
    if (expressionResult) {
        expression = expressionResult.result;
        state = expressionResult.state;
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, true);
    // skip everything until close token )
    state = (0, exports.parseErrorTokens)(state, (st) => !(0, exports.getTokenOfType)(st, [CodeTokenType_1.CodeTokenType.ParenClose]));
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
const parseObjectExpression = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // parse open brace
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.BraceOpen])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    // parse properties
    let properties = [];
    let finalState = state;
    do {
        // check end token
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.BraceClose])) {
            break;
        }
        let prevState = state;
        state = (0, exports.skipComments)(state, true, true);
        finalState = state;
        if (state.cursor > prevState.cursor) {
            continue;
        }
        // parse property
        let propertyResult = (0, exports.parsePropertyDeclaration)(state);
        if (propertyResult) {
            state = propertyResult.state;
            properties = [
                ...properties,
                propertyResult.result
            ];
            finalState = state;
            continue;
        }
        else {
            // if no property parsed
            // parse expression
            let expressionResult = (0, exports.parseStatement)(state, true);
            if (expressionResult) {
                state = expressionResult.state,
                    properties = [
                        ...properties,
                        expressionResult.result
                    ];
                finalState = state;
                continue;
            }
        }
        // skip separator
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Comma])) {
            state = (0, exports.skipTokens)(state, 1);
            continue;
        }
        // if we here, that means this is invalid token
        let errorStart = (0, exports.getCursorPosition)(state);
        let errorToken = (0, exports.getToken)(state);
        state = (0, exports.skipTokens)(state, 1);
        let errorEnd = (0, exports.getCursorPosition)(state);
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "Invalid token '" + errorToken.value || errorToken.type + "'", errorStart, errorEnd);
        finalState = state;
    } while (!(0, exports.isEndOfFile)(state));
    state = finalState;
    // parse close brace
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.BraceClose])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    // prepare result 
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.objectExpression(properties, start, end);
    return {
        state,
        result
    };
};
exports.parseObjectExpression = parseObjectExpression;
const parseCallExpression = (state, leftOperand, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, isMultiline);
    let start = (0, exports.getCursorPosition)(state);
    // parse function args
    let funcArgsResult = (0, exports.parseCallArguments)(state);
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
const parseCallArguments = (state) => {
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
        state = (0, exports.skipComments)(state, true, true);
        // parse expression
        let expressionResult = (0, exports.parseExpression)(state, true);
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
        let newState = (0, exports.skipComments)(state, true, true);
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
const parseIndexerExpression = (state, leftOperand, isMultiline) => {
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
    state = (0, exports.skipComments)(state, true, isMultiline);
    // parse property
    let property = undefined;
    let expressionResult = (0, exports.parseExpression)(state, isMultiline);
    if (expressionResult) {
        property = expressionResult.result;
        state = expressionResult.state;
    }
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, isMultiline);
    // skip everything until close token
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.BracketClose])) {
        let errorStart = (0, exports.getCursorPosition)(state);
        let errorToken = (0, exports.getToken)(state);
        state = (0, exports.skipTokens)(state, 1);
        let errorEnd = (0, exports.getCursorPosition)(state);
        state = (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "invalid token '" + errorToken.value || errorToken.type + "'", errorStart, errorEnd);
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
const parseUpdateExpressionPostfix = (state, leftOperand) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let operatorResult = (0, exports.parseUnaryOperatorPostfix)(state);
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
const parseBinaryExpression = (state, leftOperand, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse operator
    let operatorResult = (0, exports.parseBinaryOperator)(state);
    if (!operatorResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = operatorResult.state;
    let operator = operatorResult.result;
    let rightStart = (0, exports.getCursorPosition)(state);
    // skip comments and whitespaces
    state = (0, exports.skipComments)(state, true, isMultiline);
    // parse right operand
    let rightOperand;
    let rightOperandResult = (0, exports.parseExpression)(state, isMultiline);
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
const parseMemberExpression = (state, leftOperand, isMultiline) => {
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
    state = (0, exports.skipComments)(state, true, isMultiline);
    // parse identifier
    let identifierResult = (0, exports.parseAnyIdentifier)(state);
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
const parseConditionalExpression = (state, condition, isMultiline) => {
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
    let breakTokens = isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens.push(CodeTokenType_1.CodeTokenType.Semicolon);
    let whenTrue;
    let whenFalse;
    let colonToken;
    // parse operator content
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // parse when true
        let rightOperandResult = (0, exports.parseExpression)(state, isMultiline);
        if (rightOperandResult) {
            state = rightOperandResult.state;
            whenTrue = rightOperandResult.result;
            finalState = state;
        }
        state = (0, exports.skipComments)(state, true, isMultiline);
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // skip everything until break tokens or colon
        state = (0, exports.parseErrorTokens)(state, (state) => !(0, exports.getTokenOfType)(state, [...breakTokens, CodeTokenType_1.CodeTokenType.Colon]));
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
        state = (0, exports.skipComments)(state, true, isMultiline);
        // check sequence end
        if ((0, exports.getTokenOfType)(state, breakTokens))
            break;
        // parse whenFalse
        let whenFalseResult = (0, exports.parseExpression)(state, isMultiline);
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
const parseNewExpression = (state, isMultiline) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // parse new keyword
    let keywordResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.New]);
    if (!keywordResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = keywordResult.state;
    let finalState = state;
    let breakTokens = isMultiline ? [] : [CodeTokenType_1.CodeTokenType.Endline];
    breakTokens = [...breakTokens, CodeTokenType_1.CodeTokenType.Semicolon];
    let expression = undefined;
    // parse expression
    if (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, breakTokens)) {
        // skip comments and whitespaces
        state = (0, exports.skipComments)(state, true, isMultiline);
        // parse expression
        let expressionResult = (0, exports.parseExpression)(state, isMultiline);
        if (expressionResult) {
            state = expressionResult.state;
            expression = expressionResult.result;
            finalState = state;
        }
    }
    state = finalState;
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.newExpression(expression, start, end);
    return {
        result,
        state
    };
};
exports.parseNewExpression = parseNewExpression;
// storytailor-specific
const parseOuterStatement = (state) => {
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
    state = (0, exports.skipComments)(state, true, false);
    // parse statement
    let statement = undefined;
    let contentResult = (0, exports.parseOuterStatementContent)(state);
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
    state = (0, exports.skipComments)(state, true, false);
    // any excess symbols until endline are invalid
    state = (0, exports.parseErrorTokens)(state, (stat) => !(0, exports.getTokenOfType)(stat, [CodeTokenType_1.CodeTokenType.Endline]));
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
const parseOuterStatementContent = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // Parse Block
    let codeLineResult = (0, exports.parseBlockStatement)(state);
    if (codeLineResult) {
        return codeLineResult;
    }
    let deleteLineResult = (0, exports.parseDeleteLineExpression)(state);
    if (deleteLineResult) {
        return deleteLineResult;
    }
    // Parse Object Line Statement
    let objectLineResult = (0, exports.parseObjectLine)(state);
    if (objectLineResult) {
        return objectLineResult;
    }
    // Parse Statement
    let statementResult = (0, exports.parseStatement)(state, false);
    if (statementResult) {
        return statementResult;
    }
    return undefined;
};
exports.parseOuterStatementContent = parseOuterStatementContent;
const parseTextLineStatement = (state) => {
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
    while (!(0, exports.isEndOfFile)(state) && !(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        // skip comments
        state = (0, exports.skipComments)(state, false, false);
        if ((0, exports.isEndOfFile)(state) || (0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endline])) {
            break;
        }
        // parse word
        let stringItem = (0, exports.parseStringLiteralItem)(state);
        if (stringItem) {
            state = stringItem.state;
            content = [
                ...content,
                stringItem.result
            ];
        }
        // skip comments
        state = (0, exports.skipComments)(state, false, false);
        continue;
    }
    if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Endline])) {
        state = (0, exports.skipTokens)(state, 1);
    }
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.textLineStatement(indent, content, start, end);
    return {
        state: state,
        result: result
    };
};
exports.parseTextLineStatement = parseTextLineStatement;
const parseObjectLine = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // Object Name: Prototype || Object Name = Value Expression
    // parse tags
    let tags = [];
    while (!(0, exports.isEndOfFile)(state)) {
        let tagResult = (0, exports.parseTag)(state);
        if (tagResult) {
            tags = [...tags, tagResult.result];
            state = tagResult.state;
            state = (0, exports.skipComments)(state, true, false);
            continue;
        }
        break;
    }
    // parse identifier
    let identifierResult = (0, exports.parseAnyIdentifier)(state);
    if (!identifierResult) {
        return undefined;
    }
    let initValue = undefined;
    let identifier = identifierResult.result;
    state = identifierResult.state;
    let start = Object.assign({}, identifier.start);
    let end = Object.assign({}, identifier.end);
    // skip comments
    state = (0, exports.skipComments)(state, true);
    // parse prototype
    let prototypeResult = (0, exports.parsePrototypeExpression)(state);
    if (prototypeResult) {
        state = prototypeResult.state;
        initValue = prototypeResult.result;
    }
    else {
        // if there is no prototype expression
        // parse initial value e.g. after = symbol
        // parse = symbol
        if ((0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Equals])) {
            // skip = symbol
            state = (0, exports.skipTokens)(state, 1);
            state = (0, exports.skipComments)(state, true);
            let functionDeclarationResult = (0, exports.parseFunctionDeclaration)(state, false);
            let expressionResult = (0, exports.parseExpression)(state, false);
            // parse initial value expression
            if (functionDeclarationResult) {
                state = functionDeclarationResult.state;
                initValue = functionDeclarationResult.result;
            }
            else if (expressionResult) {
                state = expressionResult.state;
                initValue = expressionResult.result;
            }
            else {
                // if we have 'Object Name = ' and nothing else
                // for now, just skip it
            }
        }
    }
    if (initValue) {
        end = Object.assign({}, initValue.end);
    }
    // create result ast node
    let result = astFactory_1.astFactory.objectLineStatement(identifier, initValue, tags, start, end);
    return {
        state,
        result
    };
};
exports.parseObjectLine = parseObjectLine;
const parseDeleteLineExpression = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    // delete Object Name
    // parse delete keyword
    let deleteResult = (0, exports.parseKeywordOfType)(state, [KeywordType_1.KeywordType.Delete]);
    if (!deleteResult) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    state = deleteResult.state;
    // skip whitespace
    state = (0, exports.skipComments)(state, true, false);
    // parse identifier
    let identifier = undefined;
    let identifierResult = (0, exports.parseOperandIdentifier)(state);
    if (identifierResult) {
        identifier = identifierResult.result;
        state = identifierResult.state;
    }
    let end = (0, exports.getCursorPosition)(state);
    // create result ast node
    let result = astFactory_1.astFactory.deleteLineExpression(identifier, start, end);
    return {
        state,
        result
    };
};
exports.parseDeleteLineExpression = parseDeleteLineExpression;
const parsePrototypeExpression = (state) => {
    if ((0, exports.isEndOfFile)(state)) {
        return undefined;
    }
    let start = (0, exports.getCursorPosition)(state);
    // parse :
    if (!(0, exports.getTokenOfType)(state, [CodeTokenType_1.CodeTokenType.Colon])) {
        return undefined;
    }
    state = (0, exports.skipTokens)(state, 1);
    // skip comments and whitespace
    state = (0, exports.skipComments)(state, true, false);
    // parse prototype expression
    let expression;
    let expressionResult = (0, exports.parseExpression)(state, false);
    if (expressionResult) {
        state = expressionResult.state;
        expression = expressionResult.result;
    }
    // prepare result
    let end = (0, exports.getCursorPosition)(state);
    let result = astFactory_1.astFactory.prototypeExpression(expression, start, end);
    return {
        state,
        result
    };
};
exports.parsePrototypeExpression = parsePrototypeExpression;
const parseTag = (state) => {
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
const parseErrorTokens = (state, filter) => {
    while (!(0, exports.isEndOfFile)(state)) {
        // skip comments if any
        let curPos = state.cursor;
        state = (0, exports.skipComments)(state, false, false);
        if (curPos != state.cursor) {
            // comments was skipped
            continue;
        }
        // otherwise there was no comments
        //check user filter and break if it doesn't pass
        if (filter && !filter(state)) {
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
const skipComments = (state, isSkipWhitespace = false, isMultiline = false) => {
    while (true) {
        if (isSkipWhitespace === true) {
            state = (0, exports.skipWhitespace)(state, isMultiline);
        }
        let commentBlockResult = (0, exports.parseCommentBlock)(state);
        if (commentBlockResult) {
            state = commentBlockResult.state;
            continue;
        }
        let commentLineResult = (0, exports.parseCommentLine)(state);
        if (commentLineResult) {
            state = commentLineResult.state;
            continue;
        }
        if (isSkipWhitespace === true) {
            state = (0, exports.skipWhitespace)(state, isMultiline);
        }
        break;
    }
    return state;
};
exports.skipComments = skipComments;
const skipCommentLine = (state) => {
    let parseResult = (0, exports.parseCommentLine)(state);
    if (parseResult) {
        return parseResult.state;
    }
    return undefined;
};
exports.skipCommentLine = skipCommentLine;
const skipCommentBlock = (state) => {
    let parseResult = (0, exports.parseCommentBlock)(state);
    if (parseResult) {
        return parseResult.state;
    }
    return undefined;
};
exports.skipCommentBlock = skipCommentBlock;
const skipWhitespace = (state, multiline = false) => {
    const tokenTypes = multiline
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
    return (0, exports.addParsingError)(state, IParsingError_1.ParsingErrorType.Error, "invalid token '" + token.value || token.type + "'", token.start, token.end);
};
exports.addInvalidTokenError = addInvalidTokenError;
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
