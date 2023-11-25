"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stsConfig = void 0;
const CodeTokenType_1 = require("../shared/CodeTokenType");
const OperationType_1 = require("../shared/OperationType");
const separators = [
    {
        type: CodeTokenType_1.CodeTokenType.Endline,
        pattern: '\\r?\\n',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Space,
        pattern: '\\s',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Colon,
        pattern: '\\:',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Semicolon,
        pattern: '\\;',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Dot,
        pattern: '\\.',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Comma,
        pattern: '\\,',
    },
    {
        type: CodeTokenType_1.CodeTokenType.NotSign,
        pattern: '\\!',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Prime,
        pattern: '\\\'',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Tilde,
        pattern: '\\`',
    },
    {
        type: CodeTokenType_1.CodeTokenType.OrSign,
        pattern: '\\|',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Question,
        pattern: '\\?',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Star,
        pattern: '\\*',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Minus,
        pattern: '\\-',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Plus,
        pattern: '\\+',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Equals,
        pattern: '\\=',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Caret,
        pattern: '\\^',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Percent,
        pattern: '\\%',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Dollar,
        pattern: '\\$',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Hash,
        pattern: '\\#',
    },
    {
        type: CodeTokenType_1.CodeTokenType.AtSign,
        pattern: '\\@',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Ampersand,
        pattern: '\\&',
    },
    {
        type: CodeTokenType_1.CodeTokenType.NumSign,
        pattern: '\\№',
    },
    {
        type: CodeTokenType_1.CodeTokenType.ParenOpen,
        pattern: '\\(',
    },
    {
        type: CodeTokenType_1.CodeTokenType.ParenClose,
        pattern: '\\)',
    },
    {
        type: CodeTokenType_1.CodeTokenType.BracketOpen,
        pattern: '\\[',
    },
    {
        type: CodeTokenType_1.CodeTokenType.BracketClose,
        pattern: '\\]',
    },
    {
        type: CodeTokenType_1.CodeTokenType.BraceOpen,
        pattern: '\\{',
    },
    {
        type: CodeTokenType_1.CodeTokenType.BraceClose,
        pattern: '\\}',
    },
    {
        type: CodeTokenType_1.CodeTokenType.TupleOpen,
        pattern: '\\<',
    },
    {
        type: CodeTokenType_1.CodeTokenType.TupleClose,
        pattern: '\\>',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Quote,
        pattern: '\\\"',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Slash,
        pattern: '\\/',
    },
    {
        type: CodeTokenType_1.CodeTokenType.Backslash,
        pattern: '\\\\',
    },
];
const tokens = [
    ...separators,
];
const operations = [
    {
        type: OperationType_1.OperationType.Copy,
        pattern: '\\.\\.\\.'
    },
    {
        type: OperationType_1.OperationType.Get,
        pattern: '\\.'
    },
    {
        type: OperationType_1.OperationType.Delete,
        pattern: '\\*\\-'
    },
    {
        type: OperationType_1.OperationType.Return,
        pattern: '\\*\\='
    },
    {
        type: OperationType_1.OperationType.Signature,
        pattern: '\\:'
    },
    {
        type: OperationType_1.OperationType.Diff,
        pattern: '\\-'
    },
    {
        type: OperationType_1.OperationType.Divide,
        pattern: '\\/'
    },
    {
        type: OperationType_1.OperationType.Multiply,
        pattern: '\\*'
    },
    {
        type: OperationType_1.OperationType.Set,
        pattern: '\\='
    },
    {
        type: OperationType_1.OperationType.Sum,
        pattern: '\\+'
    },
    {
        type: OperationType_1.OperationType.Root,
        pattern: '\\\\\\^'
    },
    {
        type: OperationType_1.OperationType.Power,
        pattern: '\\^'
    },
    {
        type: OperationType_1.OperationType.MoreOrEquals,
        pattern: '\\>='
    },
    {
        type: OperationType_1.OperationType.LessOrEquals,
        pattern: '\\<='
    },
    {
        type: OperationType_1.OperationType.More,
        pattern: '\\>'
    },
    {
        type: OperationType_1.OperationType.Less,
        pattern: '\\<'
    },
    {
        type: OperationType_1.OperationType.Or,
        pattern: '\\|\\|'
    },
    {
        type: OperationType_1.OperationType.And,
        pattern: '\\&\\&'
    },
];
// priority from low to hight
const operationsByPriority = [
    [OperationType_1.OperationType.Return],
    [OperationType_1.OperationType.Set],
    [OperationType_1.OperationType.Or, OperationType_1.OperationType.And],
    [OperationType_1.OperationType.More, OperationType_1.OperationType.Less][OperationType_1.OperationType.Sum, OperationType_1.OperationType.Diff],
    [OperationType_1.OperationType.Multiply, OperationType_1.OperationType.Divide, OperationType_1.OperationType.Power, OperationType_1.OperationType.Root],
    [OperationType_1.OperationType.Call],
    [OperationType_1.OperationType.Get, OperationType_1.OperationType.Index],
    [OperationType_1.OperationType.Signature]
];
const sortTokenConfigs = (configs) => {
    const result = configs.reduce((prev, curr, index, array) => {
        return Object.assign(Object.assign({}, prev), { [curr.type]: curr });
    }, {});
    return result;
};
const sortOperationConfigs = (configs) => {
    const result = configs.reduce((prev, curr, index, array) => {
        return Object.assign(Object.assign({}, prev), { [curr.type]: curr });
    }, {});
    return result;
};
const makeOperationsByPattern = (configs) => {
    let result = new Map();
    for (let opIndex = 0; opIndex < configs.length; opIndex++) {
        let operation = configs[opIndex];
        result[`${operation.pattern}`] = operation;
    }
    return result;
};
const sortedSeparators = sortTokenConfigs(separators);
const sortedTokens = sortTokenConfigs(tokens);
const sortedOperations = sortOperationConfigs(operations);
const operationsByPattern = makeOperationsByPattern(operations);
const combinePatterns = (patterns, separator = '|', isGroup = true) => {
    const result = patterns.reduce((prev, curr, index, array) => {
        const pattern = isGroup ? `(${curr})` : `(?:${curr})`;
        const result = index === 0 ? pattern : `${prev}|${pattern}`;
        return result;
    }, '');
    return result;
};
const wrapPatternWithCursorPos = (pattern, cursorPos) => {
    return `(?:.|\\r|\\n){${cursorPos}}(?:${pattern})`;
};
const allSeparatorsPattern = combinePatterns(separators.map((token) => { return token.pattern; }));
const allSeparatorsRegexp = new RegExp(allSeparatorsPattern);
const allTokensPattern = combinePatterns(tokens.map((token) => { return token.pattern; }));
const allTokensRegexp = new RegExp(allTokensPattern);
const getTokenType = (tokenValue, tokensConfigs) => {
    tokensConfigs = tokensConfigs || exports.stsConfig.tokens;
    for (let tokenIndex = 0; tokenIndex < tokensConfigs.length; tokenIndex++) {
        const tokenConfig = tokensConfigs[tokenIndex];
        const regexp = new RegExp(tokenConfig.pattern);
        const match = regexp.exec(tokenValue);
        if (match) {
            return tokenConfig.type;
        }
    }
    return undefined;
};
const getOperationType = (tokenValue, operationConfigs) => {
    operationConfigs = operationConfigs || exports.stsConfig.operations;
    for (let tokenIndex = 0; tokenIndex < operationConfigs.length; tokenIndex++) {
        const operationConfig = operationConfigs[tokenIndex];
        const regexp = new RegExp(operationConfig.pattern);
        const match = regexp.exec(tokenValue);
        if (match) {
            return operationConfig.type;
        }
    }
    return undefined;
};
exports.stsConfig = {
    separators,
    tokens,
    operations,
    sortedSeparators,
    sortedTokens,
    sortedOperations,
    operationsByPattern,
    allSeparatorsPattern,
    allSeparatorsRegexp,
    allTokensPattern,
    allTokensRegexp,
    combinePatterns,
    wrapPatternWithCursorPos,
    getTokenType,
    getOperationType,
};
