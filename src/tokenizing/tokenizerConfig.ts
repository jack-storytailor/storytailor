import { CodeTokenType } from "../shared/CodeTokenType";
import { IHash } from "../shared/IHash";
import { OperationType } from "../shared/OperationType";

export interface ITokenConfig {
	type: CodeTokenType;
	pattern: string;
}

export interface IOperationConfig {
	type: OperationType;
	pattern: string;
}

export interface IOperationsByPattern extends Map<string, IOperationConfig> {
}

const separators: ITokenConfig[] = [
	{
		type: CodeTokenType.Endline,
		pattern: '\\r?\\n',
	},

	{
		type: CodeTokenType.Space,
		pattern: '\\s',
	},
	{
		type: CodeTokenType.Colon,
		pattern: '\\:',
	},
	{
		type: CodeTokenType.Semicolon,
		pattern: '\\;',
	},
	{
		type: CodeTokenType.Dot,
		pattern: '\\.',
	},
	{
		type: CodeTokenType.Comma,
		pattern: '\\,',
	},
	{
		type: CodeTokenType.NotSign,
		pattern: '\\!',
	},
	{
		type: CodeTokenType.Prime,
		pattern: '\\\'',
	},
	{
		type: CodeTokenType.Tilde,
		pattern: '\\`',
	},
	{
		type: CodeTokenType.OrSign,
		pattern: '\\|',
	},
	{
		type: CodeTokenType.Question,
		pattern: '\\?',
	},

	{
		type: CodeTokenType.Star,
		pattern: '\\*',
	},
	{
		type: CodeTokenType.Minus,
		pattern: '\\-',
	},
	{
		type: CodeTokenType.Plus,
		pattern: '\\+',
	},
	{
		type: CodeTokenType.Equals,
		pattern: '\\=',
	},
	{
		type: CodeTokenType.Caret,
		pattern: '\\^',
	},
	{
		type: CodeTokenType.Percent,
		pattern: '\\%',
	},
	{
		type: CodeTokenType.Dollar,
		pattern: '\\$',
	},
	{
		type: CodeTokenType.Hash,
		pattern: '\\#',
	},
	{
		type: CodeTokenType.AtSign,
		pattern: '\\@',
	},
	{
		type: CodeTokenType.Ampersand,
		pattern: '\\&',
	},
	{
		type: CodeTokenType.NumSign,
		pattern: '\\№',
	},

	{
		type: CodeTokenType.ParenOpen,
		pattern: '\\(',
	},
	{
		type: CodeTokenType.ParenClose,
		pattern: '\\)',
	},
	{
		type: CodeTokenType.BracketOpen,
		pattern: '\\[',
	},
	{
		type: CodeTokenType.BracketClose,
		pattern: '\\]',
	},
	{
		type: CodeTokenType.BraceOpen,
		pattern: '\\{',
	},
	{
		type: CodeTokenType.BraceClose,
		pattern: '\\}',
	},
	{
		type: CodeTokenType.TupleOpen,
		pattern: '\\<',
	},
	{
		type: CodeTokenType.TupleClose,
		pattern: '\\>',
	},
	{
		type: CodeTokenType.Quote,
		pattern: '\\\"',
	},

	{
		type: CodeTokenType.Slash,
		pattern: '\\/',
	},
	{
		type: CodeTokenType.Backslash,
		pattern: '\\\\',
	},
];

const tokens: ITokenConfig[] = [
	...separators,
];

