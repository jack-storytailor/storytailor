import { ICodeToken } from "../shared/ICodeToken";
import { ISymbolPosition } from "../shared/ISymbolPosition";
import { IHash } from "../shared/IHash";
import { CodeTokenType, CodeTokenTypeSequence } from "../shared/CodeTokenType";
import { ParsingErrorType, IDiagnostic } from "../shared/IParsingError";
import { KeywordType } from "../ast/KeywordType";
import { VariableDeclarationKind } from "../ast/VariableDeclarationKind";
import { OperatorType } from "../ast/OperatorType";
import { 
	IAstToken, 
	IAstOperator, 
	IAstKeyword, 
	IAstModule, 
	IAstNode, 
	IAstCommentLine, 
	IAstCommentBlock, 
	IAstNumber, 
	IAstString, 
	IAstStringIncludeStatement, 
	IAstBoolean, 
	IAstArray, 
	IAstIdentifier, 
	IAstIdentifierScope, 
	IAstRawIdentifier, 
	IAstProgram, 
	IAstPropertyDeclaration, 
	IAstBreakStatement, 
	IAstContinueStatement, 
	IAstBlockStatement, 
	IAstIfStatement, 
	IAstSwitchStatement, 
	IAstCaseStatement, 
	IAstDoWhileStatement, 
	IAstWhileStatement, 
	IAstForStatement, 
	IAstForInStatement, 
	IAstImportStatement, 
	IAstParenExpression, 
	IAstObject, 
	IAstCallExpression, 
	IAstIndexerExpression, 
	IAstUpdateExpression, 
	IAstBinaryExpression, 
	IAstMemberExpression, 
	IAstOuterStatement, 
	IAstTextLineStatement, 
	IAstObjectLineStatement, 
	IAstPrototypeExpression, 
	IAstScope, 
	IAstTokenSequence, 
	IAstConditionalExpression, 
	IAstTryStatement, 
	IAstCatchStatement, 
	IAstFinallyStatement, 
	IAstThrowStatement, 
	IAstDebuggerKeyword, 
	IAstDeleteLineExpression, 
	IAstContextIdentifier, 
	IAstRegexLiteral, 
	IAstVariableDeclaration, 
	IAstImportItem, 
	IAstClassDeclaration, 
	IAstKeywordNode,
	IAstDeconstructingAssignment
} from "../ast/IAstNode";
import { astFactory } from "../ast/astFactory";
import { AstNodeType } from '../ast/AstNodeType';
import { ISymbol } from "../ast/ISymbol";

let keywords = [];
for (const key in KeywordType) {
	if (KeywordType.hasOwnProperty(key)) {
		const value = KeywordType[key];
		keywords = [...keywords, value];
	}
}

const operators = [
	CodeTokenType.Plus,
	CodeTokenType.Minus,
	CodeTokenType.Dot,
	CodeTokenType.Colon,
	CodeTokenType.Percent,
	CodeTokenType.TupleOpen,
	CodeTokenType.TupleClose,
	CodeTokenType.Star,
	CodeTokenType.Slash,
	CodeTokenType.Equals,
	CodeTokenType.Question,
	CodeTokenType.NotSign,
	CodeTokenType.OrSign,
	CodeTokenType.Ampersand
];

const separators = [
	...operators,
	CodeTokenType.Semicolon,
	CodeTokenType.Endline,
	CodeTokenType.ParenOpen,
	CodeTokenType.ParenClose,
	CodeTokenType.BraceOpen,
	CodeTokenType.BraceClose,
	CodeTokenType.BracketOpen,
	CodeTokenType.BracketClose,
	CodeTokenType.Comma
];

export interface IParserSymbols {
	symbols: IHash<ISymbol>;
	currentId?: string;
	currentName?: string;
	currentFullName?: string[];
}

export interface IParserState {
	tokens: ICodeToken[];
	cursor: number;
	errors: IDiagnostic[];
	indent: number;
	imports: IAstImportStatement[];
	symbols: IParserSymbols;
}

export interface IParseResult<TResult = any> {
	state: IParserState;
	result: TResult;
}

export interface IParserConfig {
	indentSize: number;
}

export interface IParserOptions {
	isMultiline: boolean;
	allowContextIdentifiers: boolean;
}

export const defaultParserConfig: IParserConfig = {
	indentSize: 2
}

export type ParserFunction = (state: IParserState, options: IParserOptions) => IParseResult<IAstNode>;

let parserConfig: IParserConfig = defaultParserConfig;
let indentWhitespaceString: string = "  ";

// general
export const parseModule = (tokens: ICodeToken[], modulePath: string, config: IParserConfig): IParseResult<IAstModule> => {
	// prepare config
	if (config) {
		parserConfig = { ...config };
		if (!parserConfig.indentSize) {
			parserConfig.indentSize = defaultParserConfig.indentSize;
		}
		if (!parserConfig.indentSize) {
			parserConfig.indentSize = 2;
		}

		indentWhitespaceString = " ".repeat(parserConfig.indentSize);
	}

	// prepare tokens
	tokens = prepareTokens(tokens);

	if (!tokens) {
		return undefined;
	}

	let symbols: IParserSymbols = {
		symbols: {},
	};

	let state: IParserState = {
		cursor: 0,
		errors: [],
		indent: 0,
		tokens: tokens,
		imports: [],
		symbols: symbols
	};

	let programContent: IAstNode[] = [];

	// parse module content
	while (!isEndOfFile(state)) {

		var moduleContentResult = parseRootStatement(state);
		if (moduleContentResult && moduleContentResult.state) {
			state = moduleContentResult.state;
			if (moduleContentResult.result) {
				programContent.push(moduleContentResult.result);
			}

			continue;
		}

		// otherwise just skip token. it's unparsable
		state = skipTokens(state, 1);
	}

	let moduleStart: ISymbolPosition = {
		symbol: 0,
		line: 0,
		column: 0
	};
	let moduleEnd = { ...moduleStart }
	if (programContent.length > 0) {
		moduleEnd = { ...programContent[programContent.length - 1].end }
	}
	let astProgram = astFactory.program(programContent, moduleStart, moduleEnd);
	let astModule = astFactory.module(tokens, astProgram, state.imports, modulePath);

	var result: IParseResult<IAstModule> = {
		result: astModule,
		state: state
	};

	return result;
}

// statements
export const parseRootStatement = (state: IParserState): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const options: IParserOptions = {
		isMultiline: false,
		allowContextIdentifiers: true
	}

	// parses any content that can be in the root of module

	// skip comments
	const newState = skipComments(state, false, {...options, isMultiline: false});

	// skip the fully commented line
	if (getTokenOfType(state, [CodeTokenType.Endfile]) && newState.cursor > state.cursor) {
		
		return {
			state: skipTokens(newState, 1),
			result: undefined
		}
	}

	// if we're here, that means it's not the end of line and we've skipped all the comments already
	// parse outer expression
	let outerExpressionResult = parseOuterStatement(state, options);
	if (outerExpressionResult) {
		return outerExpressionResult;
	}

	// parse text line
	let textLineResult = parseTextLineStatement(state, options);
	if (textLineResult) {
		return textLineResult;
	}
	
	// if we did not manage to find anything, return nothing
	return undefined;
}
export const parseOuterStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstOuterStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	// read whitespace
	let indent = 0;
	let whitespaceResult = readWhitespace(state);
	if (whitespaceResult) {
		indent = calcIndentFromWhitespace(whitespaceResult.result);
		state = whitespaceResult.state;
	}

	// check open tokens
	let openSeqResult = parseTokenSequence(state, [CodeTokenType.Star, CodeTokenType.Space]);
	if (!openSeqResult) {
		return undefined;
	}
	state = openSeqResult.state;

	// skip comments
	state = skipComments(state, true, {...options, isMultiline: false});

	// parse statement
	let statement: IAstNode = undefined;
	let contentResult = parseOuterStatementContent(state, options);
	if (contentResult) {
		state = contentResult.state;
		statement = contentResult.result;

		// check if statement is code block and if so, unwrap code from that block
		let codeBlock = astFactory.asNode<IAstBlockStatement>(statement, AstNodeType.BlockStatement);
		if (codeBlock) {
			codeBlock = {
				...codeBlock,
				withoutBraces: true
			};
			statement = codeBlock;
		}
	}

	// skip comments
	state = skipComments(state, true, {...options, isMultiline: false});

	// any excess symbols until endline are invalid
	state = parseErrorTokens(state, (stat) => getTokenOfType(stat, [CodeTokenType.Endline]) !== undefined);

	// skip endline
	if (getTokenOfType(state, [CodeTokenType.Endline])) {
		state = skipTokens(state, 1);
	}

	// prepare result
	let end = getCursorPosition(state);
	let result: IAstOuterStatement = astFactory.outerStatement(
		indent,
		statement,
		start,
		end
	);

	return {
		state: state,
		result: result
	}
}
export const parseOuterStatementContent = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// Parse Block
	let codeLineResult = parseCodeBlock(state, {...options, isMultiline: true, allowContextIdentifiers: false});
	if (codeLineResult) {
		return codeLineResult;
	}

	let deleteLineResult = parseDeleteLineExpression(state, options);
	if (deleteLineResult) {
		return deleteLineResult;
	}

	// parse import
	const importResult = parseImportStatement(state, {...options, isMultiline: false});
	if (importResult) {
		return importResult;
	}

	// raw import
	const rawImportResult = parseRawImportStatement(state, {...options, isMultiline: false});
	if (rawImportResult) {
		return rawImportResult;
	}

	// Parse Object Line Statement
	let objectLineResult = parseObjectLine(state, options);
	if (objectLineResult) {
		return objectLineResult;
	}

	// Parse Statement
	let statementResult = parseStatement(state, {...options, isMultiline: false});
	if (statementResult) {
		return statementResult;
	}

	return undefined;
}
export const parseObjectLine = (state: IParserState, options: IParserOptions): IParseResult<IAstObjectLineStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// identifier [tags] [= initExpression]
	let identifier: IAstNode = undefined;

	let identifierScopeResult = parseIdentifierScope(state, options);
	if (identifierScopeResult) {
		identifier = identifierScopeResult.result;
		state = identifierScopeResult.state;
	}
	else {
		let objectLineIdentifier = parseObjectLineIdentifier(state, options);
		if (objectLineIdentifier) {
			identifier = objectLineIdentifier.result;
			state = objectLineIdentifier.state;
		}
	}

	if (!identifier) {
		return undefined;
	}

	const start = identifier?.start;

	// skip comments
	state = skipComments(state, true, {...options, isMultiline: false});

	// parse tags
	let tags: IAstNode[] = undefined;
	const tagsResult = parseObjectLineTags(state, {...options, isMultiline: false});
	if (tagsResult) {
		state = tagsResult.state;
		tags = tagsResult.result;
	}

	// skip comments
	state = skipComments(state, true, {...options, isMultiline: false});
	
	// read init operation
	let initValue: IAstNode = undefined;
	if (getTokenOfType(state, [CodeTokenType.Equals])) {
		state = skipTokens(state, 1);

		// skip comments
		state = skipComments(state, true, {...options, isMultiline: false});

		// read init value
		let initValueResult = parseExpression(state, {...options, isMultiline: false});
		if (initValueResult) {
			state = initValueResult.state;
			initValue = initValueResult.result;
		}
	}

	// and skip everything until the end of line
	state = skipUntil(state, [CodeTokenType.Endline]);

	// create result ast node
	const result: IAstObjectLineStatement = astFactory.objectLineStatement(
		identifier,
		initValue,
		tags,
		start,
		initValue?.end ?? identifier?.end
	);

	return {
		state,
		result
	}
}
export const parseDeleteLineExpression = (state: IParserState, options: IParserOptions): IParseResult<IAstDeleteLineExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const start = getCursorPosition(state);

	// delete Object Name

	// parse delete keyword
	let deleteResult = parseKeywordOfType(state, options, [KeywordType.Delete]);
	if (!deleteResult) {
		return undefined;
	}

	state = deleteResult.state;
	state = skipComments(state, true, {...options, isMultiline: false});

	// parse identifier
	let identifier: IAstNode = undefined;
	const identifierResult = parseOperandIdentifier(state, options);
	if (identifierResult) {
		identifier = identifierResult.result;
		state = identifierResult.state;
	}

	const end = getCursorPosition(state);

	// create result ast node
	let result = astFactory.deleteLineExpression(
		identifier,
		start,
		end
	);

	return {
		state,
		result
	}
}
export const parseTextLineStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstTextLineStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	// check indent
	let indent = 0;
	let whitespaceResult = readWhitespace(state);
	if (whitespaceResult) {
		indent = calcIndentFromWhitespace(whitespaceResult.result); //Math.trunc(whitespaceResult.result.length);
		state = whitespaceResult.state;
	}

	// parse text line as string literal content
	let content: IAstNode[] = [];
	let isSkippedLine: boolean = false;
	while (!isEndOfFile(state) && !getTokenOfType(state, [CodeTokenType.Endline])) {
		const contextSymbol = getCursorPosition(state)?.symbol;
		// skip comments
		state = skipComments(state, false, options);

		// end line ends the text line. If it's a commented line
		if (isEndOfFile(state) || getTokenOfType(state, [CodeTokenType.Endline])) {
			if (getCursorPosition(state)?.symbol !== contextSymbol) {
				isSkippedLine = true;
			}
			break;
		}

		// parse word
		let stringItem = parseStringLiteralItem(state, options);
		if (stringItem) {
			state = stringItem.state;
			content = [
				...content,
				stringItem.result
			];
		}

		// skip comments
		state = skipComments(state, false, {...options, isMultiline: false});
		continue;
	}

	if (getTokenOfType(state, [CodeTokenType.Endline])) {
		state = skipTokens(state, 1);
	}

	let end = getCursorPosition(state);

	let result: IAstTextLineStatement = isSkippedLine 
		? undefined 
		: astFactory.textLineStatement(
			indent,
			content,
			start,
			end
		);

	return {
		state: state,
		result: result
	}
}

