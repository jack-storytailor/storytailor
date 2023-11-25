import { ISymbolPosition } from "../shared/ISymbolPosition";
import { ICodeToken } from "../shared/ICodeToken";
import { stsConfig } from "./tokenizerConfig";
import { CodeTokenType } from "../shared/CodeTokenType";

export interface ITokenizerState {
	sourceCode: string;
	cursor: ISymbolPosition;
	globalCursor: number;
	tokens: ICodeToken[];
}

export const stsTokenizer = {
	tokenizeCode: (sourceCode: string): ICodeToken[] => {
		let state: ITokenizerState = {
			sourceCode: sourceCode,
			cursor: { symbol: 0, line: 0, column: 0 },
			globalCursor: 0,
			tokens: [],
		};

		let nextToken: ICodeToken;
		while (nextToken = stsTokenizer.getNextToken(state, CodeTokenType.Word)) {
			state = stsTokenizer.addToken(state, nextToken);
		}

		return state.tokens;
	},

	getNextToken: (state: ITokenizerState, fallbackTokenType: CodeTokenType, pattern?: string): ICodeToken => {
		// check for end of file
		if (stsTokenizer.isEndOfFile(state)) {
			return undefined;
		}

		// prepare regexp and do the match
		pattern = pattern || stsConfig.allSeparatorsPattern;
		pattern = stsConfig.wrapPatternWithCursorPos(pattern, state.globalCursor);
		const regexp = new RegExp(pattern);

		let match = regexp.exec(state.sourceCode);
		let searchIndex: number = match ? match.index : 0;
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

		let tokenLength: number;
		let tokenValue: string;
		let tokenType: CodeTokenType;

		if (searchIndex === 0) {
			tokenValue = match[0].substring(state.globalCursor);
			tokenType = stsConfig.getTokenType(tokenValue) || fallbackTokenType;
			tokenLength = tokenValue.length;
		}

		if (!tokenValue) {
			//token type is fallbackTokenType
			tokenLength = searchIndex;
			tokenValue = state.sourceCode.substring(state.globalCursor, tokenLength) || '';
			tokenType = fallbackTokenType;
		}

		const start = { ...state.cursor }
		const end = {
			...start,
			symbol: start.symbol + tokenLength,
			column: start.column + tokenLength,
		};

		let token: ICodeToken = {
			type: tokenType,
			value: tokenValue,
			start,
			end,
			length: tokenLength,
		};

		return token;
	},

	addToken_old: (state: ITokenizerState, token: ICodeToken): ITokenizerState => {
		const tokens = [
			...state.tokens,
			token,
		];
		const tokenLenght = token.end.symbol - token.start.symbol;
		const globalCursor = state.globalCursor + tokenLenght;
		let symbol: number = state.cursor.symbol + tokenLenght;
		let column: number = state.cursor.column + tokenLenght;
		let line: number = state.cursor.line;

		// check if token is endline, reset column to 0 and increase line
		if (token.type === CodeTokenType.Endline) {
			line = line + 1;
			column = 0;
		}

		// prepare result
		let cursor: ISymbolPosition = {
			symbol,
			column,
			line
		};

		state = {
			...state,
			tokens,
			globalCursor,
			cursor,
		};

		return state;
	},

	addToken: (state: ITokenizerState, token: ICodeToken): ITokenizerState => {
		// add token
		if (!state.tokens) {
			state.tokens = [token];
		}
		else {
			state.tokens.push(token);
		}

		// calculate all remaining values
		const tokenLenght = token.end.symbol - token.start.symbol;
		const symbol: number = state.cursor.symbol + tokenLenght;
		let column: number = state.cursor.column + tokenLenght;
		let line: number = state.cursor.line;

		// check if token is endline, reset column to 0 and increase line
		if (token.type === CodeTokenType.Endline) {
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
			}
		}
		else {
			state.cursor.symbol = symbol;
			state.cursor.column = column;
			state.cursor.line = line;
		}

		return state;
	},

	isEndOfFile: (state: ITokenizerState): boolean => {
		return !state.sourceCode || state.globalCursor >= state.sourceCode.length;
	}
}