const operations: IOperationConfig[] = [
	{
		type: OperationType.Copy,
		pattern: '\\.\\.\\.'
	},
	{
		type: OperationType.Get,
		pattern: '\\.'
	},
	{
		type: OperationType.Delete,
		pattern: '\\*\\-'
	},
	{
		type: OperationType.Return,
		pattern: '\\*\\='
	},
	{
		type: OperationType.Signature,
		pattern: '\\:'
	},
	{
		type: OperationType.Diff,
		pattern: '\\-'
	},
	{
		type: OperationType.Divide,
		pattern: '\\/'
	},
	{
		type: OperationType.Multiply,
		pattern: '\\*'
	},
	{
		type: OperationType.Set,
		pattern: '\\='
	},
	{
		type: OperationType.Sum,
		pattern: '\\+'
	},
	{
		type: OperationType.Root,
		pattern: '\\\\\\^'
	},
	{
		type: OperationType.Power,
		pattern: '\\^'
	},
	{
		type: OperationType.MoreOrEquals,
		pattern: '\\>='
	},
	{
		type: OperationType.LessOrEquals,
		pattern: '\\<='
	},
	{
		type: OperationType.More,
		pattern: '\\>'
	},
	{
		type: OperationType.Less,
		pattern: '\\<'
	},
	{
		type: OperationType.Or,
		pattern: '\\|\\|'
	},
	{
		type: OperationType.And,
		pattern: '\\&\\&'
	},
]

// priority from low to hight
const operationsByPriority: OperationType[][] = [
	[OperationType.Return],
	[OperationType.Set],
	[OperationType.Or, OperationType.And],
	[OperationType.More, OperationType.Less]
	[OperationType.Sum, OperationType.Diff],
	[OperationType.Multiply, OperationType.Divide, OperationType.Power, OperationType.Root],
	[OperationType.Call],
	[OperationType.Get, OperationType.Index],
	[OperationType.Signature]
]

const sortTokenConfigs = (configs: ITokenConfig[]): IHash<ITokenConfig> => {
	const result = configs.reduce((prev: IHash<ITokenConfig>, curr: ITokenConfig, index: number, array: ITokenConfig[]) => {
		return {
			...prev,
			[curr.type]: curr,
		};
	}, {});

	return result;
}
const sortOperationConfigs = (configs: IOperationConfig[]): IHash<IOperationConfig> => {
	const result = configs.reduce((prev: IHash<IOperationConfig>, curr: IOperationConfig, index: number, array: IOperationConfig[]) => {
		return {
			...prev,
			[curr.type]: curr,
		};
	}, {});

	return result;
}

const makeOperationsByPattern = (configs: IOperationConfig[]): IOperationsByPattern => {
	let result : IOperationsByPattern = new Map<string, IOperationConfig>();
	for	(let opIndex = 0; opIndex < configs.length; opIndex++) {
		let operation = configs[opIndex];
		result[`${operation.pattern}`] = operation;
	}

	return result;
}

const sortedSeparators = sortTokenConfigs(separators);
const sortedTokens = sortTokenConfigs(tokens);
const sortedOperations = sortOperationConfigs(operations);
const operationsByPattern = makeOperationsByPattern(operations);

const combinePatterns = (patterns: string[], separator: string = '|', isGroup: boolean = true) => {
	const result = patterns.reduce((prev: string, curr: string, index: number, array: string[]) => {
		const pattern = isGroup ? `(${curr})` : `(?:${curr})`;
		const result = index === 0 ? pattern : `${prev}|${pattern}`;
		return result;
	}, '');

	return result;
}
const wrapPatternWithCursorPos = (pattern: string, cursorPos: number) => {
	return `(?:.|\\r|\\n){${cursorPos}}(?:${pattern})`
}

const allSeparatorsPattern = combinePatterns(separators.map((token) => { return token.pattern }));
const allSeparatorsRegexp = new RegExp(allSeparatorsPattern);

const allTokensPattern = combinePatterns(tokens.map((token) => { return token.pattern }));
const allTokensRegexp = new RegExp(allTokensPattern);

const getTokenType = (tokenValue: string, tokensConfigs?: ITokenConfig[]): CodeTokenType => {
	tokensConfigs = tokensConfigs || stsConfig.tokens;
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

const getOperationType = (tokenValue: string, operationConfigs?: IOperationConfig[]): OperationType => {
	operationConfigs = operationConfigs || stsConfig.operations;
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

export const stsConfig = {
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
}