export const parseStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	return parseNode(state, options, [
		parseExportStatement,
		parseStaticStatement,
		parseClassDeclaration,
		parseVariableDeclaration,
		parseDeconstructionAssignment,
		parseBreakStatement,
		parseReturnStatement,
		parseContinueStatement,
		parseIfStatement,
		parseSwitchStatement,
		parseWhileStatement,
		parseDoWhileStatement,
		parseForOfStatement,
		parseForInStatement,
		parseForStatement,
		parseImportStatement,
		parseRawImportStatement,
		parseTryStatement,
		parseCatchStatement,
		parseFinallyStatement,
		parseDebuggerKeyword,
		parseThrowStatement,
		parseExpression
	]);
}
export const parseExportStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstKeywordNode> => {
	return parseKeywordNode(
		state, 
		true, 
		options, 
		[KeywordType.Export],
		[parseStatement]
	);
}
export const parseStaticStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstKeywordNode> => {
	return parseKeywordNode(
		state, 
		true, 
		options, 
		[KeywordType.Static],
		[parseStatement]
	);
}
export const parseBreakStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstBreakStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse keyword
	const keywordResult = parseKeywordOfType(state, options, [KeywordType.Break]);
	if (!keywordResult) {
		return undefined;
	}
	state = keywordResult.state;

	// skip comments and whitespaces
	state = skipComments(state, true, {...options, isMultiline: false});

	// next should be endline or semicolon
	const endTokens = [CodeTokenType.Semicolon, CodeTokenType.Endline];
	if (getTokenOfType(state, endTokens)) {
		state = skipTokenOfType(state, endTokens);
	}
	else {
		state = addInvalidTokenError(state, getToken(state));
	}

	return {
		state, 
		result: astFactory.breakStatement(keywordResult.result?.start, keywordResult.result?.end)
	}
}
export const parseReturnStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstKeywordNode> => {
	return parseKeywordNode(
		state, 
		true, 
		options, 
		[KeywordType.Return],
		[parseExpression]
	);
}
export const parseContinueStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstContinueStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);
	// parse keyword
	let keywordResult = parseKeywordOfType(state, options, [KeywordType.Continue]);
	if (!keywordResult) {
		return undefined;
	}
	state = keywordResult.state;

	// skip whitespace
	state = skipWhitespace(state, {...options, isMultiline: false});

	// skip until ; or endline
	while (!isEndOfFile(state) && !getTokenOfType(state, [CodeTokenType.Semicolon, CodeTokenType.Endline])) {
		let nextToken: ICodeToken = getToken(state);
		let errorStart = getCursorPosition(state);
		state = skipTokens(state, 1);
		let errorEnd = getCursorPosition(state);
		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"unexpected symbol '" + nextToken.value || nextToken.type + "'",
			errorStart,
			errorEnd
		);
	}

	// skip ; if any
	if (getTokenOfType(state, [CodeTokenType.Semicolon])) {
		state = skipTokens(state, 1);
	}

	let end = getCursorPosition(state);
	let result = astFactory.continueStatement(start, end);

	return {
		result,
		state
	}
}
export const parseIfStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstIfStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let condition: IAstNode = undefined;
	let thenProgram: IAstNode = undefined;
	let elseProgram: IAstNode = undefined;
	let finalState: IParserState = undefined;

	let ifResult = parseKeywordOfType(state, options, [KeywordType.If]);
	if (!ifResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = ifResult.state;
	finalState = state;

	// prepare break tokens that will break the statement
	let breakTokens = options.isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];

	// parse until break tokens
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse condition
		let conditionScopeResult = parseScope(
			skipComments(state, true, options),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
			(state) => parseExpression(state, options),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
			(state) => skipComments(state, true, options)
		);

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
		if (getTokenOfType(state, breakTokens)) {
			break;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, options);
		// skip everything until { or else or breakTokens
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) !== undefined || parseKeyword(state, options) !== undefined);
		// check sequence end
		if (getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse then body
		let codeBlockResult = parseCodeBlock(state, options);
		if (codeBlockResult) {
			thenProgram = codeBlockResult.result;
			state = codeBlockResult.state;
			finalState = state;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, options);
		// skip everything until else or breakTokens
		state = parseErrorTokens(state, (state) => getTokenOfType(state, breakTokens) !== undefined || parseKeyword(state, options) !== undefined);

		// parse else
		let elseResult = parseKeywordOfType(state, options, [KeywordType.Else]);
		if (elseResult) {
			state = elseResult.state;
			finalState = state;

			// skip comments and whitespaces
			state = skipComments(state, true, options);
			// skip everything until { or else or breakTokens
			state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) !== undefined);
			// check sequence end
			if (getTokenOfType(state, breakTokens)) {
				break;
			}

			// parse else body
			if (parseKeywordOfType(state, options, [KeywordType.If])) {
				// this is nested if statement
				let nestedIfResult = parseIfStatement(state, options);
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
				let codeBlockResult = parseCodeBlock(state, options);
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
	let end = getCursorPosition(state);
	let result = astFactory.ifStatement(condition, thenProgram, elseProgram, start, end);

	return {
		state,
		result
	}
}
export const parseSwitchStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstSwitchStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let condition: IAstNode = undefined;
	let cases: IAstNode[];
	let finalState: IParserState = undefined;

	let switchResult = parseKeywordOfType(state, options, [KeywordType.Switch]);
	if (!switchResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = switchResult.state;
	finalState = state;

	// prepare break tokens that will break the statement
	let breakTokens = options.isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];

	// parse until break tokens
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse condition
		let conditionScopeResult = parseScope(
			skipComments(state, true, options),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
			(state) => parseExpression(state, options),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
			(state) => skipComments(state, true, options)
		);

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
		if (getTokenOfType(state, breakTokens)) break;

		// skip comments and whitespaces
		state = skipComments(state, true, options);
		// skip everything until { or else or breakTokens
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) !== undefined || parseKeyword(state, options) !== undefined);
		// check sequence end
		if (getTokenOfType(state, breakTokens)) break;

		// parse swich body
		let bodyResult = parseScope(
			skipComments(state, true, {...options, isMultiline: true}),
			(state) => parseTokenSequence(state, [CodeTokenType.BraceOpen]),
			(state) => {
				// skip comments and whitespaces
				state = skipComments(state, true, {...options, isMultiline: true});

				// case
				let caseResult = parseCaseStatement(state, options);
				if (caseResult) {
					return caseResult;
				}

				// default case
				let defaultCaseResult = parseDefaultCaseStatement(state, options);
				if (defaultCaseResult) {
					return defaultCaseResult;
				}

				return undefined;
			},
			(state) => parseTokenSequence(state, [CodeTokenType.BraceClose]),
			(state) => skipComments(state, true, options)
		);

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
	let end = getCursorPosition(state);
	let result = astFactory.switchStatement(condition, cases, start, end);

	return {
		state,
		result
	}
}
export const parseCaseStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstCaseStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse case keyword
	let caseResult = parseKeywordOfType(state, options, [KeywordType.Case]);
	if (!caseResult) {
		return undefined;
	}

	let breakTokens = [CodeTokenType.BraceClose];

	let condition: IAstNode = undefined;
	let body: IAstNode[] = [];
	let consequent: IAstNode = undefined;

	let start = getCursorPosition(state);
	state = caseResult.state;
	// skip comments and whitespaces
	state = skipComments(state, true, {...options, isMultiline: true});

	let finalState = state;
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse condition
		let conditionResult = parseExpression(state, {...options, isMultiline: true});
		if (conditionResult) {
			state = conditionResult.state;
			finalState = state;

			condition = conditionResult.result;
		}

		// skip comments and check break tokens
		state = skipComments(state);
		if (getTokenOfType(state, breakTokens)) break;

		// parse :
		// skip everything until : or break token
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens, CodeTokenType.Colon]) !== undefined);
		if (getTokenOfType(state, [CodeTokenType.Colon])) {
			state = skipTokens(state, 1);
		}

		// parse statements until break token or case or default or return keywords
		while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens) && !parseKeywordOfType(state, options, [KeywordType.Case, KeywordType.Default, KeywordType.Return, KeywordType.Break])) {
			// parse body statement
			let bodyStatementResult = parseStatement(state, {...options, isMultiline: true});
			if (bodyStatementResult) {
				state = bodyStatementResult.state;
				finalState = state;
				body = [...body, bodyStatementResult.result];

				continue;
			}

			// skip separators
			if (getTokenOfType(state, [CodeTokenType.Semicolon])) {
				state = skipTokens(state, 1);
				finalState = state;

				continue;
			}

			// skip comments and whitespaces
			state = skipComments(state, true, {...options, isMultiline: true});
			if (state.cursor !== finalState.cursor) {
				continue;
			}

			// otherwise it's incorrect token
			state = addInvalidTokenError(state, getToken(state));
			state = skipTokens(state, 1);
		}
		finalState = state;

		// check sequence end
		if (getTokenOfType(state, breakTokens)) break;

		// skip comments and whitespaces
		state = skipComments(state, true, {...options, isMultiline: true});
		// skip everything until break tokens or keyword
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens]) !== undefined || parseKeywordOfType(state, options, [KeywordType.Case, KeywordType.Default, KeywordType.Return, KeywordType.Break]) !== undefined)

		// parse consequent
		// parse retrun or break statements
		let breakStatementResult = parseBreakStatement(state, options);
		if (breakStatementResult) {
			consequent = breakStatementResult.result;
			state = breakStatementResult.state;
			finalState = state;
		}
		else {
			let returnStatementResult = parseReturnStatement(state, {...options, isMultiline: true});
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
	let end = getCursorPosition(state);
	let result = astFactory.caseStatement(condition, body, consequent, start, end);

	return {
		result,
		state
	}
}
export const parseDefaultCaseStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstCaseStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse default keyword
	let defaultResult = parseKeywordOfType(state, options, [KeywordType.Default]);
	if (!defaultResult) {
		return undefined;
	}

	let breakTokens = [CodeTokenType.BraceClose];

	let condition: IAstNode = undefined;
	let body: IAstNode[] = [];
	let consequent: IAstNode = undefined;

	let start = getCursorPosition(state);
	state = defaultResult.state;
	// skip comments and whitespaces
	state = skipComments(state, true, {...options, isMultiline: true});

	let finalState = state;
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse :
		// skip everything until : or break token
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens, CodeTokenType.Colon]) !== undefined);
		if (getTokenOfType(state, [CodeTokenType.Colon])) {
			state = skipTokens(state, 1);
		}

		// parse statements until break token or case or default or return keywords
		while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens) && !parseKeywordOfType(state, options, [KeywordType.Case, KeywordType.Default, KeywordType.Return, KeywordType.Break])) {
			// parse body statement
			let bodyStatementResult = parseStatement(state, {...options, isMultiline: true});
			if (bodyStatementResult) {
				state = bodyStatementResult.state;
				finalState = state;
				body = [...body, bodyStatementResult.result];

				continue;
			}

			// skip separators
			if (getTokenOfType(state, [CodeTokenType.Semicolon])) {
				state = skipTokens(state, 1);
				finalState = state;

				continue;
			}

			// skip comments and whitespaces
			state = skipComments(state, true, {...options, isMultiline: true});
			if (state.cursor !== finalState.cursor) {
				continue;
			}

			// otherwise it's incorrect token
			state = addInvalidTokenError(state, getToken(state));
			state = skipTokens(state, 1);
		}
		finalState = state;

		// check sequence end
		if (getTokenOfType(state, breakTokens)) break;

		// skip comments and whitespaces
		state = skipComments(state, true, {...options, isMultiline: true});
		// skip everything until break tokens or keyword
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens]) !== undefined || parseKeywordOfType(state, options, [KeywordType.Case, KeywordType.Default, KeywordType.Return, KeywordType.Break]) !== undefined)

		// parse consequent
		// parse retrun or break statements
		let breakStatementResult = parseBreakStatement(state, options);
		if (breakStatementResult) {
			consequent = breakStatementResult.result;
			state = breakStatementResult.state;
			finalState = state;
		}
		else {
			let returnStatementResult = parseReturnStatement(state, {...options, isMultiline: true});
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
	let end = getCursorPosition(state);
	let result = astFactory.caseStatement(condition, body, consequent, start, end);

	return {
		result,
		state
	}
}
export const parseDoWhileStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstDoWhileStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let condition: IAstNode = undefined;
	let bodyProgram: IAstNode = undefined;
	let finalState: IParserState = undefined;

	let doResult = parseKeywordOfType(state, options, [KeywordType.Do]);
	if (!doResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = doResult.state;
	finalState = state;

	// prepare break tokens that will break the statement
	let breakTokens = options.isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];

	// parse until break tokens
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {

		// skip comments and whitespaces
		state = skipComments(state, true, options);
		// skip everything until { or breakTokens or while
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) !== undefined || parseKeyword(state, options) !== undefined);
		// check sequence end
		if (getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse body program
		let codeBlockResult = parseCodeBlock(state, options);
		if (codeBlockResult) {
			bodyProgram = codeBlockResult.result;
			state = codeBlockResult.state;
			finalState = state;
		}

		// check sequence end
		if (getTokenOfType(state, breakTokens)) { break; }
		// skip comments and whitespaces
		state = skipComments(state, true, options);
		// skip everything until ( or breakTokens or while
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens, CodeTokenType.ParenOpen]) !== undefined || parseKeywordOfType(state, options, [KeywordType.While]) !== undefined);
		// check sequence end
		if (getTokenOfType(state, breakTokens)) { break; }

		// parse while
		let whileResult = parseKeywordOfType(state, options, [KeywordType.While]);
		if (whileResult) {
			state = whileResult.state;
			finalState = state;

			// check sequence end
			if (getTokenOfType(state, breakTokens)) { break; }
			// skip comments and whitespaces
			state = skipComments(state, true, options);
			// skip everything until ( or breakTokens or while
			state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens, CodeTokenType.ParenOpen]) !== undefined || parseKeywordOfType(state, options, [KeywordType.While]) !== undefined);
			// check sequence end
			if (getTokenOfType(state, breakTokens)) { break; }

			// parse condition
			let conditionScopeResult = parseScope(
				skipComments(state, true, options),
				(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
				(state) => parseExpression(state, options),
				(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
				(state) => skipComments(state, true, options)
			);

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
	let end = getCursorPosition(state);
	let result = astFactory.doWhileStatement(condition, bodyProgram, start, end);

	return {
		state,
		result
	}
}
export const parseWhileStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstWhileStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let condition: IAstNode = undefined;
	let bodyProgram: IAstNode = undefined;
	let finalState: IParserState = undefined;

	let whileResult = parseKeywordOfType(state, options, [KeywordType.While]);
	if (!whileResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = whileResult.state;
	finalState = state;

	let condStart = getCursorPosition(state);
	let condEnd = getCursorPosition(state);
	let codeBlockStart = getCursorPosition(state);

	// prepare break tokens that will break the statement
	let breakTokens = options.isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];

	// parse until break tokens
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse condition
		let conditionScopeResult = parseScope(
			skipComments(state, true, options),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
			(state) => parseExpression(state, options),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
			(state) => skipComments(state, true, {...options, isMultiline: true})
		);

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
						state = addParsingError(
							state,
							ParsingErrorType.Error,
							`Excess symbols`,
							excessCondition.start,
							excessCondition.end
						);
					}
				}

				// TEMP: skip all of them
			}
		}

		// check sequence end
		if (getTokenOfType(state, breakTokens)) {
			break;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, options);
		// skip everything until { or else or breakTokens
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) !== undefined || parseKeyword(state, options) !== undefined);
		// check sequence end
		if (getTokenOfType(state, breakTokens)) {
			break;
		}

		codeBlockStart = getCursorPosition(state);

		// parse body program
		let codeBlockResult = parseCodeBlock(state, options);
		if (codeBlockResult) {
			bodyProgram = codeBlockResult.result;
			state = codeBlockResult.state;
			finalState = state;
		}

		break;
	}

	state = finalState;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.whileStatement(condition, bodyProgram, start, end);

	// check condition
	if (!condition) {
		state = addParsingError(
			state,
			ParsingErrorType.Error,
			`while expression needs condition`,
			condStart,
			condEnd
		)
	}
	// check code block
	if (!condition) {
		state = addParsingError(
			state,
			ParsingErrorType.Error,
			`while expression needs code block`,
			codeBlockStart,
			condEnd
		)
	}

	return {
		state,
		result
	}
}
export const parseForStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstForStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let init: IAstNode = undefined;
	let test: IAstNode = undefined;
	let update: IAstNode = undefined;
	let bodyProgram: IAstNode = undefined;
	let finalState: IParserState = undefined;

	let forResult = parseKeywordOfType(state, options, [KeywordType.For]);
	if (!forResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = forResult.state;
	finalState = state;

	// prepare break tokens that will break the statement
	let breakTokens = options.isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];

	// parse until break tokens
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse condition
		let conditionScopeResult = parseScope(
			skipComments(state, true, options),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
			(state) => parseStatement(state, options),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
			(state) => {
				// comments
				let cursor = state.cursor;
				state = skipComments(state, true, options);
				if (state.cursor > cursor) {
					return state;
				}

				// if not comments, then semicolon
				if (getTokenOfType(state, [CodeTokenType.Semicolon])) {
					state = skipTokens(state, 1);
					return state;
				}

				return state;
			}
		);

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
		if (getTokenOfType(state, breakTokens)) {
			break;
		}
		// skip comments and whitespaces
		state = skipComments(state, true, options);
		// skip everything until { or else or breakTokens
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) !== undefined || parseKeyword(state, options) !== undefined);
		// check sequence end
		if (getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse body program
		let codeBlockResult = parseCodeBlock(state, options);
		if (codeBlockResult) {
			bodyProgram = codeBlockResult.result;
			state = codeBlockResult.state;
			finalState = state;
		}

		break;
	}

	state = finalState;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.forStatement(init, test, update, bodyProgram, start, end);

	return {
		state,
		result
	}
}
export const parseForCoditions = (state: IParserState, options: IParserOptions): IParseResult<{ init: IAstNode, test: IAstNode; update: IAstNode }> => {
	let result: { init: IAstNode, test: IAstNode; update: IAstNode } =
	{
		init: undefined,
		test: undefined,
		update: undefined
	};

	// parse init statement
	let initStatementResult = parseExpression(state, {...options, isMultiline: true});
	if (initStatementResult) {
		state = initStatementResult.state;
		result = {
			...result,
			init: initStatementResult.result
		};
	}

	// skip comments and whitespaces
	state = skipComments(state, true, {...options, isMultiline: true});
	// everything until ; or ) are errors
	state = parseErrorTokens(state, (state) => getTokenOfType(state, [CodeTokenType.Semicolon, CodeTokenType.ParenClose]) !== undefined);

	// if it's ), then return
	if (getTokenOfType(state, [CodeTokenType.ParenClose])) {
		return {
			state,
			result
		}
	}

	// skip ; token
	if (getTokenOfType(state, [CodeTokenType.Semicolon])) {
		state = skipTokens(state, 1);
	}

	// skip comments and whitespaces
	state = skipComments(state, true, {...options, isMultiline: true});

	let testExpressionResult = parseExpression(state, {...options, isMultiline: true});
	if (testExpressionResult) {
		result = {
			...result,
			test: testExpressionResult.result
		};
		state = testExpressionResult.state;
	}

	// parse everything until ; or )
	let testErrorResult = readString(state, [CodeTokenType.Semicolon, CodeTokenType.ParenClose])
	if (testErrorResult) {
		let errorStart = getCursorPosition(state);
		state = testErrorResult.state;
		let errorEnd = getCursorPosition(state);

		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"unexpected symbols '" + testErrorResult.result + "'. ; expected",
			errorStart,
			errorEnd
		);
	}

	// if it's ), then return
	if (getTokenOfType(state, [CodeTokenType.ParenClose])) {
		return {
			state,
			result
		}
	}

	// skip ; token
	if (getTokenOfType(state, [CodeTokenType.Semicolon])) {
		state = skipTokens(state, 1);
	}

	// parse update statement
	let updateStatementResult = parseExpression(state, {...options, isMultiline: true});
	if (updateStatementResult) {
		state = updateStatementResult.state;
		result = {
			...result,
			update: updateStatementResult.result
		};
	}

	// skip comments and whitespaces
	state = skipComments(state, true, {...options, isMultiline: true});

	// parse everything until or )
	let updateErrorResult = readString(state, [CodeTokenType.ParenClose])
	if (updateErrorResult) {
		let errorStart = getCursorPosition(state);
		state = updateErrorResult.state;
		let errorEnd = getCursorPosition(state);

		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"unexpected symbols '" + updateErrorResult.result + "'. ) expected",
			errorStart,
			errorEnd
		);
	}

	return {
		result,
		state
	}
}
export const parseConditionBlock = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse open paren
	if (!getTokenOfType(state, [CodeTokenType.ParenOpen])) {
		return undefined;
	}
	state = skipTokens(state, 1);

	// skip comments and whitespaces
	state = skipComments(state, true, {...options, isMultiline: true});

	// parse expression
	let expressionResult = parseExpression(state, {...options, isMultiline: true});
	let expression: IAstNode = undefined;
	if (expressionResult) {
		expression = expressionResult.result;
		state = expressionResult.state;
	}

	// skip comments and whitespaces
	state = skipComments(state, true, {...options, isMultiline: true});

	// parse everything until or )
	let updateErrorResult = readString(state, [CodeTokenType.ParenClose])
	if (updateErrorResult) {
		let errorStart = getCursorPosition(state);
		state = updateErrorResult.state;
		let errorEnd = getCursorPosition(state);

		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"unexpected symbols '" + updateErrorResult.result + "'. ) expected",
			errorStart,
			errorEnd
		);
	}

	return {
		result: expression,
		state
	}
}
export const parseForInConditions = (state: IParserState, options: IParserOptions): IParseResult<{ variable: IAstNode, expression: IAstNode }> => {
	// parse left expression
	let variable: IAstNode = undefined;
	// parse identifier
	let identifierResult = parseOperandIdentifier(state, options);
	if (identifierResult) {
		state = identifierResult.state;
		variable = identifierResult.result;
	} else {
		// if no identifier, parse variable declaration
		let varDeclarationResult = parseVariableDeclaration(state, {...options, isMultiline: true});
		if (varDeclarationResult) {
			state = varDeclarationResult.state;
			variable = varDeclarationResult.result;
		} else {
			// if we still don't have variable, mark this as error
			state = addParsingError(
				state,
				ParsingErrorType.Error,
				`variable declaration or identifier expected`,
				getCursorPosition(state),
				getCursorPosition(state)
			);
		}
	}

	// check break tokens
	let breakTokens = [CodeTokenType.ParenClose];
	let finalState = state;
	let expression: IAstNode = undefined;
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, {...options, isMultiline: true});

		// check in keyword
		let inResult = parseKeywordOfType(state, options, [KeywordType.In]);
		if (inResult) {
			state = inResult.state;
		} else {
			// if there is no in keyword
			return undefined;
		}
		finalState = state;

		state = skipComments(state, true, {...options, isMultiline: true});

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse right expression
		let exprResult = parseExpression(state, {...options, isMultiline: true});
		if (exprResult) {
			state = exprResult.state;
			expression = exprResult.result;
			finalState = state;
		}

		break;
	}
	state = finalState;

	// prepare result
	let result: { variable: IAstNode, expression: IAstNode } =
	{
		variable,
		expression
	};

	return {
		result,
		state
	}
}
export const parseForOfConditions = (state: IParserState, options: IParserOptions): IParseResult<{ variable: IAstNode, expression: IAstNode }> => {
	// parse left expression
	let variable: IAstNode = undefined;
	// parse identifier
	let identifierResult = parseOperandIdentifier(state, options);
	if (identifierResult) {
		state = identifierResult.state;
		variable = identifierResult.result;
	} else {
		// if no identifier, parse variable declaration
		let varDeclarationResult = parseVariableDeclaration(state, {...options, isMultiline: true});
		if (varDeclarationResult) {
			state = varDeclarationResult.state;
			variable = varDeclarationResult.result;
		} else {
			// if we still don't have variable, mark this as error
			state = addParsingError(
				state,
				ParsingErrorType.Error,
				`variable declaration or identifier expected`,
				getCursorPosition(state),
				getCursorPosition(state)
			);
		}
	}

	// check break tokens
	let breakTokens = [CodeTokenType.ParenClose];
	let finalState = state;
	let expression: IAstNode = undefined;
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, {...options, isMultiline: true});

		// check of keyword
		let inResult = parseKeywordOfType(state, options, [KeywordType.Of]);
		if (inResult) {
			state = inResult.state;
		} else {
			// if there is no of keyword
			return undefined;
		}
		finalState = state;

		state = skipComments(state, true, {...options, isMultiline: true});

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse right expression
		let exprResult = parseExpression(state, {...options, isMultiline: true});
		if (exprResult) {
			state = exprResult.state;
			expression = exprResult.result;
			finalState = state;
		}

		break;
	}
	state = finalState;

	// prepare result
	let result: { variable: IAstNode, expression: IAstNode } =
	{
		variable,
		expression
	};

	return {
		result,
		state
	}
}
export const parseForInStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstForInStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse for (initStatement; in updateStatement) {body}
	let forResult = parseKeywordOfType(state, options, [KeywordType.For]);
	if (!forResult) {
		return undefined;
	}
	let start = getCursorPosition(state);
	state = forResult.state;

	// skip comments and whitespases
	state = skipComments(state, true, options);

	// parse condition block
	// parse open paren (
	if (!getTokenOfType(state, [CodeTokenType.ParenOpen])) {
		return undefined;
	}
	state = skipTokens(state, 1);
	let finalState = state;

	// prepare break tokens
	let breakTokens = [CodeTokenType.Semicolon];
	breakTokens = options.isMultiline ? breakTokens : [...breakTokens, CodeTokenType.Endline];

	// parse for in body
	let variable: IAstNode;
	let expression: IAstNode;
	let bodyProgram: IAstNode;
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, options);

		// parse for conditions
		let conditionsResult = parseForInConditions(state, options);
		if (conditionsResult) {
			state = conditionsResult.state;
			let condition = conditionsResult.result;
			variable = condition.variable;
			expression = condition.expression;

			finalState = state;
		} else {
			return undefined;
		}

		state = skipComments(state, true, {...options, isMultiline: true});

		// parse error tokens everything until )
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [CodeTokenType.ParenClose]) !== undefined);
		finalState = state;

		// parse and skip ) token
		if (getTokenOfType(state, [CodeTokenType.ParenClose])) {
			state = skipTokens(state, 1);
			finalState = state;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, options);

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// now it's time to parse body code block

		// skip everything until code block open token
		let bodyErrorTokens = [...breakTokens, CodeTokenType.BraceOpen];
		state = parseErrorTokens(state, (state) => getTokenOfType(state, bodyErrorTokens) !== undefined);

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse body code block
		let codeBlockResult = parseCodeBlock(state, options);
		if (codeBlockResult) {
			bodyProgram = codeBlockResult.result;
			state = codeBlockResult.state;
			finalState = state;
		}

		break;
	}
	state = finalState;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.forInStatement(variable, expression, bodyProgram, start, end);

	return {
		state,
		result
	}

}
export const parseForOfStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstForInStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse for (initStatement; in updateStatement) {body}
	let forResult = parseKeywordOfType(state, options, [KeywordType.For]);
	if (!forResult) {
		return undefined;
	}
	let start = getCursorPosition(state);
	state = forResult.state;

	// skip comments and whitespases
	state = skipComments(state, true, options);

	// parse condition block
	// parse open paren (
	if (!getTokenOfType(state, [CodeTokenType.ParenOpen])) {
		return undefined;
	}
	state = skipTokens(state, 1);
	let finalState = state;

	// prepare break tokens
	let breakTokens = [CodeTokenType.Semicolon];
	breakTokens = options.isMultiline ? breakTokens : [...breakTokens, CodeTokenType.Endline];

	// parse for of body
	let variable: IAstNode;
	let expression: IAstNode;
	let bodyProgram: IAstNode;
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, options);

		// parse for conditions
		let conditionsResult = parseForOfConditions(state, options);
		if (conditionsResult) {
			state = conditionsResult.state;
			let condition = conditionsResult.result;
			variable = condition.variable;
			expression = condition.expression;

			finalState = state;
		} else {
			return undefined;
		}

		state = skipComments(state, true, {...options, isMultiline: true});

		// parse error tokens everything until )
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [CodeTokenType.ParenClose]) !== undefined);
		finalState = state;

		// parse and skip ) token
		if (getTokenOfType(state, [CodeTokenType.ParenClose])) {
			state = skipTokens(state, 1);
			finalState = state;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, options);

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// now it's time to parse body code block

		// skip everything until code block open token
		let bodyErrorTokens = [...breakTokens, CodeTokenType.BraceOpen];
		state = parseErrorTokens(state, (state) => getTokenOfType(state, bodyErrorTokens) !== undefined);

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse body code block
		let codeBlockResult = parseCodeBlock(state, options);
		if (codeBlockResult) {
			bodyProgram = codeBlockResult.result;
			state = codeBlockResult.state;
			finalState = state;
		}

		break;
	}
	state = finalState;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.forOfStatement(variable, expression, bodyProgram, start, end);

	return {
		state,
		result
	}

}
export const parseImportStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstImportStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	// import [variable] as [alias] from [path]$
	// import in [variable] as [alias] from [path]$

	// parse import
	let keywordResult = parseKeywordOfType(state, options, [KeywordType.Import]);
	if (!keywordResult) {
		return undefined;
	}
	state = keywordResult.state;
	state = skipComments(state, true, options);

	// check if there is a 'in' variable next to the 'import': import in * as varname from "path"
	let isImportInContext: boolean = false;
	let inKeywordResult = parseKeywordOfType(state, options, [KeywordType.In]);
	if (inKeywordResult) {
		isImportInContext = true;
		state = inKeywordResult.state;
		state = skipComments(state, true);
	}

	let variableResult = parseOperandIdentifier(state, options);
	if (!variableResult) {
		return undefined;
	}

	state = variableResult.state;
	const identifier = variableResult.result;

	// parse from
	state = skipComments(state, true);
	let importPathAst: IAstNode = undefined;
	let fromResult = parseKeywordOfType(state, options, [KeywordType.From]);
	if (!fromResult) {
		return undefined;
	}

	state = fromResult.state;
	state = skipComments(state, true, options);

	// parse import path
	let importPathResult = parseImportPath(state, options);
	if (importPathResult) {
		state = importPathResult.state;
		importPathAst = importPathResult.result;
	}
	else {
		// no import path found
		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"Import path expected",
			getCursorPosition(state),
			getCursorPosition(state)
		);
	}

	// all text from now until endline is invalid
	state = skipComments(state, true);
	let excessTextStart = getCursorPosition(state);
	let excessTextResult = readString(state, [CodeTokenType.Endline]);
	if (excessTextResult && excessTextResult.result && excessTextResult.result.length > 0) {
		state = excessTextResult.state;
		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"only spaces, comments or endline allowed after import path",
			excessTextStart,
			getCursorPosition(state)
		);
	}

	// prepare result
	let result = astFactory.importStatement(
		identifier,
		isImportInContext,
		importPathAst,
		start,
		getCursorPosition(state)
	);

	// add import statement to the imports registry
	state = {
		...state,
		imports: [...state.imports, result]
	};

	return {
		result,
		state
	}
}
export const parseImportPath = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let expressionResult = parseExpression(state, {...options, isMultiline: false});
	if (expressionResult) {
		return expressionResult;
	}

	let stringResult = parseStringLiteral(state, options);
	if (stringResult) {
		return stringResult;
	}

	let scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.Prime]),
		(state) => parseStringLiteralItem(state, {...options, isMultiline: true}),
		(state) => parseTokenSequence(state, [CodeTokenType.Prime]),
	);
	if (!scopeResult) {
		return undefined;
	}

	// prepare result
	state = scopeResult.state;
	let pathContent = scopeResult.result.content;
	let start = scopeResult.result.start;
	let end = scopeResult.result.end;
	let result = astFactory.stringLiteral(pathContent, true, start, end);

	return {
		result,
		state
	}
}
export const parseRawImportStatement = (state: IParserState, options: IParserOptions) => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const start = getCursorPosition(state);

	// parse import
	let keywordResult = parseKeywordOfType(state, options, [KeywordType.Import]);
	if (!keywordResult) {
		return undefined;
	}
	state = keywordResult.state;
	state = skipComments(state, true);

	// parse import item or import items
	let identifier: IAstNode | IAstNode[] = undefined;
	const importItemResult = parseImportItem(state, options);
	if (importItemResult) {
		state = importItemResult.state;
		identifier = importItemResult.result;
	}
	else {
		let scopeResult = parseScope(
			skipComments(state, true, options),
			(state) => parseTokenSequence(state, [CodeTokenType.BraceOpen]),
			(state) => parseImportItem(state, options),
			(state) => parseTokenSequence(state, [CodeTokenType.BraceClose]),
			(state) => skipComments(state, true, options)
		);

		if (scopeResult) {
			identifier = scopeResult.result.content;
			state = scopeResult.state;
		}
	}

	// skip comments
	state = skipComments(state, true, options);

	// parse from
	const fromResult = parseKeywordOfType(state, options, [KeywordType.From]);
	if (fromResult) {
		state = fromResult.state;
	}
	else {
		const errorPos = getCursorPosition(state);
		state = addParsingError(state, ParsingErrorType.Error, "Expected 'from' keyword", errorPos, errorPos);
	}

	// skip comments
	state = skipComments(state, true, options);

	// parse path
	let path: IAstNode = undefined;
	const pathResult = parseImportPath(state, options);
	if (pathResult) {
		state = pathResult.state;
		path = pathResult.result;
	}

	// done
	const end = getCursorPosition(state);
	const result = astFactory.rawImportStatement(identifier, path, start, end);
	return {
		state,
		result
	}
}
export const parseImportItem = (state: IParserState, options: IParserOptions): IParseResult<IAstImportItem> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const start = getCursorPosition(state);

	// parse identifier
	let identifier: IAstNode = undefined;
	const identifierResult = parseIdentifier(state, options);
	if (identifierResult) {
		state = identifierResult.state;
		identifier = identifierResult.result;
	}
	else {
		// try to parse it as raw identifier
		const rawIdentResult = parseRawIdentifier(state, options);
		if (rawIdentResult) {
			state = rawIdentResult.state;
			identifier = rawIdentResult.result?.value;
		}
		else {
			// not an identifier
			// if there is no identifier, parse star
			if (!getTokenOfType(state, [CodeTokenType.Star])) {
				return undefined;
			}

			const starStart = getCursorPosition(state);
			state = skipTokens(state, 1);
			const starEnd = getCursorPosition(state);
			identifier = astFactory.identifier('*', true, starStart, starEnd);
		}
	}

	// we always parse it as raw identifier
	identifier = astFactory.rawIndentifier(identifier, identifier?.start, identifier?.end);
	state = skipComments(state, true, options);

	// parse alias
	let alias: IAstNode = undefined;
	const asResult = parseKeywordOfType(state, options, [KeywordType.As]);
	if (asResult) {
		state = asResult.state;

		// skip comments
		state = skipComments(state, true, options);
		
		// parse alias
		const aliasResult = parseIdentifier(state, options);
		if (aliasResult) {
			alias = aliasResult.result;
			state = aliasResult.state;
		}
		else {
			// try to parse raw identifier
			const rawIdentifierResult = parseRawIdentifier(state, options);
			if (rawIdentifierResult) {
				alias = rawIdentifierResult.result?.value;
			}
		}

		// we always parse the alias as raw identifier
		if (alias) {
			alias = astFactory.rawIndentifier(alias, alias?.start, alias?.end);
		}
	}

	// done
	const end = getCursorPosition(state);
	const result: IAstImportItem = astFactory.importItem(identifier, alias, start, end);
	return {
		state,
		result
	}
}
export const parseTryStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstTryStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse try
	let tryResult = parseKeywordOfType(state, {...options, isMultiline: true}, [KeywordType.Try]);
	if (!tryResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = tryResult.state;

	let finalState = state;
	let body: IAstNode = undefined;
	let catchClause: IAstNode = undefined;
	let finallyBlock: IAstNode = undefined;
	let breakTokens = options.isMultiline ? [] : [CodeTokenType.Endline];

	// skip comments and whitespaces
	state = skipComments(state, true, options);

	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {

		// parse code block
		let codeBlockResult = parseCodeBlock(state, options);
		if (codeBlockResult) {
			state = codeBlockResult.state;
			body = codeBlockResult.result;
			finalState = state;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, options);
		// check break tokens
		if (isEndOfFile(state) && getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse catch
		let catchResult = parseCatchStatement(state, options);
		if (catchResult) {
			state = catchResult.state;
			catchClause = catchResult.result;
			finalState = state;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, options);
		// check break tokens
		if (isEndOfFile(state) && getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse finally
		let finallyResult = parseFinallyStatement(state, options);
		if (finallyResult) {
			state = finallyResult.state;
			finallyBlock = finallyResult.result;
			finalState = state;
		}

		break;
	}
	state = finalState;

	let end = getCursorPosition(state);
	let result = astFactory.tryStatement(body, catchClause, finallyBlock, start, end);

	return {
		state,
		result
	}
}
export const parseCatchStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstCatchStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// catch (varDeclaration) {body}

	// parse catch keyword
	let keywordResult = parseKeywordOfType(state, {...options, isMultiline: true}, [KeywordType.Catch]);
	if (!keywordResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = keywordResult.state;

	let finalState = state;
	let body: IAstNode = undefined;
	let varDeclaration: IAstNode = undefined;
	let breakTokens = options.isMultiline ? [] : [CodeTokenType.Endline];

	// skip comments and whitespaces
	state = skipComments(state, true, options);

	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse (identifier)
		let scopeResult = parseScope(
			state,
			(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
			(state) => parseOperandIdentifier(state, {...options, isMultiline: true}),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
			(state) => skipComments(state, true, {...options, isMultiline: true})
		);
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
		state = skipComments(state, true, options);
		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) { break; }

		// parse body
		let bodyResult = parseCodeBlock(state, options);
		if (bodyResult) {
			state = bodyResult.state;
			finalState = bodyResult.state;
			body = bodyResult.result;
		}

		break;
	}
	state = finalState;


	let end = getCursorPosition(state);
	let result = astFactory.catchStatement(body, varDeclaration, start, end);

	return {
		state,
		result
	}
}
export const parseFinallyStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstFinallyStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// finally {body}

	// parse finally keyword
	let keywordResult = parseKeywordOfType(state, options, [KeywordType.Finally]);
	if (!keywordResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = keywordResult.state;

	let finalState = state;
	let body: IAstNode = undefined;
	let breakTokens = options.isMultiline ? [] : [CodeTokenType.Endline];

	// skip comments and whitespaces
	state = skipComments(state, true, options);

	// check break tokens
	if (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse body
		let bodyResult = parseCodeBlock(state, options);
		if (bodyResult) {
			state = bodyResult.state;
			finalState = bodyResult.state;
			body = bodyResult.result;
		}
	}
	state = finalState;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.finallyStatement(body, start, end);

	return {
		state,
		result
	}
}
export const parseThrowStatement = (state: IParserState, options: IParserOptions): IParseResult<IAstThrowStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse throw keyword
	let keywordResult = parseKeywordOfType(state, {...options, isMultiline: true}, [KeywordType.Throw]);
	if (!keywordResult) {
		return undefined;
	}
	let start = getCursorPosition(state);
	state = keywordResult.state;
	let finalState = state;
	let breakTokens = options.isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];
	let expression: IAstNode = undefined;

	// parse expression
	if (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, options);

		// parse expression
		let expressionResult = parseExpression(state, options);
		if (expressionResult) {
			state = expressionResult.state;
			expression = expressionResult.result;
			finalState = state;
		}
	}
	state = finalState;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.throwStatement(
		expression,
		start,
		end
	);

	return {
		result,
		state
	}
}

