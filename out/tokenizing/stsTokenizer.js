"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stsTokenizer = void 0;
const tokenizerConfig_1 = require("./tokenizerConfig");
const CodeTokenType_1 = require("../shared/CodeTokenType");
exports.stsTokenizer = {
    tokenizeCode: (sourceCode) => {
        let state = {
            sourceCode: sourceCode,
            cursor: { symbol: 0, line: 0, column: 0 },
            globalCursor: 0,
            tokens: [],
        };
        let nextToken;
        while (nextToken = exports.stsTokenizer.getNextToken(state, CodeTokenType_1.CodeTokenType.Word)) {
            state = exports.stsTokenizer.addToken(state, nextToken);
        }
        return state.tokens;
    },
    getNextToken: (state, fallbackTokenType, pattern) => {
        // check for end of file
        if (exports.stsTokenizer.isEndOfFile(state)) {
            return undefined;
        }
        // prepare regexp and do the match
        pattern = pattern || tokenizerConfig_1.stsConfig.allSeparatorsPattern;
        pattern = tokenizerConfig_1.stsConfig.wrapPatternWithCursorPos(pattern, state.globalCursor);
        const regexp = new RegExp(pattern);
        let match = regexp.exec(state.sourceCode);
        let searchIndex = match ? match.index : 0;
        if (!match) {
            if (state.globalCursor < state.sourceCode.length) {
                //check is it last token in file
                let pattern2 = `(?:.|\\r|\\n){${state.globalCursor}}(.*)`;
                match = new RegExp(pattern2).exec(state.sourceCode);
            }
            if (!match) {
                return undefined;
            }
        }
        let tokenLength;
        let tokenValue;
        let tokenType;
        if (searchIndex === 0) {
            tokenValue = match[0].substring(state.globalCursor);
            tokenType = tokenizerConfig_1.stsConfig.getTokenType(tokenValue) || fallbackTokenType;
            tokenLength = tokenValue.length;
        }
        if (!tokenValue) {
            //token type is fallbackTokenType
            tokenLength = searchIndex;
            tokenValue = state.sourceCode.substring(state.globalCursor, state.globalCursor + tokenLength) || '';
            tokenType = fallbackTokenType;
        }
        const start = Object.assign({}, state.cursor);
        const end = Object.assign(Object.assign({}, start), { symbol: start.symbol + tokenLength, column: start.column + tokenLength });
        let token = {
            type: tokenType,
            value: tokenValue,
            start,
            end,
            length: tokenLength,
        };
        return token;
    },
    addToken_old: (state, token) => {
        const tokens = [
            ...state.tokens,
            token,
        ];
        const tokenLenght = token.end.symbol - token.start.symbol;
        const globalCursor = state.globalCursor + tokenLenght;
        let symbol = state.cursor.symbol + tokenLenght;
        let column = state.cursor.column + tokenLenght;
        let line = state.cursor.line;
        // check if token is endline, reset column to 0 and increase line
        if (token.type === CodeTokenType_1.CodeTokenType.Endline) {
            line = line + 1;
            column = 0;
        }
        // prepare result
        let cursor = {
            symbol,
            column,
            line
        };
        state = Object.assign(Object.assign({}, state), { tokens,
            globalCursor,
            cursor });
        return state;
    },
    addToken: (state, token) => {
        // add token
        if (!state.tokens) {
            state.tokens = [token];
        }
        else {
            state.tokens.push(token);
        }
        // calculate all remaining values
        const tokenLenght = token.end.symbol - token.start.symbol;
        const symbol = state.cursor.symbol + tokenLenght;
        let column = state.cursor.column + tokenLenght;
        let line = state.cursor.line;
        // check if token is endline, reset column to 0 and increase line
        if (token.type === CodeTokenType_1.CodeTokenType.Endline) {
            line = line + 1;
            column = 0;
        }
        // update all remaining state's values
        // global cursor
        state.globalCursor = state.globalCursor + tokenLenght;
        // cursor
        if (!state.cursor) {
            state.cursor = {
                symbol,
                column,
                line
            };
        }
        else {
            state.cursor.symbol = symbol;
            state.cursor.column = column;
            state.cursor.line = line;
        }
        return state;
    },
    isEndOfFile: (state) => {
        return !state.sourceCode || state.globalCursor >= state.sourceCode.length;
    }
};