export const parseOperator = (state: IParserState, options: IParserOptions): IParseResult<IAstOperator> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);
	let sequence: CodeTokenType[];
	let operatorType: OperatorType;

	// SpreadAssign = "SpreadAssign",
	sequence = [CodeTokenType.Dot, CodeTokenType.Dot, CodeTokenType.Dot];
	operatorType = OperatorType.SpreadAssign;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `...`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// PercentEquals = "PercentEquals",
	sequence = [CodeTokenType.Percent, CodeTokenType.Equals];
	operatorType = OperatorType.PercentEquals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `%=`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// Percent = "Percent",
	sequence = [CodeTokenType.Percent];
	operatorType = OperatorType.Percent;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `%`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// PlusEquals = "PlusEquals",
	sequence = [CodeTokenType.Plus, CodeTokenType.Equals];
	operatorType = OperatorType.PlusEquals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `+=`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// MinusEquals = "MinusEquals",
	sequence = [CodeTokenType.Minus, CodeTokenType.Equals];
	operatorType = OperatorType.MinusEquals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `-=`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// MultiplyEquals = "MultiplyEquals",
	sequence = [CodeTokenType.Star, CodeTokenType.Equals];
	operatorType = OperatorType.MultiplyEquals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `*=`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// DivideEquals = "DivideEquals",
	sequence = [CodeTokenType.Slash, CodeTokenType.Equals];
	operatorType = OperatorType.DivideEquals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `/=`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// MoreMoreMore = "MoreMoreMore",
	sequence = [CodeTokenType.TupleClose, CodeTokenType.TupleClose, CodeTokenType.TupleClose];
	operatorType = OperatorType.MoreMoreMore;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `>>>`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}
	
	// MoreMore = "MoreMore",
	sequence = [CodeTokenType.TupleClose, CodeTokenType.TupleClose];
	operatorType = OperatorType.MoreMore;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `>>`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// LessLess = "LessLess",
	sequence = [CodeTokenType.TupleOpen, CodeTokenType.TupleOpen];
	operatorType = OperatorType.LessLess;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `<<`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// QuestionQuestion = "QuestionQuestion",
	sequence = [CodeTokenType.Question, CodeTokenType.Question];
	operatorType = OperatorType.QuestionQuestion;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `??`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// PlusPlus = "PlusPlus",
	sequence = [CodeTokenType.Plus, CodeTokenType.Plus];
	operatorType = OperatorType.PlusPlus;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `++`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// Plus = "Plus",
	sequence = [CodeTokenType.Plus];
	operatorType = OperatorType.Plus;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `+`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// MinusMinus = "MinusMinus",
	sequence = [CodeTokenType.Minus, CodeTokenType.Minus];
	operatorType = OperatorType.MinusMinus;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `--`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// Minus = "Minus",
	sequence = [CodeTokenType.Minus];
	operatorType = OperatorType.Minus;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `-`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// Multiply = "Multiply",
	sequence = [CodeTokenType.Star];
	operatorType = OperatorType.Multiply;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `*`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// Divide = "Divide",
	sequence = [CodeTokenType.Slash];
	operatorType = OperatorType.Divide;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `/`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// GreaterOrEquals = "GreaterOrEquals",
	sequence = [CodeTokenType.TupleClose, CodeTokenType.Equals];
	operatorType = OperatorType.GreaterOrEquals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `>=`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// LessOrEquals = "LessOrEquals",
	sequence = [CodeTokenType.TupleOpen, CodeTokenType.Equals];
	operatorType = OperatorType.LessOrEquals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `<=`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// Greater = "Greater",
	sequence = [CodeTokenType.TupleClose];
	operatorType = OperatorType.Greater;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `>`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// Less = "Less",
	sequence = [CodeTokenType.TupleOpen];
	operatorType = OperatorType.Less;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `<`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// NotEqualsEquals = "NotEqualsEquals",
	sequence = [CodeTokenType.NotSign, CodeTokenType.Equals, CodeTokenType.Equals];
	operatorType = OperatorType.NotEqualsEquals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `!==`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// NotEquals = "NotEquals",
	sequence = [CodeTokenType.NotSign, CodeTokenType.Equals];
	operatorType = OperatorType.NotEquals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `!=`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// Not = "Not",
	sequence = [CodeTokenType.NotSign];
	operatorType = OperatorType.Not;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `!`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// TripleEquals = "TripleEquals",
	sequence = [CodeTokenType.Equals, CodeTokenType.Equals, CodeTokenType.Equals];
	operatorType = OperatorType.TripleEquals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `===`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// DoubleEquals = "DoubleEquals",
	sequence = [CodeTokenType.Equals, CodeTokenType.Equals];
	operatorType = OperatorType.DoubleEquals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `==`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// Equals = "Equals",
	sequence = [CodeTokenType.Equals];
	operatorType = OperatorType.Equals;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `=`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// OrOr = "OrOr",
	sequence = [CodeTokenType.OrSign, CodeTokenType.OrSign];
	operatorType = OperatorType.OrOr;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `||`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// AndAnd = "AndAnd",
	sequence = [CodeTokenType.Ampersand, CodeTokenType.Ampersand];
	operatorType = OperatorType.AndAnd;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `&&`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// SingleAnd = "SingleAnd",
	sequence = [CodeTokenType.Ampersand];
	operatorType = OperatorType.SingleAnd;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `&`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	// SingleOr = "SingleOr",
	sequence = [CodeTokenType.OrSign];
	operatorType = OperatorType.SingleOr;

	if (checkTokenSequence(state, sequence)) {
		state = skipTokens(state, sequence.length);
		let end = getCursorPosition(state);
		let opText = `|`;
		let result = astFactory.operator(operatorType, opText, start, end);

		return {
			state,
			result
		}
	}

	return undefined;
}
export const parseOperatorOfType = (state: IParserState, options: IParserOptions, operatorTypes: OperatorType[]): IParseResult<IAstOperator> => {
	if (isEndOfFile(state) || !operatorTypes) {
		return undefined;
	}

	let operatorResult = parseOperator(state, options);
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
}
export const parseBinaryOperator = (state: IParserState, options: IParserOptions): IParseResult<IAstOperator> => {
	return parseOperatorOfType(state, options, [
		OperatorType.PercentEquals,
		OperatorType.Percent,
		OperatorType.GreaterOrEquals,
		OperatorType.Greater,
		OperatorType.LessOrEquals,
		OperatorType.LessLess,
		OperatorType.Less,
		OperatorType.PlusEquals,
		OperatorType.MinusEquals,
		OperatorType.MultiplyEquals,
		OperatorType.DivideEquals,
		OperatorType.QuestionQuestion,
		OperatorType.MoreMoreMore,
		OperatorType.MoreMore,
		OperatorType.QuestionQuestion,
		OperatorType.Minus,
		OperatorType.Multiply,
		OperatorType.NotEqualsEquals,
		OperatorType.NotEquals,
		OperatorType.Plus,
		OperatorType.Divide,
		OperatorType.TripleEquals,
		OperatorType.DoubleEquals,
		OperatorType.Equals,
		OperatorType.OrOr,
		OperatorType.AndAnd,
		OperatorType.SingleAnd,
		OperatorType.SingleOr
	]);
}
export const parseUnaryOperatorPrefix = (state: IParserState, options: IParserOptions): IParseResult<IAstOperator> => {
	return parseOperatorOfType(state, options, [
		OperatorType.SpreadAssign,
		OperatorType.PlusPlus,
		OperatorType.MinusMinus,
		OperatorType.Not,
		OperatorType.Minus
	]);
}
export const parseUnaryOperatorPostfix = (state: IParserState, options: IParserOptions): IParseResult<IAstOperator> => {
	return parseOperatorOfType(state, options, [
		OperatorType.PlusPlus,
		OperatorType.MinusMinus
	]);
}
export const parseKeyword = (state: IParserState, options: IParserOptions): IParseResult<IAstKeyword> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// keyword is a word only
	let nextToken = getTokenOfType(state, [CodeTokenType.Word]);
	if (!nextToken) {
		return undefined;
	}

	// check all possible keywords
	for (const keywordId in KeywordType) {
		let keyword = KeywordType[keywordId];
		if (nextToken.value === keyword) {
			let start = getCursorPosition(state);
			state = skipTokens(state, 1);
			let end = getCursorPosition(state);
			let keywordType: KeywordType = keyword as KeywordType;
			let result: IAstKeyword = astFactory.keyword(keywordType, start, end);

			return {
				result,
				state
			}
		}
	}

	return undefined;
}
export const parseDebuggerKeyword = (state: IParserState, options: IParserOptions): IParseResult<IAstDebuggerKeyword> => {
	let keywordResult = parseKeywordOfType(state, options, [KeywordType.Debugger]);
	if (!keywordResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = keywordResult.state;
	let end = getCursorPosition(state);
	let result = astFactory.debuggerKeyword(KeywordType.Debugger, start, end);

	return {
		result,
		state
	}
}
export const parseKeywordOfType = (state: IParserState, options: IParserOptions, keywordTypes: KeywordType[]): IParseResult<IAstKeyword> => {
	let keywordResult = parseKeyword(state, options);
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
}
export const parseCommentLine = (state: IParserState, options: IParserOptions): IParseResult<IAstCommentLine> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	// parse start captures
	if (!checkTokenSequence(state, [CodeTokenType.Slash, CodeTokenType.Slash])) {
		return undefined;
	}
	state = skipTokens(state, 2);

	// parse comment text
	let commentText = "";
	let commentTextResult = readString(state, [CodeTokenType.Endline]);
	if (commentTextResult) {
		commentText = commentTextResult.result || "";
		state = commentTextResult.state;
	}

	let end = getCursorPosition(state);

	// prepare result
	let result = astFactory.commentLine(commentText, start, end);
	return {
		result,
		state
	}
}
export const parseCommentBlock = (state: IParserState, options: IParserOptions): IParseResult<IAstCommentBlock> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	// parse start captures
	if (!checkTokenSequence(state, [CodeTokenType.Slash, CodeTokenType.Star])) {
		return undefined;
	}
	state = skipTokens(state, 2);

	// parse comment text
	let commentText = "";
	while (true) {
		let commentTextResult = readString(state, [CodeTokenType.Star]);
		if (commentTextResult) {
			commentText = commentTextResult.result || "";
			state = commentTextResult.state;
		}

		// check end of comment block
		if (checkTokenSequence(state, [CodeTokenType.Star, CodeTokenType.Slash])) {
			state = skipTokens(state, 2);
			break;
		}

		// if this is not the end of comment block, add current token to comment text and continue reading
		let nextToken = getToken(state);
		if (nextToken) {
			commentText = commentText + nextToken.value || "";
			state = skipTokens(state, 1);

			continue;
		}

		// if we here, that means we're at the end of file
		break;
	}

	let end = getCursorPosition(state);
	let result = astFactory.commentBlock(commentText, start, end);

	return {
		result,
		state
	}
}
export const parseCodeBlock = (state: IParserState, options: IParserOptions): IParseResult<IAstBlockStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.BraceOpen]),
		(state) => parseStatement(state, {...options, isMultiline: true}),
		(state) => parseTokenSequence(state, [CodeTokenType.BraceClose]),
		(state) => skipComments(state, true, {...options, isMultiline: true}),
		undefined,
		(state) => parseTokenSequence(state, [CodeTokenType.Semicolon])
	);
	
	if (!scopeResult) {
		return undefined;
	}

	state = scopeResult.state;
	const content = scopeResult.result?.content || [];

	return {
		state,
		result: astFactory.blockStatement(content, scopeResult.result?.start, scopeResult.result?.end)		
	}
}
export const parseFunctionParameters = (state: IParserState, options: IParserOptions) : IParseResult<IAstNode[]> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse function params scope
	let scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
		(state) => parseAnyIdentifier(state, {...options, isMultiline: true}),
		(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
		(state) => skipComments(state, true, {...options, isMultiline: true}),
		undefined,
		(state) => parseTokenSequence(state, [CodeTokenType.Comma])
	);

	if (!scopeResult) {
		return undefined;
	}

	// extract function arguments
	state = scopeResult.state;
	const result: IAstNode[] = scopeResult.result?.content ?? [];

	return {
		state,
		result
	}
}
export const parseObjectLineTags = (state: IParserState, options: IParserOptions): IParseResult<IAstNode[]> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const brakeTokens = options.isMultiline ? [] : [CodeTokenType.Endline];
	const result = [];

	while (!isEndOfFile(state) && !getTokenOfType(state, brakeTokens)) {
		let tagResult = parseTag(state, options);
		if (!tagResult) {
			break;
		}

		if (tagResult.result) {
			result.push(tagResult.result);
		}

		state = skipComments(state, true, options);
	}

	return {
		state,
		result
	}
}

// literals
export const parseLiteral = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	return parseNode(state, options, [
		parseFunction,
		parseNumberLiteral,
		parseBooleanLiteral,
		parseStringLiteral,
		(state, options) => parseArrayLiteral(state, options, false),
		parseObject,
		parseRegexLiteral
	]);
}
export const parseNumberLiteral = (state: IParserState, options: IParserOptions): IParseResult<IAstNumber> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	let word = getTokenOfType(state, [CodeTokenType.Word]);
	if (!word) {
		return undefined;
	}

	// parse first digit
	let firstDigit = Number(word.value);
	if (isNaN(firstDigit)) {
		return undefined;
	}
	state = skipTokens(state, 1);

	let stringResult = '' + firstDigit;

	if (getTokenOfType(state, [CodeTokenType.Dot])) {
		let substate = skipTokens(state, 1);
		// try parse next digit

		let nextToken = getTokenOfType(substate, [CodeTokenType.Word]);
		if (nextToken) {
			let nextDigit = Number(nextToken.value);
			if (!isNaN(nextDigit)) {
				stringResult += '.' + nextDigit;

				state = skipTokens(substate, 1);
			}
		}
	}

	let result = Number(stringResult);
	if (!isNaN(result)) {
		let end = getCursorPosition(state);
		return {
			state,
			result: astFactory.numberLiteral(result, start, end)
		}
	}

	return undefined;
}
export const parseStringLiteral = (state: IParserState, options: IParserOptions, allowIncludes: boolean = true): IParseResult<IAstString> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	if (!getTokenOfType(state, [CodeTokenType.Quote])) {
		return undefined;
	}

	let start = getCursorPosition(state);

	// skip open mark
	state = skipTokens(state, 1);

	// read content until close mark
	let content: IAstNode[] = [];
	while (true) {
		if (isEndOfFile(state) || getTokenOfType(state, [CodeTokenType.Quote])) {
			break;
		}

		// parse array item
		let stringItem = parseStringLiteralItem(state, {...options, isMultiline: false}, allowIncludes);
		if (stringItem) {
			state = stringItem.state;
			content.push(stringItem.result);
		}

		continue;
	}

	// close mark
	if (getTokenOfType(state, [CodeTokenType.Quote])) {
		state = skipTokens(state, 1);
	}
	else {
		// no close mark
		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"Unexpected token " + (getToken(state) ? (getToken(state).value || getToken(state).type) : "ENDFILE") + ". \" expected",
			getCursorPosition(state),
			getCursorPosition(state)
		);
	}

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.stringLiteral(content, allowIncludes, start, end);

	return {
		result,
		state
	}
}
export const parseStringLiteralItem = (state: IParserState, options: IParserOptions, allowIncludes: boolean = true): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse include
	if (allowIncludes) {
		let stringIncludeResult = parseStringInclude(state, options);
		if (stringIncludeResult) {
			return stringIncludeResult;
		}
	}

	// parse word
	let nextToken: ICodeToken = getToken(state);
	// check escaped char
	if (nextToken.type === CodeTokenType.Backslash) {
		// escaped char
		state = skipTokens(state, 1);

		// parse both tokens as one token sequence
		let wordToken = getToken(state);
		state = skipTokens(state, 1);
		let tokenSeq = astFactory.tokenSequence([nextToken, wordToken], nextToken.start, wordToken.end);

		return {
			result: tokenSeq,
			state
		}
	}

	if (nextToken.type == CodeTokenType.Prime && !allowIncludes) {
		state = skipTokens(state, 1);

		// add backslash before tilde
		let backslashToken: ICodeToken = {...nextToken, type: CodeTokenType.Backslash, value: "\\"};
		let tokenSeq = astFactory.tokenSequence([backslashToken, nextToken], nextToken.start, nextToken.end);

		return {
			result: tokenSeq,
			state
		}
	}

	// parse any other
	let tokenResult = parseToken(state);
	if (tokenResult) {
		return tokenResult;
	}

	return undefined;
}
export const parseStringInclude = (state: IParserState, options: IParserOptions): IParseResult<IAstStringIncludeStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse star
	if (!checkTokenSequence(state, [CodeTokenType.Star])) {
		return undefined;
	}

	// start and space is not an include
	if (isEndOfFile(state) || getTokenOfType(state, [CodeTokenType.Space, CodeTokenType.Endline])) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = skipTokens(state, 1);

	// *[space|comment|endline|endfile] is not an include
	// skip comments and whitespace
	let nextState = skipComments(state, true, emptyOptions);
	if (nextState && nextState.cursor > state.cursor) {
		return undefined;
	}

	// parse expression
	let expression: IAstNode = undefined;
	let expressionResult = parseExpression(state, {...options, isMultiline: false, allowContextIdentifiers: true});
	if (expressionResult) {
		expression = expressionResult.result;
		state = expressionResult.state;
	}

	// skip comments
	state = skipComments(state, true, emptyOptions);

	// check for semicolon
	state = parseErrorTokens(state, (state) => getTokenOfType(state, [CodeTokenType.Endline, CodeTokenType.Semicolon]) !== undefined);

	// skip ; if any
	if (getTokenOfType(state, [CodeTokenType.Semicolon])) {
		state = skipTokens(state, 1);
	}

	let end = getCursorPosition(state);
	let result = astFactory.stringIncludeStatement(expression, start, end);

	return {
		state,
		result
	}
}
export const parseBooleanLiteral = (state: IParserState, options: IParserOptions): IParseResult<IAstBoolean> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let nextToken = getTokenOfType(state, [CodeTokenType.Word]);
	if (!nextToken) {
		return undefined;
	}

	if (nextToken.value === "true" || nextToken.value === "false") {
		let boolValue = nextToken.value === "true";
		let start = getCursorPosition(state);
		state = skipTokens(state, 1);
		let end = getCursorPosition(state);
		let result = astFactory.booleanLiteral(boolValue, start, end);

		return {
			state,
			result
		}
	}

	return undefined;
}
export const parseRegexLiteral = (state: IParserState, options: IParserOptions): IParseResult<IAstRegexLiteral> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse start token '/'
	if (!getTokenOfType(state, [CodeTokenType.Slash])) {
		return undefined;
	}

	const start = getCursorPosition(state);

	const firstTokenResult = parseToken(state);
	if (!firstTokenResult) {
		return undefined;
	}
	state = firstTokenResult.state;

	const values = [firstTokenResult.result?.token?.value];
	let escapeSymbol = false;
	let isEndOfRegex = false;
	let end = getCursorPosition(state);

	// parse all the next tokens until braking 
	while (!isEndOfFile(state) && !isEndOfRegex) {
		let nextToken = getToken(state);
		if (!nextToken) {
			continue;
		}

		// check the end of regex line
		if (nextToken.type == CodeTokenType.Slash) {
			if (!escapeSymbol) {
				// end of regex line
				isEndOfRegex = true;
			}
		}

		if (nextToken.type == CodeTokenType.Endline) {
			// we don't have / symbol before endline, so this is not a regex line
			return undefined;
		}

		// check escape symbol
		if (nextToken.type == CodeTokenType.Backslash) {
			escapeSymbol = !escapeSymbol;
		}

		// if it's not an escaped ( symbol, we need to add the entire string until ) to regex
		if (nextToken.type == CodeTokenType.ParenOpen && !escapeSymbol) {
			let regexParenScopeResult = parseRegexParenScope(state, options);
			if (regexParenScopeResult) {
				state = regexParenScopeResult.state;
				values.push(regexParenScopeResult.result?.value);
				nextToken = regexParenScopeResult.result?.nextToken;
				continue;
			}
		}
		else {
			// add token to result values
			values.push(nextToken.value);
			end = nextToken.end;
		}

		if (nextToken.type != CodeTokenType.Backslash) {
			escapeSymbol = false;
		}

		state = skipTokens(state, 1);
	}
	
	// now parse the regex flags (if any)
	let flagsToken = getTokenOfType(state, [CodeTokenType.Word]);
	if (flagsToken) {
		// now this word must contain gimusy letters only
		let wordValue = flagsToken.value || "";
		if (!wordValue.match(/^[gimusy]+$/)) {
			return undefined;
		}

		// if we here, that means we have a correct flags
		values.push(wordValue);
		end = flagsToken.end;
		state = skipTokens(state, 1);
	}

	const regexValue = values.join('');
	const result = astFactory.regexLiteral(regexValue, start, end);

	return {
		state,
		result
	}
}
export const parseRegexParenScope = (state: IParserState, options: IParserOptions): IParseResult<{value: string, nextToken: ICodeToken}> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse first symbol (
	const firstToken = getToken(state);
	if (!firstToken || firstToken.type !== CodeTokenType.ParenOpen) {
		return undefined;
	}

	state = skipTokens(state, 1);

	// now parse everything until ) token. Parse all nested paren scopes

	const values = [firstToken.value];
	let escapeSymbol = false;
	let isEndOfScope = false;
	let end = getCursorPosition(state);
	let nextToken = firstToken;

	// parse all the next tokens until braking 
	while (!isEndOfFile(state) && !isEndOfScope) {
		nextToken = getToken(state);
		if (!nextToken) {
			continue;
		}

		// check the end of regex paren scope
		if (nextToken.type == CodeTokenType.ParenClose) {
			if (!escapeSymbol) {
				// end of regex scope
				isEndOfScope = true;
			}
		}

		// check escape symbol
		if (nextToken.type == CodeTokenType.Backslash) {
			escapeSymbol = !escapeSymbol;
		}

		// if it's not an escaped ( symbol, we need to add the entire string until ) to regex
		if (nextToken.type == CodeTokenType.ParenOpen && !escapeSymbol) {
			let regexParenScopeResult = parseRegexParenScope(state, options);
			if (regexParenScopeResult) {
				state = regexParenScopeResult.state;
				values.push(regexParenScopeResult.result?.value);
				end = regexParenScopeResult.result?.nextToken?.end || end;
				continue;
			}
		}
		else {
			// add token to result values
			values.push(nextToken.value);
			end = nextToken.end;
		}

		if (nextToken.type != CodeTokenType.Backslash) {
			escapeSymbol = false;
		}

		state = skipTokens(state, 1);
	}

	let scopeValue = values.join('');
	return {
		state, 
		result: {
			value: scopeValue,
			nextToken
		}
	}
}
export const parseArrayLiteral = (state: IParserState, options: IParserOptions, allowEmptyItems: boolean): IParseResult<IAstArray> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse array scope
	let scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.BracketOpen]),
		(state) => parseArrayElement(state, {...options, isMultiline: true}, allowEmptyItems),
		(state) => parseTokenSequence(state, [CodeTokenType.BracketClose]),
		(state) => skipComments(state, true, {...options, isMultiline: true}),
		undefined,
		(state) => parseTokenSequence(state, [CodeTokenType.Comma])
	);
	if (!scopeResult) {
		return undefined;
	}

	// prepare result
	state = scopeResult.state;
	let scope = scopeResult.result;
	let arrayContent = scope.content;
	let start = scope.start;
	let end = scope.end;
	let result = astFactory.arrayLiteral(arrayContent, start, end);

	return {
		state,
		result
	};
}
export const parseArrayElement = (state: IParserState, options: IParserOptions, allowEmptyItems: boolean): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let expressionResult = parseExpression(state, options);
	if (expressionResult) {
		return expressionResult;
	}

	// check for empty array element
	if (allowEmptyItems) {
		// check for coma
		if (getTokenOfType(state, [CodeTokenType.Comma])) {
			let emptyToken: ICodeToken = {
				start: getCursorPosition(state),
				end: getCursorPosition(state),
				type: CodeTokenType.Word,
				value: '',
				length: 0
			};
			return {
				state, 
				result: astFactory.token(emptyToken, emptyToken.start)
			}
		}
	}

	return undefined;
}
export const parseObject = (state: IParserState, options: IParserOptions): IParseResult<IAstObject> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse array scope
	let scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.BraceOpen]),
		(state) => parseObjectLiteralItem(state, {...options, isMultiline: true}),
		(state) => parseTokenSequence(state, [CodeTokenType.BraceClose]),
		(state) => skipComments(state, true, {...options, isMultiline: true}),
		undefined,
		(state) => parseTokenSequence(state, [CodeTokenType.Comma])
	);
	if (!scopeResult) {
		return undefined;
	}

	// prepare result
	state = scopeResult.state;
	let scope = scopeResult.result;
	let arrayContent = scope.content;
	let start = scope.start;
	let end = scope.end;
	let result = astFactory.objectLiteral(arrayContent, start, end);

	return {
		state,
		result
	};
}
export const parseObjectLiteralItem = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	return parseNode(state, options, [
		parseGetterSetter,
		parseFunction,
		parseObjectProperty,
		parseExpression
	]);
}
export const parseObjectProperty = (state: IParserState, options: IParserOptions): IParseResult<IAstPropertyDeclaration> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const start = getCursorPosition(state);

	// parse identifier
	let identifier: IAstNode = undefined;
	let literalIdentResult = parseStringLiteral(state, {...options, isMultiline: false}, false);
	if (literalIdentResult) {
		state = literalIdentResult.state;
		identifier = literalIdentResult.result;
	}
	else {
		let identifierResult = parseAnyIdentifier(state, options);
		if (identifierResult) {
			state = identifierResult.state;
			identifier = identifierResult.result;
		} else {
			let arrayResult = parseArrayLiteral(state, options, false);
			if (arrayResult != null) {
				state = arrayResult.state;
				identifier = arrayResult.result;
			}
		}
	}

	if (!identifier) {
		return undefined;
	}
	const end = identifier?.end;

	state = skipComments(state, true, options);

	let value: IAstNode;
	let initializer: IAstNode;

	// parse =
	if (getTokenOfType(state, [CodeTokenType.Equals])) {
		state = skipTokens(state, 1);
		state = skipComments(state, true, options);

		// parse value
		let valueResult = parseExpression(state, options);
		if (valueResult) {
			state = valueResult.state;
			initializer = valueResult.result;
		}
	}
	// parse colon
	else if (getTokenOfType(state, [CodeTokenType.Colon])) {
		state = skipTokens(state, 1);
		state = skipComments(state, true, options);

		// parse value
		let valueResult = parseExpression(state, options);
		if (valueResult) {
			state = valueResult.state;
			value = valueResult.result;
		}
	}

	let result = astFactory.propertyDeclaration(identifier, value, initializer, start, end);
	return {
		state,
		result
	}
}
export const parseFunction = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// [async] function ([args]) {[operations]}
	// or
	// [async] ([args]) => {[operations]}

	// save start point
	const start = getCursorPosition(state);

	// parse async
	let isAsync: boolean = false;
	const asyncResult = parseKeywordOfType(state, options, [KeywordType.Async]);
	if (asyncResult) {
		state = asyncResult.state;
		isAsync = true;
	}

	state = skipComments(state, true, options);

	// skip comments and whitespaces
	// parse keyword
	const keywordResult = parseKeywordOfType(state, options, [KeywordType.Function]);
	if (keywordResult) {
		state = keywordResult.state;
	}

	let isGenerator = false;
	if (getTokenOfType(state, [CodeTokenType.Star])) {
		isGenerator = true;
		state = skipTokens(state, 1);
	}

	// skip comments and whitespaces
	state = skipComments(state, true, options);

	// parse function name
	let name: IAstNode;
	const nameResult = parseIdentifier(state, options);
	if (nameResult) {
		name = nameResult.result;
		state = nameResult.state;
		state = skipComments(state, true, options);
	}

	// parse function parameters
	let parametersResult = parseFunctionParameters(state, {...options, isMultiline: true});
	if (!parametersResult) {
		return undefined;
	}
	state = parametersResult.state;
	const args: IAstNode[] = parametersResult.result || [];

	// skip comments and whitespaces
	state = skipComments(state, true, options);

	// parse =>
	let isLambda = false;
	const arrowResult = parseTokenSequence(state, [CodeTokenType.Equals, CodeTokenType.TupleClose]);

	if (keywordResult && arrowResult) {
		// it's lambda and 'function' function!
		state = arrowResult.state;
		state = addInvalidTokenSequenceError(state, arrowResult.result);
	}

	if (arrowResult) {
		state = arrowResult.state;
		isLambda = true;
	}

	// skip comments and whitespaces
	state = skipComments(state, true, options);

	// parse function body
	let bodyResult = parseCodeBlock(state, {...options, isMultiline: true, allowContextIdentifiers: false});
	if (!bodyResult) {
		return undefined;
	}
	state = bodyResult.state;
	const body = bodyResult.result;

	// prepare result
	const end = getCursorPosition(state);
	const isNoKeyword: boolean = keywordResult ? false : true;
	const result = astFactory.functionLiteral(name, args, body, isLambda, isAsync, isNoKeyword, isGenerator, start, end);

	return {
		state,
		result
	}
}
export const parseGetterSetter = (state: IParserState, options: IParserOptions): IParseResult<IAstKeywordNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	return parseKeywordNode(
		state, 
		true, 
		options, 
		[
			KeywordType.Get,
			KeywordType.Set
		],
		[
			parseFunction
		]
	)
}

// identifiers
export const parseIdentifier = (state: IParserState, options: IParserOptions): IParseResult<IAstIdentifier | IAstIdentifierScope> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	// read until keyword, separator
	let variableName: string = undefined;
	let nextToken: ICodeToken;
	let whitespace = "";

	while (nextToken = getToken(state)) {

		// parse escaped char
		let isEscapedChar = false;
		if (nextToken.type === CodeTokenType.Backslash) {
			let escapedToken = getToken(state, 1);
			if (escapedToken) {
				state = skipTokens(state, 1);
				nextToken = escapedToken;
				isEscapedChar = true;
			}
		}

		if (!isEscapedChar && separators.some((separatorType: CodeTokenType): boolean => nextToken.type === separatorType)) {
			// we've found separator. variable ends
			break;
		}

		// check for keywords
		if (!isEscapedChar && keywords.some((keyword: string) => keyword === nextToken.value)) {
			// we've found keyword. variable ends
			break;
		}

		// check space
		if (!isEscapedChar && nextToken.type === CodeTokenType.Space) {
			// variables don't start with space
			if (variableName === undefined) {
				return undefined;
			}

			whitespace += " ";
			state = skipTokens(state, 1);
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
		if (isEscapedChar && nextToken.type === CodeTokenType.Word) {
			switch (nextTokenChar) {
				case "t":
				case "r":
				case "n":
					{
						nextTokenValue = `\\${nextTokenValue}`;
					} break;
			}
		}
		else if (isEscapedChar) {
			// this is escaped char, but not escaped word

			// check \'
			if (isEscapedChar && nextToken.type === CodeTokenType.Prime) {
				nextTokenValue = `\\'`;
			}

			// check \"
			else if (isEscapedChar && nextToken.type === CodeTokenType.Quote) {
				nextTokenValue = `\\"`;
			}

			// any other escaped token
			else {
				nextTokenValue = `\\${nextTokenValue}`;
			}

		}

		variableName = variableName + whitespace + nextTokenValue;
		state = skipTokens(state, 1);
		whitespace = "";
	}

	if (variableName === undefined) {
		return undefined;
	}

	const isJsIdentifier: boolean = isValidJsIdentifier(variableName);

	// prepare result
	let result: IAstIdentifier = astFactory.identifier(variableName, isJsIdentifier, start, getCursorPosition(state));
	return {
		state,
		result
	}
}
export const parseIdentifierScope = (state: IParserState, options: IParserOptions): IParseResult<IAstIdentifierScope> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	let scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.Prime]),
		(state) => parseStringLiteralItem(state, {...options, isMultiline: true}),
		(state) => parseTokenSequence(state, [CodeTokenType.Prime]),
	);
	if (!scopeResult) {
		return undefined;
	}
	state = scopeResult.state;
	let value = scopeResult.result.content;
	let end = getCursorPosition(state);

	// prepare result
	let result = astFactory.IdentifierScope(value, start, end);

	return {
		result,
		state
	}
}
export const parseObjectLineIdentifier = (state: IParserState, options: IParserOptions): IParseResult<IAstIdentifier> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	// parse everything until the end of line or the '=' symbol
	const resultValues = [];
	let isEscaping: boolean = false;
	while (!isEndOfFile(state)) {
		const token = getToken(state);
		if (token.type == CodeTokenType.Endline || token.type == CodeTokenType.Endfile) {
			break;
		}

		if (!isEscaping && token.type == CodeTokenType.Equals) {
			break;
		}

		state = skipTokens(state, 1);
		resultValues.push(token.value ?? '');

		if (!isEscaping) {
			state = skipComments(state, false, emptyOptions);
		}

		if (token.type == CodeTokenType.Slash) {
			isEscaping = !isEscaping;
		}
	}

	const value = resultValues.join('').trim();
	const end = getCursorPosition(state);
	const isJsIdentifier: boolean = isValidJsIdentifier(value);

	// prepare result
	let result = astFactory.identifier(value, isJsIdentifier, start, end);

	return {
		result,
		state
	}
}
export const parseRawIdentifier = (state: IParserState, options: IParserOptions): IParseResult<IAstRawIdentifier> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// check @ mark
	if (getTokenOfType(state, [CodeTokenType.AtSign])) {
		let start = getCursorPosition(state);
		state = skipTokens(state, 1);

		// identifier scope
		let identScopeResult = parseIdentifierScope(state, options);
		if (identScopeResult) {
			state = identScopeResult.state;
			let end = getCursorPosition(state);
			let result = astFactory.rawIndentifier(identScopeResult.result, start, end);

			return {
				state,
				result
			}
		}

		// identifier
		let identifierResult = parseIdentifier(state, options);
		if (identifierResult) {
			state = identifierResult.state;
			let end = getCursorPosition(state);
			let result = astFactory.rawIndentifier(identifierResult.result, start, end);

			return {
				result,
				state
			}
		}
	}

	return undefined;
}
export const parseAnyIdentifier = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	return parseNode(state, {...options, isMultiline: false}, [
		parseRawIdentifier,
		parseIdentifierScope,
		parseIdentifier
	]);
}
export const parseContextIdentifier = (state: IParserState, options: IParserOptions): IParseResult<IAstContextIdentifier> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let identifierResult = parseAnyIdentifier(state, options);
	if (!identifierResult) {
		return undefined;
	}

	// prepare result
	state = identifierResult.state;
	let identifier = identifierResult.result;
	let start = identifier.start;
	let end = identifier.end;
	let result = astFactory.contextIndentifier(identifier, start, end);

	return {
		state,
		result
	}
}
/**
 * Operand identifier means: if no '@' symbol before identifier, it's context identifier (context['identifier'])
 */
export const parseOperandIdentifier = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	const parsers = options.allowContextIdentifiers
		? [parseRawIdentifier, parseContextIdentifier]
		: [parseRawIdentifier, parseIdentifierScope, parseIdentifier]
	;

	const nodeResult = parseNode(state, {...options, isMultiline: false}, parsers);
	if (nodeResult && !options.allowContextIdentifiers) {
		const identifierScope = astFactory.asNode<IAstIdentifierScope>(nodeResult.result, AstNodeType.IdentifierScope);
		if (identifierScope) {
			nodeResult.result = astFactory.contextIndentifier(identifierScope, identifierScope.start, identifierScope.end);
		}
		else {
			const identifierResult = astFactory.asNode<IAstIdentifier>(nodeResult.result, AstNodeType.Identifier);
			if (identifierResult && identifierResult.isJsIdentifier !== true) {
				nodeResult.result = astFactory.contextIndentifier(identifierResult, identifierResult.start, identifierResult.end);
			}
		}
	}

	return nodeResult;
}

// declarations
export const parseClassDeclaration = (state: IParserState, options: IParserOptions): IParseResult<IAstClassDeclaration> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const start = getCursorPosition(state);

	// parse class keyword
	const classResult = parseKeywordOfType(state, options, [KeywordType.Class]);
	if (!classResult) {
		return undefined;
	}

	state = classResult.state;
	state = skipComments(state, true, options);

	// parse name
	const nameResult = parseAnyIdentifier(state, options);
	if (!nameResult) {
		return undefined;
	}

	const name = nameResult.result;
	state = nameResult.state;
	state = skipComments(state, true, options);

	// parse contents
	const contentsResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.BraceOpen]),
		(state) => parseClassMember(state, {...options, isMultiline: true}),
		(state) => parseTokenSequence(state, [CodeTokenType.BraceClose]),
		(state) => skipComments(state, true, options)
	);

	let contents: IAstNode[] = [];
	if (contentsResult) {
		state = contentsResult.state;
		contents = contentsResult.result?.content ?? [];
	}

	const end = getCursorPosition(state);
	const result = astFactory.classDeclaration(name, contents, start, end);
	return {
		state,
		result
	}
}
export const parseClassMember = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse object literal item
	const itemResult = parseObjectLiteralItem(state, options);
	if (itemResult) {
		return itemResult;
	}

	// parse any statement? 
	const statementResult = parseStatement(state, options);
	if (statementResult) {
		return statementResult;
	}

	return undefined;
}
export const parseDeconstructionAssignment = (state: IParserState, options: IParserOptions): IParseResult<IAstDeconstructingAssignment> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const start = getCursorPosition(state);

	// parse array literal
	let variables: IAstNode = undefined;
	const arrayResult = parseArrayLiteral(state, {...options, isMultiline: true}, true);
	if (arrayResult) {
		state = arrayResult.state;
		variables = arrayResult.result
	}
	else {
		const objResult = parseObject(state, {...options, isMultiline: true});
		if (objResult)
		{
			state = objResult.state;
			variables = objResult.result;
		}
	}

	if (!variables) {
		return undefined;
	}

	state = skipComments(state, true, options);

	// parse =
	const equalsResult = parseOperatorOfType(state, options, [OperatorType.Equals]); 
	if (!equalsResult) {
		return undefined;
	}

	state = equalsResult.state;
	state = skipComments(state, true, options); 

	// parse identifier
	let initializer: IAstNode = undefined;
	const identifierResult = parseExpression(state, options);
	if (identifierResult) {
		state = identifierResult.state;
		initializer = identifierResult.result;
	}
	else {
		state = addParsingError(state, ParsingErrorType.Error, 'initialization expected', getCursorPosition(state), getCursorPosition(state));
	}

	const end = getCursorPosition(state);
	const result = astFactory.deconstructionAssignment(variables, initializer, start, end);
	
	return {
		state,
		result
	}
}
export const parseVariableDeclaration = (state: IParserState, options: IParserOptions): IParseResult<IAstVariableDeclaration> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// save start position
	let start = getCursorPosition(state);

	// var|let|const Identifier = Expression

	// parse keyword
	let keywordResult = parseKeywordOfType(state, options, [KeywordType.Var, KeywordType.Let, KeywordType.Const]);
	if (!keywordResult) {
		return undefined;
	}
	let keyword = keywordResult.result;
	state = keywordResult.state;

	// read declaration kind
	let kind: VariableDeclarationKind = undefined;
	switch (keyword.keywordType) {
		case KeywordType.Var: {
			kind = VariableDeclarationKind.Var;
		} break;
		case KeywordType.Const: {
			kind = VariableDeclarationKind.Const;
		} break;
		case KeywordType.Let: {
			kind = VariableDeclarationKind.Let;
		} break;

		default: return undefined;
	}

	// prepare break tokens
	let breakTokens = [CodeTokenType.Endfile, CodeTokenType.Semicolon];

	let identifiers = [];
	let initValue: IAstNode = undefined;
	
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		state = skipComments(state, true, options);

		// parse identifier
		let identifierResult = parseAnyIdentifier(state, options);
		if (identifierResult) {
			state = identifierResult.state;
			identifiers.push(identifierResult.result);
		} 
		else {
			// parse object expression
			let objResult = parseObject(state, options);
			if (objResult) {
				state = objResult.state;
				identifiers.push(objResult.result);
			}
			else {
				// parse array expression
				let arrayResult = parseArrayLiteral(state, {...options, isMultiline: true}, true);
				if (arrayResult) {
					state = arrayResult.state;
					identifiers.push(arrayResult.result);
				}
			}
		}	

		state = skipComments(state, true, emptyOptions);

		// now there can be a ',' which means we have another variable to parse
		if (getTokenOfType(state, [CodeTokenType.Comma])) {
			state = skipTokens(state, 1);
			continue;
		}

		break;
	}

	state = skipComments(state, true, options);

	// parse equals
	if (getTokenOfType(state, [CodeTokenType.Equals])) {
		/// skip equals token
		state = skipTokens(state, 1);
		state = skipComments(state, true, options);

		// parse init value expression
		let expressionResult = parseExpression(state, options);
		if (expressionResult) {
			state = expressionResult.state;
			initValue = expressionResult.result;
		}
	}

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.variableListDeclaration(identifiers, kind, initValue, start, end);
	return {
		state,
		result
	}
}

// expression statements
export const parseExpression = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	return parseNode(state, options, [
		parseKeywordExpression,
		parseOperationExpression
	]);
}
export const parseKeywordExpression = (state: IParserState, options: IParserOptions): IParseResult<IAstKeywordNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	return parseKeywordNode(
		state, 
		true, 
		options, 
		[
			KeywordType.New,
			KeywordType.Await,
			KeywordType.Yield,
			KeywordType.Delete,
			KeywordType.Typeof
		],
		[parseExpression]
	);
}
export const parseOperationExpression = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	// prefix
	let prefixStart = getCursorPosition(state);

	// parse unary prefix
	let prefixOperatorResult = parseUnaryOperatorPrefix(state, options);
	if (prefixOperatorResult) {
		state = prefixOperatorResult.state;
	}

	// parse first operand
	let operandResult = parseOperand(state, options);
	if (!operandResult) {
		return undefined;
	}
	state = operandResult.state;
	let result = operandResult.result;

	// check is there unary prefix
	if (prefixOperatorResult) {
		let prefixOperator = prefixOperatorResult.result;
		let prefixEnd = getCursorPosition(state);
		result = astFactory.updateExpression(result, prefixOperator, true, prefixStart, prefixEnd);
	}

	// parse operation
	let breakTokens = [CodeTokenType.Semicolon, CodeTokenType.Comma, CodeTokenType.BracketClose, CodeTokenType.ParenClose, CodeTokenType.BraceClose, CodeTokenType.Colon];
	if (!options.isMultiline) {
		breakTokens = [...breakTokens, CodeTokenType.Endline];
	}

	let finalState = state;
	while (!isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
		// skip comments
		let curPos = state.cursor;
		state = skipComments(state, true, options);
		if (state.cursor !== curPos) {
			continue;
		}

		// parse operation
		let operationResult = parseOperation(state, result, options);
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
	}
}

export const parseOperand = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	return parseNode(state, options, [
		parseLiteral,
		parseParenExpression,
		parseOperandIdentifier,
		(state) => parseKeywordOfType(state, options, [KeywordType.Null, KeywordType.Undefined])
	]);
}
export const parseOperation = (state: IParserState, leftOperand: IAstNode, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse member expression
	let memberResult = parseMemberExpression(state, leftOperand, options);
	if (memberResult) {
		return memberResult;
	}

	// parse call expression
	let callResult = parseCallExpression(state, leftOperand, options);
	if (callResult) {
		return callResult;
	}

	// parse indexer expression
	let indexerResult = parseIndexerExpression(state, leftOperand, options);
	if (indexerResult) {
		return indexerResult;
	}

	// parse update expression
	let updateResult = parseUpdateExpressionPostfix(state, leftOperand, options);
	if (updateResult) {
		return updateResult;
	}

	// parse binary expression
	let binaryResult = parseBinaryExpression(state, leftOperand, options);
	if (binaryResult) {
		return binaryResult;
	}

	// parse conditional expression
	let conditionalExpressionResult = parseConditionalExpression(state, leftOperand, options);
	if (conditionalExpressionResult) {
		return conditionalExpressionResult;
	}

	return undefined;
}
export const parseParenExpression = (state: IParserState, options: IParserOptions): IParseResult<IAstParenExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse open paren
	if (!getTokenOfType(state, [CodeTokenType.ParenOpen])) {
		return undefined;
	}
	let start = getCursorPosition(state);
	state = skipTokens(state, 1);

	// skip comments
	state = skipComments(state, true, options);

	// parse expression
	let expression: IAstNode = undefined;
	let expressionResult = parseExpression(state, options);
	if (expressionResult) {
		expression = expressionResult.result;
		state = expressionResult.state;
	}

	// skip comments and whitespaces
	state = skipComments(state, true, options);

	// skip everything until close token )
	state = parseErrorTokens(state, (st) => getTokenOfType(st, [CodeTokenType.ParenClose]) !== undefined);

	// parse close paren
	if (getTokenOfType(state, [CodeTokenType.ParenClose])) {
		state = skipTokens(state, 1);
	}
	else {
		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"Expected ) token not found",
			getCursorPosition(state),
			getCursorPosition(state)
		);
	}

	let end = getCursorPosition(state);
	let result = astFactory.parenExpression(expression, start, end);

	return {
		result,
		state
	}
}
export const parseCallExpression = (state: IParserState, leftOperand: IAstNode, options: IParserOptions): IParseResult<IAstCallExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// skip comments and whitespaces
	state = skipComments(state, true, options);

	let start = getCursorPosition(state);

	// parse function args
	let funcArgsResult = parseCallArguments(state, {...options, isMultiline: true});
	if (!funcArgsResult) {
		return undefined;
	}
	state = funcArgsResult.state;
	let args: IAstNode[] = funcArgsResult.result;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.callExpression(leftOperand, args, start, end);

	return {
		result,
		state
	}
}
export const parseCallArguments = (state: IParserState, options: IParserOptions): IParseResult<IAstNode[]> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse open token
	if (!getTokenOfType(state, [CodeTokenType.ParenOpen])) {
		return undefined;
	}
	state = skipTokens(state, 1);

	// parse expressions separated by , or ; or endline until close token
	let result: IAstNode[] = [];
	while (!isEndOfFile(state) && !getTokenOfType(state, [CodeTokenType.ParenClose])) {
		// skip whitespace and comments
		state = skipComments(state, true, options);

		// parse expression
		let expressionResult = parseExpression(state, options);
		if (expressionResult) {
			state = expressionResult.state;
			result = [
				...result,
				expressionResult.result
			];

			continue;
		}

		// skip separator
		if (getTokenOfType(state, [CodeTokenType.Comma, CodeTokenType.Endline, CodeTokenType.Semicolon])) {
			state = skipTokens(state, 1);
			continue;
		}

		// skip whitespace
		let prevCursor = state.cursor;
		let newState = skipComments(state, true, options);
		if (newState && newState.cursor > prevCursor) {
			state = newState;
			continue;
		}

		// check break tokens
		if (getTokenOfType(state, [CodeTokenType.ParenClose])) {
			break;
		}

		// otherwise it's invalid symbol
		let nextToken = getToken(state);
		let errorStart = getCursorPosition(state);
		state = skipTokens(state, 1);
		let errorEnd = getCursorPosition(state);
		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"invalid symbol '" + nextToken.value || nextToken.type + "'",
			errorStart,
			errorEnd
		);
	}

	// parse close token
	if (getTokenOfType(state, [CodeTokenType.ParenClose])) {
		state = skipTokens(state, 1);
	}

	return {
		result,
		state
	}
}
export const parseIndexerExpression = (state: IParserState, leftOperand: IAstNode, options: IParserOptions): IParseResult<IAstIndexerExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse leftOperand [ indexerValue ]
	let start = getCursorPosition(state);

	// parse open token
	if (!getTokenOfType(state, [CodeTokenType.BracketOpen])) {
		return undefined;
	}
	state = skipTokens(state, 1);

	// skip comments and whitespaces
	state = skipComments(state, true, options);

	// parse property
	let property: IAstNode = undefined;
	let expressionResult = parseExpression(state, options);
	if (expressionResult) {
		property = expressionResult.result;
		state = expressionResult.state;
	}

	// skip comments and whitespaces
	state = skipComments(state, true, options);

	// skip everything until close token
	while (!isEndOfFile(state) && !getTokenOfType(state, [CodeTokenType.BracketClose])) {
		let errorStart = getCursorPosition(state);
		let errorToken = getToken(state);
		state = skipTokens(state, 1);
		let errorEnd = getCursorPosition(state);

		state = addParsingError(
			state,
			ParsingErrorType.Error,
			`invalid token '${errorToken.value || errorToken.type}'`,
			errorStart,
			errorEnd
		)
	}

	// parse close token
	if (getTokenOfType(state, [CodeTokenType.BracketClose])) {
		state = skipTokens(state, 1);
	}

	// prepare result
	let end = getCursorPosition(state);
	let member = astFactory.memberExpression(leftOperand, property, false, start, end);
	let result = astFactory.IndexerExpression(member, start, end);

	return {
		result,
		state
	}
}
export const parseUpdateExpressionPostfix = (state: IParserState, leftOperand: IAstNode, options: IParserOptions): IParseResult<IAstUpdateExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let operatorResult = parseUnaryOperatorPostfix(state, options);
	if (!operatorResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = operatorResult.state;
	let operator = operatorResult.result;

	let end = getCursorPosition(state);
	let result = astFactory.updateExpression(leftOperand, operator, false, start, end);

	return {
		state,
		result
	}
}
export const parseBinaryExpression = (state: IParserState, leftOperand: IAstNode, options: IParserOptions): IParseResult<IAstBinaryExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse operator
	let operatorResult = parseBinaryOperator(state, options);
	if (!operatorResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = operatorResult.state;
	let operator = operatorResult.result;
	let rightStart = getCursorPosition(state);

	// skip comments and whitespaces
	state = skipComments(state, true, options);

	// parse right operand
	let rightOperand: IAstNode;
	let rightOperandResult = parseExpression(state, options);
	if (rightOperandResult) {
		state = rightOperandResult.state;
		rightOperand = rightOperandResult.result;
	}
	else {
		// add parsing error
		state = addParsingError(
			state,
			ParsingErrorType.Error,
			`here should be right operand, but no one parsed`,
			rightStart,
			getCursorPosition(state)
		);
	}

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.binaryExpression(leftOperand, operator, rightOperand, start, end);

	return {
		result,
		state
	}
}
export const parseMemberExpression = (state: IParserState, leftOperand: IAstNode, options: IParserOptions): IParseResult<IAstMemberExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse leftOperand . [identifier]
	
	// parse ? (optional chaining)
	let isOptional = false;
	if (getTokenOfType(state, [CodeTokenType.Question])) {
		isOptional = true;
		state = skipTokens(state, 1);
	}
	
	// parse .
	if (!getTokenOfType(state, [CodeTokenType.Dot])) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = skipTokens(state, 1);

	// skip comments and whitespace
	state = skipComments(state, true, options);

	// parse identifier
	let identifierResult = parseAnyIdentifier(state, options);
	if (identifierResult) {
		state = identifierResult.state;
		let identifier = identifierResult.result;

		// prepare result
		let end = getCursorPosition(state);
		let result = astFactory.memberExpression(leftOperand, identifier, isOptional, start, end);

		return {
			state,
			result
		}
	}

	return undefined;
}
export const parseConditionalExpression = (state: IParserState, condition: IAstNode, options: IParserOptions): IParseResult<IAstConditionalExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse question token
	let questionTokenResult = getTokenOfType(state, [CodeTokenType.Question]);
	if (!questionTokenResult) {
		return undefined;
	}
	let questionToken = astFactory.token(questionTokenResult, questionTokenResult.start);
	let start = getCursorPosition(state);
	state = skipTokens(state, 1);
	let finalState = state;

	let breakTokens = options.isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens.push(CodeTokenType.Semicolon);

	let whenTrue: IAstNode;
	let whenFalse: IAstNode;
	let colonToken: IAstNode;
	// parse operator content
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, options);

		// parse when true
		let rightOperandResult = parseExpression(state, options);
		if (rightOperandResult) {
			state = rightOperandResult.state;
			whenTrue = rightOperandResult.result;
			finalState = state;
		}

		state = skipComments(state, true, options);

		// check sequence end
		if (getTokenOfType(state, breakTokens)) break;
		// skip comments and whitespaces
		state = skipComments(state, true, options);
		// skip everything until break tokens or colon
		state = parseErrorTokens(state, (state) => getTokenOfType(state, [...breakTokens, CodeTokenType.Colon]) !== undefined);
		// check sequence end
		if (getTokenOfType(state, breakTokens)) break;

		// parse colon
		let colToken = getTokenOfType(state, [CodeTokenType.Colon]);
		if (colToken) {
			state = skipTokens(state, 1);
			finalState = state;
			colonToken = astFactory.token(colToken, colToken.start);
		}

		// check sequence end
		if (getTokenOfType(state, breakTokens)) break;
		// skip comments and whitespaces
		state = skipComments(state, true, options);
		// check sequence end
		if (getTokenOfType(state, breakTokens)) break;

		// parse whenFalse
		let whenFalseResult = parseExpression(state, options);
		if (whenFalseResult) {
			whenFalse = whenFalseResult.result;
			state = whenFalseResult.state;
			finalState = whenFalseResult.state;
		}

		break;
	}
	state = finalState;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.conditionalExpression(
		condition,
		whenTrue,
		whenFalse,
		colonToken,
		questionToken,
		start,
		end);

	return {
		result,
		state
	}
}
export const parseNewExpression = (state: IParserState, options: IParserOptions): IParseResult<IAstKeywordNode> => {
	return parseKeywordNode(
		state, 
		true, 
		options, 
		[KeywordType.New],
		[parseExpression]
	);
}
export const parseAwaitExpression = (state: IParserState, options: IParserOptions): IParseResult<IAstKeywordNode> => {
	return parseKeywordNode(
		state, 
		true, 
		options, 
		[KeywordType.Await],
		[parseExpression]
	);
}
export const parseYieldExpression = (state: IParserState, options: IParserOptions): IParseResult<IAstKeywordNode> => {
	return parseKeywordNode(
		state, 
		true, 
		options, 
		[KeywordType.Yield],
		[parseExpression]
	);
}
export const parseDeleteExpression = (state: IParserState, options: IParserOptions): IParseResult<IAstKeywordNode> => {
	return parseKeywordNode(
		state, 
		true, 
		options, 
		[KeywordType.Delete],
		[parseExpression]
	);
}
export const parseTypeofExpression = (state: IParserState, options: IParserOptions): IParseResult<IAstKeywordNode> => {
	return parseKeywordNode(
		state, 
		true, 
		options, 
		[KeywordType.Typeof],
		[parseExpression]
	);
}

// storytailor-specific

export const parseTag = (state: IParserState, options: IParserOptions): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse scope from < to >
	let scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.TupleOpen]),
		(state) => parseToken(state),
		(state) => parseTokenSequence(state, [CodeTokenType.TupleClose]),
		undefined,
		(state) => checkTokenSequence(state, [CodeTokenType.TupleClose])
	);
	if (!scopeResult) {
		return undefined;
	}

	state = scopeResult.state;
	let scope = scopeResult.result;
	let result = astFactory.tag(scope.content, scope.open, scope.close, scope.start, scope.end);

	return {
		state,
		result
	}
}


// SYSTEM FUNCTIONS
export const parseNode = (state: IParserState, options: IParserOptions, parsers: ParserFunction[]): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	if (!parsers || parsers.length <= 0) {
		return undefined;
	}

	for (let fIndex = 0; fIndex < parsers.length; fIndex++) {
		const parser = parsers[fIndex];
		const parseResult = parser(state, options)
		if (parseResult) {
			return parseResult;
		}
	}

	return undefined;
}

export const parseKeywordNode = (
	state: IParserState, 
	isKeywordFirst: boolean, 
	options: IParserOptions, 
	keywords: KeywordType[],
	parsers: ParserFunction[] 
): IParseResult<IAstKeywordNode> => {
	if (isEndOfFile(state) || !parsers || parsers.length <= 0 || !keywords || keywords.length <= 0) {
		return undefined;
	}

	const start = getCursorPosition(state);

	// parse keyword
	let keyword: IAstKeyword = undefined;
	if (isKeywordFirst === true) {
		const keywordResult = parseKeywordOfType(state, options, keywords);
		if (!keywordResult) {
			return undefined;
		}

		keyword = keywordResult.result;
		state = keywordResult.state;
		state = skipComments(state, true, options);
	}

	// parse node
	let node: IAstNode = undefined;
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
		state = skipComments(state, true, options);
		const keywordResult = parseKeywordOfType(state, options, keywords);
		if (!keywordResult) {
			return undefined;
		}

		keyword = keywordResult.result;
		state = keywordResult.state;
	}

	const end = getCursorPosition(state);
	const result = astFactory.keywordNode(keyword, node, isKeywordFirst, start, end);
	return {
		state,
		result
	}
}

export const parseToken = (state: IParserState): IParseResult<IAstToken> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// get token and create ast node
	var token = getToken(state);
	var astToken = astFactory.token(token, getCursorPosition(state));

	// skip 1 token 
	state = skipTokens(state, 1);

	return {
		result: astToken,
		state: state
	}
}

export const parseScope = (
	state: IParserState,
	openFilter: (stat: IParserState) => IParseResult<IAstNode>,
	itemFilter: (stat: IParserState) => IParseResult<IAstNode>,
	closeFilter: (stat: IParserState) => IParseResult<IAstNode>,
	skipOptional?: (stat: IParserState) => IParserState,
	breakFilter?: (stat: IParserState) => boolean,
	separatorFilter?: (stat: IParserState) => IParseResult<IAstNode>,
): IParseResult<IAstScope> => {

	if (isEndOfFile(state)) {
		return undefined;
	}

	if (!openFilter || !itemFilter || !closeFilter) {
		return undefined;
	}

	// save start position
	let start = getCursorPosition(state);

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
	let items: IAstNode[] = [];
	let finalState = state;
	while (!isEndOfFile(state) && !closeFilter(state) && !breakFilter(state)) {
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
		state = addInvalidTokenError(state, getToken(state));
		state = skipTokens(state, 1);
		finalState = state;
	}

	state = finalState;

	// parse close node
	let closeResult = closeFilter(state);
	let close: IAstNode = undefined;
	if (closeResult) {
		close = closeResult.result;
		state = closeResult.state;
	}

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.scope(items, open, close, start, end);

	return {
		result,
		state
	}
}

/// Every token until the endSequence filter will be marked as incorrect token
export const parseErrorTokens = (state: IParserState, endSequence: (state: IParserState) => boolean): IParserState => {
	while (!isEndOfFile(state)) {
		// skip comments if any
		let curPos = state.cursor;
		state = skipComments(state, false, emptyOptions);
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
		let errorStart = getCursorPosition(state);
		let errorToken = getToken(state);
		state = skipTokens(state, 1);
		let errorEnd = getCursorPosition(state);

		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"Unexpected token '" + errorToken.value || errorToken.type + "'",
			errorStart,
			errorEnd
		)
	}

	return state;
}

export const readString = (state: IParserState, breakTokens: CodeTokenType[], trimString: boolean = false): IParseResult<string> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let result: string;
	let nextToken: ICodeToken;
	let offset = 0;

	while (nextToken = getToken(state, offset)) {
		if (!nextToken) {
			break;
		}

		if (breakTokens.indexOf(nextToken.type) >= 0) {
			let escapedRegexp: RegExp = /(^|^.*?[^\\](\\\\)*)\\$/;

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

	state = skipTokens(state, offset);

	if (trimString) {
		result = result.trim();
	}

	if (!result) {
		return undefined;
	}

	return {
		result,
		state
	}
}

export const readWhitespace = (state: IParserState): IParseResult<string> => {
	let result = readTokensAsString(state, [CodeTokenType.Space, CodeTokenType.Tab]);
	return result;
}

export const calcIndentFromWhitespace = (whitespace: string): number => {
	if (!whitespace) {
		return 0;
	}

	whitespace = whitespace.replace(/\t/g, indentWhitespaceString);
	const result = Math.trunc(whitespace.length);
	return result;
}

export const readTokensAsString = (state: IParserState, tokenTypes: CodeTokenType[]): IParseResult<string> => {
	let value: string;
	let nextToken: ICodeToken;

	while (nextToken = getTokenOfType(state, tokenTypes)) {
		value = (value || '') + nextToken.value;
		state = skipTokens(state, 1);
	}

	if (!value) {
		return undefined;
	}

	return {
		state: state,
		result: value
	}
}

export const isEndOfFile = (state: IParserState, offset: number = 0): boolean => {
	if (!state || !state.tokens || state.tokens.length <= 0) {
		return true;
	}

	const cursor = state.cursor + offset;
	return state.tokens.length <= cursor;
}

export const isValidJsIdentifier = (variableName: string): boolean => {
	if (!variableName || variableName === '') {
		return false;
	}

	// check is this identifier is a valid javascript identifier
	const regex = /^[$_\p{L}][$_\p{L}\p{N}]*$/u;
	const isJsIdentifier: boolean = regex.test(variableName);
	return isJsIdentifier;
}

export const addItemToArray = <T = any>(source: T[], item: T): T[] => {
	source = source || [];
	return [
		...source,
		item
	]
}
export const addItemToHash = <T = any>(source: IHash<T>, key: string, item: T): IHash<T> => {
	source = source || {};
	return {
		...source,
		[key]: item
	}
}

export const getToken = (state: IParserState, offset: number = 0): ICodeToken => {
	if (isEndOfFile(state, offset)) {
		return undefined;
	}

	const cursor = state.cursor + offset;
	if (cursor < 0) {
		return undefined;
	}

	return state.tokens[cursor];
}
export const getTokenOfType = (state: IParserState, types: CodeTokenType[], offset: number = 0): ICodeToken => {
	if (isEndOfFile(state, offset)) {
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
}
export const getCursorPosition = (state: IParserState): ISymbolPosition => {
	if (!state) {
		return undefined;
	}

	if (isEndOfFile(state)) {
		if (state.tokens.length > 0) {
			let lastToken = state.tokens[state.tokens.length - 1];
			return lastToken.start;
		}
	}

	const nextToken = getToken(state);
	return nextToken.start;
}

export const skipComments = (state: IParserState, isSkipWhitespace: boolean = false, options: IParserOptions = emptyOptions): IParserState => {
	while (true) {
		if (isSkipWhitespace === true) {
			state = skipWhitespace(state, options);
		}

		let commentBlockResult = parseCommentBlock(state, options);
		if (commentBlockResult) {
			state = commentBlockResult.state;
			continue;
		}

		let commentLineResult = parseCommentLine(state, options);
		if (commentLineResult) {
			state = commentLineResult.state;
			continue;
		}

		if (isSkipWhitespace === true) {
			state = skipWhitespace(state, options);
		}

		break;
	}

	return state;
}
export const skipCommentLine = (state: IParserState, options: IParserOptions): IParserState => {
	let parseResult = parseCommentLine(state, options);
	if (parseResult) {
		return parseResult.state;
	}

	return undefined;
}
export const skipCommentBlock = (state: IParserState, options: IParserOptions): IParserState => {
	let parseResult = parseCommentBlock(state, options);
	if (parseResult) {
		return parseResult.state;
	}

	return undefined;
}

export const skipWhitespace = (state: IParserState, options: IParserOptions): IParserState => {
	const tokenTypes = options?.isMultiline === true
		? [CodeTokenType.Space, CodeTokenType.Tab, CodeTokenType.Endline]
		: [CodeTokenType.Space, CodeTokenType.Tab];
	return skipTokensOfType(state, tokenTypes);
}
export const skipTokenOfType = (state: IParserState, tokenTypes: CodeTokenType[]): IParserState => {
	let nextToken = getTokenOfType(state, tokenTypes);
	if (nextToken) {
		state = skipTokens(state, 1);
	}

	return state;
}
export const skipTokensOfType = (state: IParserState, tokenTypes: CodeTokenType[]): IParserState => {
	if (isEndOfFile(state)) {
		return state;
	}

	if (!tokenTypes || tokenTypes.length <= 0) {
		return state;
	}

	let nextToken: ICodeToken;
	while (nextToken = getToken(state)) {
		if (tokenTypes.indexOf(nextToken.type) < 0) {
			return state;
		}

		state = skipTokens(state, 1);
	}

	return state;
}
export const skipUntil = (state: IParserState, tokenTypes: CodeTokenType[]): IParserState => {
	if (isEndOfFile(state)) {
		return state;
	}

	if (!tokenTypes || tokenTypes.length <= 0) {
		return state;
	}

	let nextToken: ICodeToken;
	while (nextToken = getToken(state)) {
		if (tokenTypes.indexOf(nextToken.type) >= 0) {
			return state;
		}

		state = skipTokens(state, 1);
	}

	return state;
}

export const checkTokenSequence = (state: IParserState, tokenTypes: CodeTokenType[]): boolean => {
	if (isEndOfFile(state)) {
		return false;
	}

	if (!tokenTypes || tokenTypes.length <= 0) {
		return true;
	}

	for (let i = 0; i < tokenTypes.length; i++) {
		const tokenType = tokenTypes[i];
		const token = getToken(state, i);
		if (!token || token.type !== tokenType) {
			// broken sequence
			return undefined;
		}
	}

	return true;
}
export const parseTokenSequence = (state: IParserState, tokenTypes: CodeTokenType[]): IParseResult<IAstTokenSequence> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	if (!tokenTypes || tokenTypes.length <= 0) {
		return undefined;
	}

	let start = getCursorPosition(state);
	let tokens: ICodeToken[] = [];
	for (let i = 0; i < tokenTypes.length; i++) {
		const tokenType = tokenTypes[i];
		const token = getToken(state);
		if (!token || token.type !== tokenType) {
			// broken sequence
			return undefined;
		}

		// otherwise, add token to result sequence
		tokens = [...tokens, token];
		state = skipTokens(state, 1);
	}

	let end = getCursorPosition(state);
	let result = astFactory.tokenSequence(tokens, start, end);

	return {
		result,
		state
	}
}
export const checkTokenSequences = (state: IParserState, sequences: CodeTokenTypeSequence[]): CodeTokenTypeSequence => {
	if (isEndOfFile) {
		return undefined;
	}

	// parse open sequence
	for (let seqIndex = 0; seqIndex < sequences.length; seqIndex++) {
		const sequence = sequences[seqIndex];
		if (checkTokenSequence(state, sequence)) {
			return sequence;
		}
	}

	return undefined;
}
export const parseTokenSequences = (state: IParserState, sequences: CodeTokenTypeSequence[]): IParseResult<{
	tokens: CodeTokenTypeSequence,
	sequence: IAstTokenSequence
}> => {
	if (isEndOfFile) {
		return undefined;
	}

	// parse open sequence
	for (let seqIndex = 0; seqIndex < sequences.length; seqIndex++) {
		const sequence = sequences[seqIndex];
		let sequenceResult = parseTokenSequence(state, sequence);
		if (sequenceResult) {

			// prepare result
			let result = {
				tokens: sequence,
				sequence: sequenceResult.result
			};

			return {
				state,
				result
			}
		}
	}

	return undefined;
}

export const skipTokens = (state: IParserState, tokensCount: number): IParserState => {
	if (isEndOfFile(state)) {
		if (tokensCount === 0)
			return state;

		return undefined;
	}

	const cursor = state.cursor + tokensCount;
	if (state.tokens.length < cursor) {
		return undefined;
	}

	state = {
		...state,
		cursor: cursor,
	}

	return state;
}

export const addParsingError = (state: IParserState, severity: ParsingErrorType, message: string, start: ISymbolPosition, end: ISymbolPosition, code?: string | number, source?: string): IParserState => {
	if (!state) {
		return undefined;
	}

	let parsingError: IDiagnostic = {
		severity,
		message,
		range: {
			start,
			end
		},
		code,
		source
	};

	state = {
		...state,
		errors: [...state.errors, parsingError]
	};

	return state;
}
export const addInvalidTokenError = (state: IParserState, token: ICodeToken): IParserState => {
	if (!token || !state) {
		return state;
	}

	return addParsingError(
		state,
		ParsingErrorType.Error,
		`Invalid token '${token.value || token.type}'`,
		token.start,
		token.end
	);
}
export const addInvalidTokenSequenceError = (state: IParserState, tokens: IAstTokenSequence): IParserState => {
	
	let tokensText = [];
	tokens?.tokens?.forEach(token => {
		tokensText.push(token.value || token.type);
	});

	return addParsingError(
		state,
		ParsingErrorType.Error,
		`invalid tokens '${tokensText.join("")}'`,
		tokens.start,
		tokens.end
	);
}

export const prepareTokens = (tokens: ICodeToken[]): ICodeToken[] => {
	if (!tokens) {
		return tokens;
	}

	let result: ICodeToken[] = [];

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		if (token.type === CodeTokenType.CommentLine) {
			result = [
				...result,
				{
					start: token.start,
					end: { ...token.start, symbol: token.start.symbol + 1, column: token.start.column + 1 },
					length: 1,
					type: CodeTokenType.Slash,
					value: "/"
				},
				{
					start: { ...token.start, symbol: token.start.symbol + 1, column: token.start.column + 1 },
					end: token.end,
					length: 1,
					type: CodeTokenType.Slash,
					value: "/"
				}
			];

			continue;
		}

		if (token.type === CodeTokenType.CommentBlockOpen) {
			result = [
				...result,
				{
					start: token.start,
					end: { ...token.start, symbol: token.start.symbol + 1, column: token.start.column + 1 },
					length: 1,
					type: CodeTokenType.Slash,
					value: "/"
				},
				{
					start: { ...token.start, symbol: token.start.symbol + 1, column: token.start.column + 1 },
					end: token.end,
					length: 1,
					type: CodeTokenType.Star,
					value: "*"
				}
			];

			continue;
		}

		if (token.type === CodeTokenType.CommentBlockClose) {
			result = [
				...result,
				{
					start: token.start,
					end: { ...token.start, symbol: token.start.symbol + 1, column: token.start.column + 1 },
					length: 1,
					type: CodeTokenType.Star,
					value: "*"
				},
				{
					start: { ...token.start, symbol: token.start.symbol + 1, column: token.start.column + 1 },
					end: token.end,
					length: 1,
					type: CodeTokenType.Slash,
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
}

export const emptyOptions: IParserOptions = {
	isMultiline: false,
	allowContextIdentifiers: false
}

export const optionsOuterLine: IParserOptions = {
	isMultiline: false,
	allowContextIdentifiers: true
}

export const optionsCodeBlock: IParserOptions = {
	isMultiline: true,
	allowContextIdentifiers: false
}