import { ICodeToken } from "../shared/ICodeToken";
import { ISymbolPosition } from "../shared/ISymbolPosition";
import { IHash } from "../shared/IHash";
import { CodeTokenType, CodeTokenTypeSequence } from "../shared/CodeTokenType";
import { ParsingErrorType, IDiagnostic } from "../shared/IParsingError";
import { KeywordType } from "../ast/KeywordType";
import { VariableDeclarationKind } from "../ast/VariableDeclarationKind";
import { OperatorType } from "../ast/OperatorType";
import { IAstToken, IAstOperator, IAstKeyword, IAstModule, IAstNode, IAstCommentLine, IAstCommentBlock, IAstNumber, IAstString, IAstStringIncludeStatement, IAstBoolean, IAstArray, IAstIdentifier, IAstIdentifierScope, IAstRawIdentifier, IAstFunctionExpression, IAstFunctionDeclaration, IAstProgram, IAstVariableDeclaration, IAstPropertyDeclaration, IAstBreakStatement, IAstReturnStatement, IAstContinueStatement, IAstBlockStatement, IAstIfStatement, IAstSwitchStatement, IAstCaseStatement, IAstDoWhileStatement, IAstWhileStatement, IAstForStatement, IAstForInStatement, IAstImportStatement, IAstParenExpression, IAstObjectExpression, IAstCallExpression, IAstIndexerExpression, IAstUpdateExpression, IAstBinaryExpression, IAstMemberExpression, IAstOuterStatement, IAstTextLineStatement, IAstObjectLineStatement, IAstPrototypeExpression, IAstScope, IAstTokenSequence, IAstConditionalExpression, IAstTag, IAstTryStatement, IAstCatchStatement, IAstFinallyStatement, IAstNewExpression, IAstThrowStatement, IAstDebuggerKeyword, IAstDeleteExpression, IAstDeleteLineExpression, IAstContextIdentifier, IAstTypeofExpression } from "../ast/IAstNode";
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

export const defaultParserConfig: IParserConfig = {
	indentSize: 2
}

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

	// parses any content that can be in the root of module

	// skip comments
	const newState = skipComments(state, false, false);

	// skip the fully commented line
	if (getTokenOfType(state, [CodeTokenType.Endfile]) && newState.cursor > state.cursor) {
		
		return {
			state: skipTokens(newState, 1),
			result: undefined
		}
	}

	// if we're here, that means it's not the end of line and we've skipped all the comments already
	// parse outer expression
	let outerExpressionResult = parseOuterStatement(state);
	if (outerExpressionResult) {
		return outerExpressionResult;
	}

	// parse text line
	let textLineResult = parseTextLineStatement(state);
	if (textLineResult) {
		return textLineResult;
	}
	
	// if we did not manage to find anything, return nothing
	return undefined;
}
export const parseOuterStatement = (state: IParserState): IParseResult<IAstOuterStatement> => {
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
	state = skipComments(state, true, false);

	// parse statement
	let statement: IAstNode = undefined;
	let contentResult = parseOuterStatementContent(state);
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
	state = skipComments(state, true, false);

	// any excess symbols until endline are invalid
	state = parseErrorTokens(state, (stat) => !getTokenOfType(stat, [CodeTokenType.Endline]));

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
export const parseOuterStatementContent = (state: IParserState): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// Parse Block
	let codeLineResult = parseCodeBlock(state, true);
	if (codeLineResult) {
		return codeLineResult;
	}

	let deleteLineResult = parseDeleteLineExpression(state);
	if (deleteLineResult) {
		return deleteLineResult;
	}

	// Parse Object Line Statement
	let objectLineResult = parseObjectLine(state);
	if (objectLineResult) {
		return objectLineResult;
	}

	// Parse Statement
	let statementResult = parseStatement(state, false);
	if (statementResult) {
		return statementResult;
	}

	return undefined;
}
export const parseObjectLine = (state: IParserState): IParseResult<IAstObjectLineStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// Object Name: Prototype || Object Name = Value Expression

	// identifier [tags] [= initExpression]
	let identifierResult = parseAnyIdentifier(state);
	if (!identifierResult) {
		return undefined;
	}
	const identifier = identifierResult.result;
	const start = identifier?.start;
	state = identifierResult.state;

	// skip comments
	state = skipComments(state, true, false);

	// parse tags
	let tags: IAstNode[] = undefined;
	const tagsResult = parseObjectLineTags(state, false);
	if (tagsResult) {
		state = tagsResult.state;
		tags = tagsResult.result;
	}

	// skip comments
	state = skipComments(state, true, false);
	
	// read init operation
	let initValue: IAstNode = undefined;
	if (getTokenOfType(state, [CodeTokenType.Equals])) {
		state = skipTokens(state, 1);

		// skip comments
		state = skipComments(state, true, false);

		// read init value
		let initValueResult = parseExpression(state, false);
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
export const parseDeleteLineExpression = (state: IParserState): IParseResult<IAstDeleteLineExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// delete Object Name

	// parse delete keyword
	let deleteResult = parseKeywordOfType(state, [KeywordType.Delete]);
	if (!deleteResult) {
		return undefined;
	}

	const start = getCursorPosition(state);
	state = deleteResult.state;

	// skip whitespace
	state = skipComments(state, true, false);

	// parse identifier
	let identifier: IAstNode = undefined;
	let identifierResult = parseOperandIdentifier(state);
	if (identifierResult) {
		identifier = identifierResult.result;
		state = identifierResult.state;
	}

	let end = getCursorPosition(state);

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
export const parseTextLineStatement = (state: IParserState): IParseResult<IAstTextLineStatement> => {
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
	while (!isEndOfFile(state) && !getTokenOfType(state, [CodeTokenType.Endline])) {
		// skip comments
		state = skipComments(state, false, false);

		if (isEndOfFile(state) || getTokenOfType(state, [CodeTokenType.Endline])) {
			break;
		}

		// parse word
		let stringItem = parseStringLiteralItem(state);
		if (stringItem) {
			state = stringItem.state;
			content = [
				...content,
				stringItem.result
			];
		}

		// skip comments
		state = skipComments(state, false, false);
		continue;
	}

	if (getTokenOfType(state, [CodeTokenType.Endline])) {
		state = skipTokens(state, 1);
	}

	let end = getCursorPosition(state);


	let result: IAstTextLineStatement = astFactory.textLineStatement(
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

export const parseStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// var declaration
	let varDeclarResult = parseVariableDeclaration(state, isMultiline);
	if (varDeclarResult) {
		return varDeclarResult;
	}

	// function Func() {}
	let funcResult = parseFunctionDeclaration(state, isMultiline);
	if (funcResult) {
		return funcResult;
	}

	// break
	let breakResult = parseBreakStatement(state);
	if (breakResult) {
		return breakResult
	}

	// return
	let returnResult = parseReturnStatement(state, isMultiline);
	if (returnResult) {
		return returnResult;
	}

	// continue
	let continueResult = parseContinueStatement(state);
	if (continueResult) {
		return continueResult;
	}

	// if
	let ifResult = parseIfStatement(state, isMultiline);
	if (ifResult) {
		return ifResult;
	}

	// switch
	let switchResult = parseSwitchStatement(state, isMultiline);
	if (switchResult) {
		return switchResult;
	}

	// while
	let whileResult = parseWhileStatement(state, isMultiline);
	if (whileResult) {
		return whileResult;
	}

	// doWhile
	let doWhileResult = parseDoWhileStatement(state, isMultiline);
	if (doWhileResult) {
		return doWhileResult;
	}

	// for of
	let forOfResult = parseForOfStatement(state, isMultiline);
	if (forOfResult) {
		return forOfResult;
	}

	// for in
	let forInResult = parseForInStatement(state, isMultiline);
	if (forInResult) {
		return forInResult;
	}

	// for
	let forResult = parseForStatement(state, isMultiline);
	if (forResult) {
		return forResult;
	}

	// import
	let importResult = parseImportStatement(state);
	if (importResult) {
		return importResult;
	}

	// try
	let tryResult = parseTryStatement(state, isMultiline);
	if (tryResult) {
		return tryResult;
	}

	// catch
	let catchResult = parseCatchStatement(state, isMultiline);
	if (catchResult) {
		return catchResult;
	}

	// finally
	let finallyResult = parseFinallyStatement(state, isMultiline);
	if (finallyResult) {
		return finallyResult;
	}

	// debugger keyword
	let debuggerKeywordResult = parseDebuggerKeyword(state);
	if (debuggerKeywordResult) {
		return debuggerKeywordResult;
	}

	// throw statement
	let throwStatementResult = parseThrowStatement(state, isMultiline);
	if (throwStatementResult) {
		return throwStatementResult;
	}

	// expression
	let expressionResult = parseExpression(state, false);
	if (expressionResult) {
		return expressionResult;
	}

	return undefined;
}
export const parseBreakStatement = (state: IParserState): IParseResult<IAstBreakStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse keyword
	const keywordResult = parseKeywordOfType(state, [KeywordType.Break]);
	if (!keywordResult) {
		return undefined;
	}
	state = keywordResult.state;

	// skip comments and whitespaces
	state = skipComments(state, true, false);

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
export const parseReturnStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstReturnStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse return keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.Return]);
	if (!keywordResult) {
		return undefined;
	}
	
	state = keywordResult.state;
	
	// skip comments and whitespace
	state = skipComments(state, true, isMultiline);

	// parse return expression
	let expressionResult = parseExpression(state, isMultiline);
	if (expressionResult) {
		state = expressionResult.state;
	}

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
		result: astFactory.returnStatement(expressionResult.result, expressionResult.result?.start, expressionResult.result?.end)
	}
}
export const parseDeleteExpression = (state: IParserState, isMultiline: boolean): IParseResult<IAstDeleteExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);
	// parse return keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.Delete]);
	if (!keywordResult) {
		return undefined;
	}
	state = keywordResult.state;
	// skip comments and whitespace
	state = skipComments(state, true, isMultiline);

	// parse expression of delete
	let expression: IAstNode = undefined;
	let expressionResult = parseExpression(state, isMultiline);
	if (expressionResult) {
		expression = expressionResult.result;
		state = expressionResult.state;
	}

	let end = getCursorPosition(state);
	let result = astFactory.deleteExpression(expression, start, end);

	return {
		result,
		state
	}
}
export const parseTypeofExpression = (state: IParserState, isMultiline: boolean): IParseResult<IAstTypeofExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);
	// parse return keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.Typeof]);
	if (!keywordResult) {
		return undefined;
	}
	state = keywordResult.state;
	// skip comments and whitespace
	state = skipComments(state, true, isMultiline);

	// parse expression of delete
	let expression: IAstNode = undefined;
	let expressionResult = parseExpression(state, isMultiline);
	if (expressionResult) {
		expression = expressionResult.result;
		state = expressionResult.state;
	}

	let end = getCursorPosition(state);
	let result = astFactory.typeofExpression(expression, start, end);

	return {
		result,
		state
	}
}
export const parseContinueStatement = (state: IParserState): IParseResult<IAstContinueStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);
	// parse keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.Continue]);
	if (!keywordResult) {
		return undefined;
	}
	state = keywordResult.state;

	// skip whitespace
	state = skipWhitespace(state, false);

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
export const parseIfStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstIfStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let condition: IAstNode = undefined;
	let thenProgram: IAstNode = undefined;
	let elseProgram: IAstNode = undefined;
	let finalState: IParserState = undefined;

	let ifResult = parseKeywordOfType(state, [KeywordType.If]);
	if (!ifResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = ifResult.state;
	finalState = state;

	// prepare break tokens that will break the statement
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];

	// parse until break tokens
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse condition
		let conditionScopeResult = parseScope(
			skipComments(state, true, isMultiline),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
			(state) => parseExpression(state, isMultiline),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
			(state) => skipComments(state, true, isMultiline)
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
		state = skipComments(state, true, isMultiline);
		// skip everything until { or else or breakTokens
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) && !parseKeyword(state));
		// check sequence end
		if (getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse then body
		let codeBlockResult = parseCodeBlock(state, isMultiline);
		if (codeBlockResult) {
			thenProgram = codeBlockResult.result;
			state = codeBlockResult.state;
			finalState = state;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);
		// skip everything until else or breakTokens
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, breakTokens) && !parseKeyword(state));

		// parse else
		let elseResult = parseKeywordOfType(state, [KeywordType.Else]);
		if (elseResult) {
			state = elseResult.state;
			finalState = state;

			// skip comments and whitespaces
			state = skipComments(state, true, isMultiline);
			// skip everything until { or else or breakTokens
			state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) && !parseKeyword(state));
			// check sequence end
			if (getTokenOfType(state, breakTokens)) {
				break;
			}

			// parse else body
			if (parseKeywordOfType(state, [KeywordType.If])) {
				// this is nested if statement
				let nestedIfResult = parseIfStatement(state, isMultiline);
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
				let codeBlockResult = parseCodeBlock(state, isMultiline);
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
export const parseSwitchStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstSwitchStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let condition: IAstNode = undefined;
	let cases: IAstNode[];
	let finalState: IParserState = undefined;

	let switchResult = parseKeywordOfType(state, [KeywordType.Switch]);
	if (!switchResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = switchResult.state;
	finalState = state;

	// prepare break tokens that will break the statement
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];

	// parse until break tokens
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse condition
		let conditionScopeResult = parseScope(
			skipComments(state, true, isMultiline),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
			(state) => parseExpression(state, isMultiline),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
			(state) => skipComments(state, true, isMultiline)
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
		state = skipComments(state, true, isMultiline);
		// skip everything until { or else or breakTokens
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) && !parseKeyword(state));
		// check sequence end
		if (getTokenOfType(state, breakTokens)) break;

		// parse swich body
		let bodyResult = parseScope(
			skipComments(state, true, true),
			(state) => parseTokenSequence(state, [CodeTokenType.BraceOpen]),
			(state) => {
				// skip comments and whitespaces
				state = skipComments(state, true, true);

				// case
				let caseResult = parseCaseStatement(state);
				if (caseResult) {
					return caseResult;
				}

				// default case
				let defaultCaseResult = parseDefaultCaseStatement(state);
				if (defaultCaseResult) {
					return defaultCaseResult;
				}

				return undefined;
			},
			(state) => parseTokenSequence(state, [CodeTokenType.BraceClose]),
			(state) => skipComments(state, true, isMultiline)
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
export const parseCaseStatement = (state: IParserState): IParseResult<IAstCaseStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse case keyword
	let caseResult = parseKeywordOfType(state, [KeywordType.Case]);
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
	state = skipComments(state, true, true);

	let finalState = state;
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse condition
		let conditionResult = parseExpression(state, true);
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
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens, CodeTokenType.Colon]));
		if (getTokenOfType(state, [CodeTokenType.Colon])) {
			state = skipTokens(state, 1);
		}

		// parse statements until break token or case or default or return keywords
		while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens) && !parseKeywordOfType(state, [KeywordType.Case, KeywordType.Default, KeywordType.Return, KeywordType.Break])) {
			// parse body statement
			let bodyStatementResult = parseStatement(state, true);
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
			state = skipComments(state, true, true);
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
		state = skipComments(state, true, true);
		// skip everything until break tokens or keyword
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens]) && !parseKeywordOfType(state, [KeywordType.Case, KeywordType.Default, KeywordType.Return, KeywordType.Break]))

		// parse consequent
		// parse retrun or break statements
		let breakStatementResult = parseBreakStatement(state);
		if (breakStatementResult) {
			consequent = breakStatementResult.result;
			state = breakStatementResult.state;
			finalState = state;
		}
		else {
			let returnStatementResult = parseReturnStatement(state, true);
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
export const parseDefaultCaseStatement = (state: IParserState): IParseResult<IAstCaseStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse default keyword
	let defaultResult = parseKeywordOfType(state, [KeywordType.Default]);
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
	state = skipComments(state, true, true);

	let finalState = state;
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse :
		// skip everything until : or break token
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens, CodeTokenType.Colon]));
		if (getTokenOfType(state, [CodeTokenType.Colon])) {
			state = skipTokens(state, 1);
		}

		// parse statements until break token or case or default or return keywords
		while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens) && !parseKeywordOfType(state, [KeywordType.Case, KeywordType.Default, KeywordType.Return, KeywordType.Break])) {
			// parse body statement
			let bodyStatementResult = parseStatement(state, true);
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
			state = skipComments(state, true, true);
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
		state = skipComments(state, true, true);
		// skip everything until break tokens or keyword
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens]) && !parseKeywordOfType(state, [KeywordType.Case, KeywordType.Default, KeywordType.Return, KeywordType.Break]))

		// parse consequent
		// parse retrun or break statements
		let breakStatementResult = parseBreakStatement(state);
		if (breakStatementResult) {
			consequent = breakStatementResult.result;
			state = breakStatementResult.state;
			finalState = state;
		}
		else {
			let returnStatementResult = parseReturnStatement(state, true);
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
export const parseDoWhileStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstDoWhileStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let condition: IAstNode = undefined;
	let bodyProgram: IAstNode = undefined;
	let finalState: IParserState = undefined;

	let doResult = parseKeywordOfType(state, [KeywordType.Do]);
	if (!doResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = doResult.state;
	finalState = state;

	// prepare break tokens that will break the statement
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];

	// parse until break tokens
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {

		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);
		// skip everything until { or breakTokens or while
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) && !parseKeyword(state));
		// check sequence end
		if (getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse body program
		let codeBlockResult = parseCodeBlock(state, isMultiline);
		if (codeBlockResult) {
			bodyProgram = codeBlockResult.result;
			state = codeBlockResult.state;
			finalState = state;
		}

		// check sequence end
		if (getTokenOfType(state, breakTokens)) { break; }
		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);
		// skip everything until ( or breakTokens or while
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens, CodeTokenType.ParenOpen]) && !parseKeywordOfType(state, [KeywordType.While]));
		// check sequence end
		if (getTokenOfType(state, breakTokens)) { break; }

		// parse while
		let whileResult = parseKeywordOfType(state, [KeywordType.While]);
		if (whileResult) {
			state = whileResult.state;
			finalState = state;

			// check sequence end
			if (getTokenOfType(state, breakTokens)) { break; }
			// skip comments and whitespaces
			state = skipComments(state, true, isMultiline);
			// skip everything until ( or breakTokens or while
			state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens, CodeTokenType.ParenOpen]) && !parseKeywordOfType(state, [KeywordType.While]));
			// check sequence end
			if (getTokenOfType(state, breakTokens)) { break; }

			// parse condition
			let conditionScopeResult = parseScope(
				skipComments(state, true, isMultiline),
				(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
				(state) => parseExpression(state, isMultiline),
				(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
				(state) => skipComments(state, true, isMultiline)
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
export const parseWhileStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstWhileStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let condition: IAstNode = undefined;
	let bodyProgram: IAstNode = undefined;
	let finalState: IParserState = undefined;

	let whileResult = parseKeywordOfType(state, [KeywordType.While]);
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
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];

	// parse until break tokens
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse condition
		let conditionScopeResult = parseScope(
			skipComments(state, true, isMultiline),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
			(state) => parseExpression(state, isMultiline),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
			(state) => skipComments(state, true, true)
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
		state = skipComments(state, true, isMultiline);
		// skip everything until { or else or breakTokens
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) && !parseKeyword(state));
		// check sequence end
		if (getTokenOfType(state, breakTokens)) {
			break;
		}

		codeBlockStart = getCursorPosition(state);

		// parse body program
		let codeBlockResult = parseCodeBlock(state, isMultiline);
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
export const parseForStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstForStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let init: IAstNode = undefined;
	let test: IAstNode = undefined;
	let update: IAstNode = undefined;
	let bodyProgram: IAstNode = undefined;
	let finalState: IParserState = undefined;

	let forResult = parseKeywordOfType(state, [KeywordType.For]);
	if (!forResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = forResult.state;
	finalState = state;

	// prepare break tokens that will break the statement
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];

	// parse until break tokens
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse condition
		let conditionScopeResult = parseScope(
			skipComments(state, true, isMultiline),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
			(state) => parseStatement(state, isMultiline),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
			(state) => {
				// comments
				let cursor = state.cursor;
				state = skipComments(state, true, isMultiline);
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
		state = skipComments(state, true, isMultiline);
		// skip everything until { or else or breakTokens
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens, CodeTokenType.BraceOpen]) && !parseKeyword(state));
		// check sequence end
		if (getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse body program
		let codeBlockResult = parseCodeBlock(state, isMultiline);
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
export const parseForCoditions = (state: IParserState): IParseResult<{ init: IAstNode, test: IAstNode; update: IAstNode }> => {
	let result: { init: IAstNode, test: IAstNode; update: IAstNode } =
	{
		init: undefined,
		test: undefined,
		update: undefined
	};

	// parse init statement
	let initStatementResult = parseExpression(state, true);
	if (initStatementResult) {
		state = initStatementResult.state;
		result = {
			...result,
			init: initStatementResult.result
		};
	}

	// skip comments and whitespaces
	state = skipComments(state, true, true);
	// everything until ; or ) are errors
	state = parseErrorTokens(state, (state) => !getTokenOfType(state, [CodeTokenType.Semicolon, CodeTokenType.ParenClose]));

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
	state = skipComments(state, true, true);

	let testExpressionResult = parseExpression(state, true);
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
	let updateStatementResult = parseExpression(state, true);
	if (updateStatementResult) {
		state = updateStatementResult.state;
		result = {
			...result,
			update: updateStatementResult.result
		};
	}

	// skip comments and whitespaces
	state = skipComments(state, true, true);

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
export const parseConditionBlock = (state: IParserState): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse open paren
	if (!getTokenOfType(state, [CodeTokenType.ParenOpen])) {
		return undefined;
	}
	state = skipTokens(state, 1);

	// skip comments and whitespaces
	state = skipComments(state, true, true);

	// parse expression
	let expressionResult = parseExpression(state, true);
	let expression: IAstNode = undefined;
	if (expressionResult) {
		expression = expressionResult.result;
		state = expressionResult.state;
	}

	// skip comments and whitespaces
	state = skipComments(state, true, true);

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
export const parseForInConditions = (state: IParserState): IParseResult<{ variable: IAstNode, expression: IAstNode }> => {
	// parse left expression
	let variable: IAstNode = undefined;
	// parse identifier
	let identifierResult = parseOperandIdentifier(state);
	if (identifierResult) {
		state = identifierResult.state;
		variable = identifierResult.result;
	} else {
		// if no identifier, parse variable declaration
		let varDeclarationResult = parseVariableDeclaration(state, true);
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
		state = skipComments(state, true, true);

		// check in keyword
		let inResult = parseKeywordOfType(state, [KeywordType.In]);
		if (inResult) {
			state = inResult.state;
		} else {
			// if there is no in keyword
			return undefined;
		}
		finalState = state;

		state = skipComments(state, true, true);

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse right expression
		let exprResult = parseExpression(state, true);
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
export const parseForOfConditions = (state: IParserState): IParseResult<{ variable: IAstNode, expression: IAstNode }> => {
	// parse left expression
	let variable: IAstNode = undefined;
	// parse identifier
	let identifierResult = parseOperandIdentifier(state);
	if (identifierResult) {
		state = identifierResult.state;
		variable = identifierResult.result;
	} else {
		// if no identifier, parse variable declaration
		let varDeclarationResult = parseVariableDeclaration(state, true);
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
		state = skipComments(state, true, true);

		// check of keyword
		let inResult = parseKeywordOfType(state, [KeywordType.Of]);
		if (inResult) {
			state = inResult.state;
		} else {
			// if there is no of keyword
			return undefined;
		}
		finalState = state;

		state = skipComments(state, true, true);

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse right expression
		let exprResult = parseExpression(state, true);
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
export const parseForInStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstForInStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse for (initStatement; in updateStatement) {body}
	let forResult = parseKeywordOfType(state, [KeywordType.For]);
	if (!forResult) {
		return undefined;
	}
	let start = getCursorPosition(state);
	state = forResult.state;

	// skip comments and whitespases
	state = skipComments(state, true, isMultiline);

	// parse condition block
	// parse open paren (
	if (!getTokenOfType(state, [CodeTokenType.ParenOpen])) {
		return undefined;
	}
	state = skipTokens(state, 1);
	let finalState = state;

	// prepare break tokens
	let breakTokens = [CodeTokenType.Semicolon];
	breakTokens = isMultiline ? breakTokens : [...breakTokens, CodeTokenType.Endline];

	// parse for in body
	let variable: IAstNode;
	let expression: IAstNode;
	let bodyProgram: IAstNode;
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);

		// parse for conditions
		let conditionsResult = parseForInConditions(state);
		if (conditionsResult) {
			state = conditionsResult.state;
			let condition = conditionsResult.result;
			variable = condition.variable;
			expression = condition.expression;

			finalState = state;
		} else {
			return undefined;
		}

		state = skipComments(state, true, true);

		// parse error tokens everything until )
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [CodeTokenType.ParenClose]));
		finalState = state;

		// parse and skip ) token
		if (getTokenOfType(state, [CodeTokenType.ParenClose])) {
			state = skipTokens(state, 1);
			finalState = state;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// now it's time to parse body code block

		// skip everything until code block open token
		let bodyErrorTokens = [...breakTokens, CodeTokenType.BraceOpen];
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, bodyErrorTokens));

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse body code block
		let codeBlockResult = parseCodeBlock(state, isMultiline);
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
export const parseForOfStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstForInStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse for (initStatement; in updateStatement) {body}
	let forResult = parseKeywordOfType(state, [KeywordType.For]);
	if (!forResult) {
		return undefined;
	}
	let start = getCursorPosition(state);
	state = forResult.state;

	// skip comments and whitespases
	state = skipComments(state, true, isMultiline);

	// parse condition block
	// parse open paren (
	if (!getTokenOfType(state, [CodeTokenType.ParenOpen])) {
		return undefined;
	}
	state = skipTokens(state, 1);
	let finalState = state;

	// prepare break tokens
	let breakTokens = [CodeTokenType.Semicolon];
	breakTokens = isMultiline ? breakTokens : [...breakTokens, CodeTokenType.Endline];

	// parse for of body
	let variable: IAstNode;
	let expression: IAstNode;
	let bodyProgram: IAstNode;
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);

		// parse for conditions
		let conditionsResult = parseForOfConditions(state);
		if (conditionsResult) {
			state = conditionsResult.state;
			let condition = conditionsResult.result;
			variable = condition.variable;
			expression = condition.expression;

			finalState = state;
		} else {
			return undefined;
		}

		state = skipComments(state, true, true);

		// parse error tokens everything until )
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [CodeTokenType.ParenClose]));
		finalState = state;

		// parse and skip ) token
		if (getTokenOfType(state, [CodeTokenType.ParenClose])) {
			state = skipTokens(state, 1);
			finalState = state;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// now it's time to parse body code block

		// skip everything until code block open token
		let bodyErrorTokens = [...breakTokens, CodeTokenType.BraceOpen];
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, bodyErrorTokens));

		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse body code block
		let codeBlockResult = parseCodeBlock(state, isMultiline);
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
export const parseImportStatement = (state: IParserState): IParseResult<IAstImportStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	// import [variable] as [alias] from [path]$
	// import in [variable] as [alias] from [path]$

	// parse import
	let keywordResult = parseKeywordOfType(state, [KeywordType.Import]);
	if (!keywordResult) {
		return undefined;
	}
	state = keywordResult.state;
	state = skipComments(state, true);

	// check if there is a 'in' variable next to the 'import': import in * as varname from "path"
	let isImportInContext: boolean = false;
	let inKeywordResult = parseKeywordOfType(state, [KeywordType.In]);
	if (inKeywordResult) {
		isImportInContext = true;
		state = inKeywordResult.state;
		state = skipComments(state, true);
	}

	// parse variable until $, as, from, operator
	let variableStart: ISymbolPosition = getCursorPosition(state);
	let variableEnd: ISymbolPosition = { ...variableStart };

	let alias: IAstNode;

	// parse star
	let starToken = getTokenOfType(state, [CodeTokenType.Star]);
	if (starToken) {
		state = skipTokens(state, 1);
		variableEnd = getCursorPosition(state);
		alias = astFactory.identifier(starToken.value, variableStart, variableEnd);
	}
	else {
		// if not star then parse variable
		let variableResult = parseAnyIdentifier(state);
		if (variableResult) {
			state = variableResult.state;
			alias = variableResult.result;
		}
	}

	// parsing error if no varname
	if (!alias) {
		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"variable name expected",
			variableEnd,
			variableEnd
		);
	}

	// parse alias
	state = skipComments(state, true);
	let aliasAst: IAstNode = undefined;
	let asResult = getToken(state);
	if (asResult && asResult.value === "as") {
		state = skipTokens(state, 1);

		// parse alias until $, from, operator
		state = skipComments(state, true);
		let varAliasResult = parseOperandIdentifier(state);
		if (varAliasResult) {
			state = varAliasResult.state;
			aliasAst = varAliasResult.result;
		}
		else {
			// if we have as keyword but no alias name, add parsing error
			state = addParsingError(
				state,
				ParsingErrorType.Error,
				"alias name expected",
				getCursorPosition(state),
				getCursorPosition(state)
			);
		}

	}

	// parse from
	state = skipComments(state, true);
	let importPathAst: IAstNode = undefined;
	let fromResult = getToken(state);
	if (fromResult && fromResult.value === "from") {
		state = skipTokens(state, 1);
		state = skipComments(state, true);

		// parse import path
		let importPathResult = parseImportPath(state);
		if (importPathResult && importPathResult.result) {
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
	}
	else {
		// no from closure
		state = addParsingError(
			state,
			ParsingErrorType.Error,
			"from keyword expected",
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
		alias,
		aliasAst,
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
export const parseImportPath = (state: IParserState): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let expressionResult = parseExpression(state, false);
	if (expressionResult) {
		return expressionResult;
	}

	let stringResult = parseStringLiteral(state);
	if (stringResult) {
		return stringResult;
	}

	let scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.Prime]),
		(state) => parseStringLiteralItem(state, true),
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
export const parseTryStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstTryStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse try
	let tryResult = parseKeywordOfType(state, [KeywordType.Try]);
	if (!tryResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = tryResult.state;

	let finalState = state;
	let body: IAstNode = undefined;
	let catchClause: IAstNode = undefined;
	let finallyBlock: IAstNode = undefined;
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];

	// skip comments and whitespaces
	state = skipComments(state, true, isMultiline);

	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {

		// parse code block
		let codeBlockResult = parseCodeBlock(state, isMultiline);
		if (codeBlockResult) {
			state = codeBlockResult.state;
			body = codeBlockResult.result;
			finalState = state;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);
		// check break tokens
		if (isEndOfFile(state) && getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse catch
		let catchResult = parseCatchStatement(state, isMultiline);
		if (catchResult) {
			state = catchResult.state;
			catchClause = catchResult.result;
			finalState = state;
		}

		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);
		// check break tokens
		if (isEndOfFile(state) && getTokenOfType(state, breakTokens)) {
			break;
		}

		// parse finally
		let finallyResult = parseFinallyStatement(state, isMultiline);
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
export const parseCatchStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstCatchStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// catch (varDeclaration) {body}

	// parse catch keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.Catch]);
	if (!keywordResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = keywordResult.state;

	let finalState = state;
	let body: IAstNode = undefined;
	let varDeclaration: IAstNode = undefined;
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];

	// skip comments and whitespaces
	state = skipComments(state, true, isMultiline);

	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse (identifier)
		let scopeResult = parseScope(
			state,
			(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
			(state) => parseOperandIdentifier(state),
			(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
			(state) => skipComments(state, true, true)
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
		state = skipComments(state, true, isMultiline);
		// check break tokens
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) { break; }

		// parse body
		let bodyResult = parseCodeBlock(state, isMultiline);
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
export const parseFinallyStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstFinallyStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// finally {body}

	// parse finally keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.Finally]);
	if (!keywordResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = keywordResult.state;

	let finalState = state;
	let body: IAstNode = undefined;
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];

	// skip comments and whitespaces
	state = skipComments(state, true, isMultiline);

	// check break tokens
	if (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// parse body
		let bodyResult = parseCodeBlock(state, isMultiline);
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
export const parseThrowStatement = (state: IParserState, isMultiline: boolean): IParseResult<IAstThrowStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse throw keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.Throw]);
	if (!keywordResult) {
		return undefined;
	}
	let start = getCursorPosition(state);
	state = keywordResult.state;
	let finalState = state;
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];
	let expression: IAstNode = undefined;

	// parse expression
	if (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);

		// parse expression
		let expressionResult = parseExpression(state, isMultiline);
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



export const parseOperator = (state: IParserState): IParseResult<IAstOperator> => {
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
export const parseOperatorOfType = (state: IParserState, operatorTypes: OperatorType[]): IParseResult<IAstOperator> => {
	if (isEndOfFile(state) || !operatorTypes) {
		return undefined;
	}

	let operatorResult = parseOperator(state);
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
export const parseBinaryOperator = (state: IParserState): IParseResult<IAstOperator> => {
	return parseOperatorOfType(state, [
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
export const parseUnaryOperatorPrefix = (state: IParserState): IParseResult<IAstOperator> => {
	return parseOperatorOfType(state, [
		OperatorType.SpreadAssign,
		OperatorType.PlusPlus,
		OperatorType.MinusMinus,
		OperatorType.Not,
		OperatorType.Minus
	]);
}
export const parseUnaryOperatorPostfix = (state: IParserState): IParseResult<IAstOperator> => {
	return parseOperatorOfType(state, [
		OperatorType.PlusPlus,
		OperatorType.MinusMinus
	]);
}
export const parseKeyword = (state: IParserState): IParseResult<IAstKeyword> => {
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
export const parseDebuggerKeyword = (state: IParserState): IParseResult<IAstDebuggerKeyword> => {
	let keywordResult = parseKeywordOfType(state, [KeywordType.Debugger]);
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
export const parseKeywordOfType = (state: IParserState, keywordTypes: KeywordType[]): IParseResult<IAstKeyword> => {
	let keywordResult = parseKeyword(state);
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
export const parseCommentLine = (state: IParserState): IParseResult<IAstCommentLine> => {
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
export const parseCommentBlock = (state: IParserState): IParseResult<IAstCommentBlock> => {
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
export const parseCodeBlock = (state: IParserState, isMultiline: boolean): IParseResult<IAstBlockStatement> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.BraceOpen]),
		(state) => parseStatement(state, true),
		(state) => parseTokenSequence(state, [CodeTokenType.BraceClose]),
		(state) => skipComments(state, true, isMultiline),
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
export const parseFunctionParametersScope = (state: IParserState, isMultiline: boolean) : IParseResult<IAstNode[]> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse function params scope
	let scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.ParenOpen]),
		(state) => parseAnyIdentifier(state),
		(state) => parseTokenSequence(state, [CodeTokenType.ParenClose]),
		(state) => skipComments(state, true, isMultiline),
		undefined,
		(state) => parseTokenSequence(state, [CodeTokenType.Comma])
	);

	if (!scopeResult) {
		return undefined;
	}

	// extract function arguments
	state = scopeResult.state;
	let args: IAstNode[] = [];
	if (scopeResult.result) {
		args = scopeResult.result.content || [];
	}

	return {
		state,
		result: args
	}
}
export const parseObjectLineTags = (state: IParserState, isMultiline: boolean): IParseResult<IAstNode[]> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const brakeTokens = isMultiline ? [] : [CodeTokenType.Endline];
	const result = [];

	while (!isEndOfFile(state) && !getTokenOfType(state, brakeTokens)) {
		let tagResult = parseTag(state);
		if (!tagResult) {
			break;
		}

		if (tagResult.result) {
			result.push(tagResult.result);
		}

		state = skipComments(state, true, isMultiline);
	}

	return {
		state,
		result
	}
}

// literals
export const parseLiteral = (state: IParserState): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// number
	let numberResult = parseNumberLiteral(state);
	if (numberResult) {
		return numberResult;
	}

	// boolean
	let booleanResult = parseBooleanLiteral(state);
	if (booleanResult) {
		return booleanResult;
	}

	// string
	let stringResult = parseStringLiteral(state);
	if (stringResult) {
		return stringResult;
	}

	// array
	let arrayResult = parseArrayLiteral(state);
	if (arrayResult) {
		return arrayResult;
	}

	return undefined;
}
export const parseNumberLiteral = (state: IParserState): IParseResult<IAstNumber> => {
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
export const parseStringLiteral = (state: IParserState, allowIncludes: boolean = true): IParseResult<IAstString> => {
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
		let stringItem = parseStringLiteralItem(state, allowIncludes);
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
export const parseStringLiteralItem = (state: IParserState, allowIncludes: boolean = true): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse include
	if (allowIncludes) {
		let stringIncludeResult = parseStringInclude(state);
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
export const parseStringInclude = (state: IParserState): IParseResult<IAstStringIncludeStatement> => {
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
	let nextState = skipComments(state, true, false);
	if (nextState && nextState.cursor > state.cursor) {
		return undefined;
	}

	// parse expression
	let expression: IAstNode = undefined;
	let expressionResult = parseExpression(state, false);
	if (expressionResult) {
		expression = expressionResult.result;
		state = expressionResult.state;
	}

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
	let result = astFactory.stringIncludeStatement(expression, start, end);

	return {
		state,
		result
	}
}
export const parseBooleanLiteral = (state: IParserState): IParseResult<IAstBoolean> => {
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
export const parseArrayLiteral = (state: IParserState): IParseResult<IAstArray> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse array scope
	let scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.BracketOpen]),
		(state) => parseStatement(state, true),
		(state) => parseTokenSequence(state, [CodeTokenType.BracketClose]),
		(state) => skipComments(state, true, true),
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
export const parseArrayItem = (state: IParserState): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// literal
	let literalResult = parseLiteral(state);
	if (literalResult) {
		return literalResult;
	}

	// expression
	let expressionResult = parseExpression(state, true);
	if (expressionResult) {
		return expressionResult;
	}

	return undefined;
}

// identifiers
export const parseIdentifier = (state: IParserState): IParseResult<IAstIdentifier> => {
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

	// prepare result
	let result: IAstIdentifier = astFactory.identifier(variableName, start, getCursorPosition(state));
	return {
		state,
		result
	}
}
export const parseIdentifierScope = (state: IParserState): IParseResult<IAstIdentifierScope> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	let scopeResult = parseScope(
		state,
		(state) => parseTokenSequence(state, [CodeTokenType.Prime]),
		(state) => parseStringLiteralItem(state, true),
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
export const parseRawIdentifier = (state: IParserState): IParseResult<IAstRawIdentifier> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// check @ mark
	if (getTokenOfType(state, [CodeTokenType.AtSign])) {
		let start = getCursorPosition(state);
		state = skipTokens(state, 1);

		// identifier scope
		let identScopeResult = parseIdentifierScope(state);
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
		let identifierResult = parseIdentifier(state);
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
export const parseAnyIdentifier = (state: IParserState): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let rawIndentifierResult = parseRawIdentifier(state);
	if (rawIndentifierResult) {
		return rawIndentifierResult;
	}

	let identifierScopeResult = parseIdentifierScope(state);
	if (identifierScopeResult) {
		return identifierScopeResult;
	}

	let identifierResult = parseIdentifier(state);
	if (identifierResult) {
		return identifierResult;
	}

	return undefined;
}
export const parseContextIdentifier = (state: IParserState): IParseResult<IAstContextIdentifier> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let identifierResult = parseAnyIdentifier(state);
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
export const parseOperandIdentifier = (state: IParserState): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// raw identifier
	let rawResult = parseRawIdentifier(state);
	if (rawResult) {
		return rawResult;
	}

	// context identifier
	let contextResult = parseContextIdentifier(state);
	if (contextResult) {
		return contextResult;
	}

	return undefined;
}

// declarations
export const parseVariableDeclaration = (state: IParserState, isMultiline: boolean): IParseResult<IAstVariableDeclaration> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// save start position
	let start = getCursorPosition(state);

	// var|let|const Identifier = Expression

	// parse keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.Var, KeywordType.Let, KeywordType.Const, KeywordType.Class]);
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

	// following algorithm can be broken by semicolon or endline, so let's wrap it in while scope that we can easilly break
	let identifier: IAstNode = undefined;
	let initValue: IAstNode = undefined;
	do {
		// check end of statement
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) { break; }
		// skip comments and whitespace
		state = skipComments(state, true, false);
		// check end of statement
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) { break; }

		// parse identifier
		let identifierResult = parseAnyIdentifier(state);
		if (identifierResult) {
			state = identifierResult.state;
			identifier = identifierResult.result;
		}

		// check end of statement
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) { break; }
		// skip comments and whitespace
		state = skipComments(state, true, false);
		// check end of statement
		if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) { break; }

		// parse equals
		if (getTokenOfType(state, [CodeTokenType.Equals])) {
			/// skip equals token
			state = skipTokens(state, 1);

			// check end of statement
			if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) { break; }
			// skip comments and whitespace
			state = skipComments(state, true, false);
			// check end of statement
			if (isEndOfFile(state) || getTokenOfType(state, breakTokens)) { break; }

			// parse init value expression
			let expressionResult = parseExpression(state, isMultiline);
			if (expressionResult) {
				state = expressionResult.state;
				initValue = expressionResult.result;
			}
		}
	} while (false);

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.variableDeclaration(identifier, kind, initValue, start, end);
	return {
		state,
		result
	}
}
export const parseFunctionDeclaration = (state: IParserState, isMultiline: boolean): IParseResult<IAstFunctionDeclaration> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	const start = getCursorPosition(state);

	let isAsync = false;
	const asyncResult = parseKeywordOfType(state, [KeywordType.Async]);
	if (asyncResult) {
		state = asyncResult.state;
		isAsync = true; 
	}

	// skip comments
	state = skipComments(state, true, isMultiline);

	// parse 'function' keyword
	const keywordResult = parseKeywordOfType(state, [KeywordType.Function]);
	if (!keywordResult) {
		return undefined;
	}

	state = keywordResult.state;

	let isGenerator = false;
	if (getTokenOfType(state, [CodeTokenType.Star])) {
		isGenerator = true;
		state = skipTokens(state, 1);
	}

	// skip comments
	state = skipComments(state, true, isMultiline);

	// parse identifier
	const identifierResult = parseAnyIdentifier(state);
	if (!identifierResult) {
		return undefined;
	}

	state = identifierResult.state;

	// skip comments
	state = skipComments(state, true, isMultiline);

	// parse function parameters
	const paramsResult = parseFunctionParametersScope(state, true);
	if (!paramsResult) {
		return undefined;
	}

	state = paramsResult.state;

	// skip comments
	state = skipComments(state, true, isMultiline);

	// parse function body
	const bodyResult = parseCodeBlock(state, true);
	if (!bodyResult) {
		return undefined;
	}

	state = bodyResult.state;
	const end = bodyResult.result?.end;

	let result = astFactory.functionDeclaration(
		identifierResult.result, 
		paramsResult.result, 
		bodyResult.result, 
		isAsync, 
		isGenerator, 
		start, 
		end
	);

	return {
		state,
		result
	}
}
export const parsePropertyDeclaration = (state: IParserState): IParseResult<IAstPropertyDeclaration> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);
	// identifier : value

	// identifier
	let identifier: IAstNode = undefined;
	let stringResult = parseStringLiteral(state, false);
	if (stringResult) {
		identifier = stringResult.result;
		state = stringResult.state;
	}
	else {
		let identifierResult = parseAnyIdentifier(state);
		if (identifierResult) {
			state = identifierResult.state;
			identifier = identifierResult.result;
		}
		else {
			return undefined;
		}		
	}

	let finalState = state;
	let breakTokens = [CodeTokenType.Semicolon];
	let initValue: IAstNode = undefined;
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespace
		let prevState = state;
		state = skipComments(state, true, true);
		if (state.cursor > prevState.cursor) {
			continue;
		}

		// colon
		if (getTokenOfType(state, [CodeTokenType.Colon])) {
			// skip colon
			state = skipTokens(state, 1);

			// skip comments and whitespace
			state = skipComments(state, true, true);

			let functionResult = parseFunctionExpression(state, true);
			if (functionResult) {
				state = functionResult.state;
				initValue = functionResult.result;
				finalState = state;
				break;
			}

			// parse expression
			let expressionResult = parseExpression(state, true);
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
	state = skipComments(state, true, true);

	// skip comma
	if (getTokenOfType(state, [CodeTokenType.Comma])) {
		state = skipTokens(state, 1);
		finalState = state;
	}
	state = finalState;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.propertyDeclaration(identifier, initValue, start, end);

	return {
		result,
		state
	}
}

// expression statements
export const parseExpression = (state: IParserState, isMultiline: boolean): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse new expression
	let newExpressionResult = parseNewExpression(state, isMultiline);
	if (newExpressionResult) {
		return newExpressionResult;
	}

	// await expression
	let awaitExpressionResult = parseAwaitExpression(state, isMultiline);
	if (awaitExpressionResult) {
		return awaitExpressionResult;
	}

	// yield expression
	let yieldExpressionResult = parseYieldExpression(state, isMultiline);
	if (yieldExpressionResult) {
		return yieldExpressionResult;
	}

	// delete expression
	let deleteResult = parseDeleteExpression(state, isMultiline);
	if (deleteResult) {
		return deleteResult;
	}

	// typeof expression
	let typeofResult = parseTypeofExpression(state, isMultiline);
	if (typeofResult) {
		return typeofResult;
	}

	// lambda expression
	let functionExpression = parseFunctionExpression(state, isMultiline);
	if (functionExpression) {
		return functionExpression;
	}

	// prefix
	let prefixStart = getCursorPosition(state);

	// parse unary prefix
	let prefixOperatorResult = parseUnaryOperatorPrefix(state);
	if (prefixOperatorResult) {
		state = prefixOperatorResult.state;
	}

	// parse first operand
	let operandResult = parseOperand(state, isMultiline);
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
	if (!isMultiline) {
		breakTokens = [...breakTokens, CodeTokenType.Endline];
	}

	let finalState = state;
	while (!isEndOfFile(state)) {
		if (getTokenOfType(state, breakTokens)) {
			break;
		}

		// skip comments
		let curPos = state.cursor;
		state = skipComments(state, true, isMultiline);
		if (state.cursor !== curPos) {
			continue;
		}

		// parse operation
		let operationResult = parseOperation(state, result, isMultiline);
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
export const parseFunctionExpression = (state: IParserState, isMultiline: boolean): IParseResult<IAstFunctionExpression> => {
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
	const asyncResult = parseKeywordOfType(state, [KeywordType.Async]);
	if (asyncResult) {
		state = asyncResult.state;
		isAsync = true;
	}

	state = skipComments(state, true, isMultiline);

	// skip comments and whitespaces
	// parse keyword
	const keywordResult = parseKeywordOfType(state, [KeywordType.Function]);
	if (keywordResult) {
		state = keywordResult.state;
	}

	let isGenerator = false;
	if (getTokenOfType(state, [CodeTokenType.Star])) {
		isGenerator = true;
		state = skipTokens(state, 1);
	}

	// skip comments and whitespaces
	state = skipComments(state, true, isMultiline);

	// parse function parameters
	let parametersResult = parseFunctionParametersScope(state, true);
	if (!parametersResult) {
		return undefined;
	}
	state = parametersResult.state;
	const args: IAstNode[] = parametersResult.result || [];

	// skip comments and whitespaces
	state = skipComments(state, true, isMultiline);

	// parse =>
	let isLambda = false;
	const arrowResult = parseTokenSequence(state, [CodeTokenType.Equals, CodeTokenType.TupleClose]);

	if (keywordResult && arrowResult) {
		// it's lambda and 'function' function!
		state = arrowResult.state;
		state = addInvalidTokenSequenceError(state, arrowResult.result);
	}
	else if (!keywordResult && !arrowResult) {
		// not a function
		return undefined;
	}

	if (arrowResult) {
		state = arrowResult.state;
		isLambda = true;
	}

	// skip comments and whitespaces
	state = skipComments(state, true, isMultiline);

	// parse function body
	let bodyResult = parseCodeBlock(state, true);
	if (!bodyResult) {
		return undefined;
	}
	state = bodyResult.state;
	const body = bodyResult.result;

	// prepare result
	const end = getCursorPosition(state);
	const result = astFactory.functionExpression(args, body, isLambda, isAsync, isGenerator, start, end);

	return {
		state,
		result
	}
}

export const parseOperand = (state: IParserState, isMultiline: boolean): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// literal
	let literalResult = parseLiteral(state);
	if (literalResult) {
		return literalResult;
	}

	// function expression
	let funcExpression = parseFunctionExpression(state, isMultiline);
	if (funcExpression != null) {
		return funcExpression;
	}

	// object expression
	let objectExpressionResult = parseObjectExpression(state);
	if (objectExpressionResult) {
		return objectExpressionResult;
	}

	// paren expression
	let parenExpressionResult = parseParenExpression(state);
	if (parenExpressionResult) {
		return parenExpressionResult;
	}

	// identifier
	let identifierResult = parseOperandIdentifier(state);
	if (identifierResult) {
		return identifierResult;
	}

	// keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.Null, KeywordType.Undefined]);
	if (keywordResult) {
		return keywordResult;
	}

	return undefined;
}
export const parseOperation = (state: IParserState, leftOperand: IAstNode, isMultiline: boolean): IParseResult<IAstNode> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse member expression
	let memberResult = parseMemberExpression(state, leftOperand, isMultiline);
	if (memberResult) {
		return memberResult;
	}

	// parse call expression
	let callResult = parseCallExpression(state, leftOperand, isMultiline);
	if (callResult) {
		return callResult;
	}

	// parse indexer expression
	let indexerResult = parseIndexerExpression(state, leftOperand, isMultiline);
	if (indexerResult) {
		return indexerResult;
	}

	// parse update expression
	let updateResult = parseUpdateExpressionPostfix(state, leftOperand);
	if (updateResult) {
		return updateResult;
	}

	// parse binary expression
	let binaryResult = parseBinaryExpression(state, leftOperand, isMultiline);
	if (binaryResult) {
		return binaryResult;
	}

	// parse conditional expression
	let conditionalExpressionResult = parseConditionalExpression(state, leftOperand, isMultiline);
	if (conditionalExpressionResult) {
		return conditionalExpressionResult;
	}

	return undefined;
}
export const parseParenExpression = (state: IParserState): IParseResult<IAstParenExpression> => {
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
	state = skipComments(state, true, true);

	// parse expression
	let expression: IAstNode = undefined;
	let expressionResult = parseExpression(state, true);
	if (expressionResult) {
		expression = expressionResult.result;
		state = expressionResult.state;
	}

	// skip comments and whitespaces
	state = skipComments(state, true, true);

	// skip everything until close token )
	state = parseErrorTokens(state, (st) => !getTokenOfType(st, [CodeTokenType.ParenClose]));

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
export const parseObjectExpression = (state: IParserState): IParseResult<IAstObjectExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	// parse open brace
	if (!getTokenOfType(state, [CodeTokenType.BraceOpen])) {
		return undefined;
	}
	state = skipTokens(state, 1);

	// parse properties
	let properties: IAstNode[] = [];
	let finalState = state;
	do {
		// check end token
		if (isEndOfFile(state) || getTokenOfType(state, [CodeTokenType.BraceClose])) {
			break;
		}

		let prevState = state;
		state = skipComments(state, true, true);
		finalState = state;
		if (state.cursor > prevState.cursor) {
			continue;
		}

		// parse property
		let propertyResult = parsePropertyDeclaration(state);
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
			let expressionResult = parseStatement(state, true);
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
		if (getTokenOfType(state, [CodeTokenType.Comma])) {
			state = skipTokens(state, 1);

			continue;
		}

		// if we here, that means this is invalid token
		let errorStart = getCursorPosition(state);
		let errorToken = getToken(state);
		state = skipTokens(state, 1);
		let errorEnd = getCursorPosition(state);

		state = addParsingError(
			state,
			ParsingErrorType.Error,
			`Invalid token '${errorToken.value || errorToken.type}'`,
			errorStart,
			errorEnd
		);
		finalState = state;

	} while (!isEndOfFile(state));
	state = finalState;

	// parse close brace
	if (getTokenOfType(state, [CodeTokenType.BraceClose])) {
		state = skipTokens(state, 1);
	}

	// prepare result 
	let end = getCursorPosition(state);
	let result = astFactory.objectExpression(properties, start, end);

	return {
		state,
		result
	}
}
export const parseCallExpression = (state: IParserState, leftOperand: IAstNode, isMultiline: boolean): IParseResult<IAstCallExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// skip comments and whitespaces
	state = skipComments(state, true, isMultiline);

	let start = getCursorPosition(state);

	// parse function args
	let funcArgsResult = parseCallArguments(state);
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
export const parseCallArguments = (state: IParserState): IParseResult<IAstNode[]> => {
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
		state = skipComments(state, true, true);

		// parse expression
		let expressionResult = parseExpression(state, true);
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
		let newState = skipComments(state, true, true);
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
export const parseIndexerExpression = (state: IParserState, leftOperand: IAstNode, isMultiline: boolean): IParseResult<IAstIndexerExpression> => {
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
	state = skipComments(state, true, isMultiline);

	// parse property
	let property: IAstNode = undefined;
	let expressionResult = parseExpression(state, isMultiline);
	if (expressionResult) {
		property = expressionResult.result;
		state = expressionResult.state;
	}

	// skip comments and whitespaces
	state = skipComments(state, true, isMultiline);

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
export const parseUpdateExpressionPostfix = (state: IParserState, leftOperand: IAstNode): IParseResult<IAstUpdateExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let operatorResult = parseUnaryOperatorPostfix(state);
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
export const parseBinaryExpression = (state: IParserState, leftOperand: IAstNode, isMultiline: boolean): IParseResult<IAstBinaryExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse operator
	let operatorResult = parseBinaryOperator(state);
	if (!operatorResult) {
		return undefined;
	}

	let start = getCursorPosition(state);
	state = operatorResult.state;
	let operator = operatorResult.result;
	let rightStart = getCursorPosition(state);

	// skip comments and whitespaces
	state = skipComments(state, true, isMultiline);

	// parse right operand
	let rightOperand: IAstNode;
	let rightOperandResult = parseExpression(state, isMultiline);
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
export const parseMemberExpression = (state: IParserState, leftOperand: IAstNode, isMultiline: boolean): IParseResult<IAstMemberExpression> => {
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
	state = skipComments(state, true, isMultiline);

	// parse identifier
	let identifierResult = parseAnyIdentifier(state);
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
export const parseConditionalExpression = (state: IParserState, condition: IAstNode, isMultiline: boolean): IParseResult<IAstConditionalExpression> => {
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

	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens.push(CodeTokenType.Semicolon);

	let whenTrue: IAstNode;
	let whenFalse: IAstNode;
	let colonToken: IAstNode;
	// parse operator content
	while (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);

		// parse when true
		let rightOperandResult = parseExpression(state, isMultiline);
		if (rightOperandResult) {
			state = rightOperandResult.state;
			whenTrue = rightOperandResult.result;
			finalState = state;
		}

		state = skipComments(state, true, isMultiline);

		// check sequence end
		if (getTokenOfType(state, breakTokens)) break;
		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);
		// skip everything until break tokens or colon
		state = parseErrorTokens(state, (state) => !getTokenOfType(state, [...breakTokens, CodeTokenType.Colon]));
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
		state = skipComments(state, true, isMultiline);
		// check sequence end
		if (getTokenOfType(state, breakTokens)) break;

		// parse whenFalse
		let whenFalseResult = parseExpression(state, isMultiline);
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
export const parseNewExpression = (state: IParserState, isMultiline: boolean): IParseResult<IAstNewExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse new keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.New]);
	if (!keywordResult) {
		return undefined;
	}
	let start = getCursorPosition(state);
	state = keywordResult.state;
	let finalState = state;
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];
	let expression: IAstNode = undefined;

	// parse expression
	if (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);

		// parse expression
		let expressionResult = parseExpression(state, isMultiline);
		if (expressionResult) {
			state = expressionResult.state;
			expression = expressionResult.result;
			finalState = state;
		}
	}
	state = finalState;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.newExpression(
		expression,
		start,
		end
	);

	return {
		result,
		state
	}
}
export const parseAwaitExpression = (state: IParserState, isMultiline: boolean): IParseResult<IAstNewExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse await keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.Await]);
	if (!keywordResult) {
		return undefined;
	}
	let start = getCursorPosition(state);
	state = keywordResult.state;
	let finalState = state;
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];
	let expression: IAstNode = undefined;

	// parse expression
	if (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);

		// parse expression
		let expressionResult = parseExpression(state, isMultiline);
		if (expressionResult) {
			state = expressionResult.state;
			expression = expressionResult.result;
			finalState = state;
		}
	}
	state = finalState;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.awaitExpression(
		expression,
		start,
		end
	);

	return {
		result,
		state
	}
}
export const parseYieldExpression = (state: IParserState, isMultiline: boolean): IParseResult<IAstNewExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	// parse yield keyword
	let keywordResult = parseKeywordOfType(state, [KeywordType.Yield]);
	if (!keywordResult) {
		return undefined;
	}
	let start = getCursorPosition(state);
	state = keywordResult.state;
	let finalState = state;
	let breakTokens = isMultiline ? [] : [CodeTokenType.Endline];
	breakTokens = [...breakTokens, CodeTokenType.Semicolon];
	let expression: IAstNode = undefined;

	// parse expression
	if (!isEndOfFile(state) && !getTokenOfType(state, breakTokens)) {
		// skip comments and whitespaces
		state = skipComments(state, true, isMultiline);

		// parse expression
		let expressionResult = parseExpression(state, isMultiline);
		if (expressionResult) {
			state = expressionResult.state;
			expression = expressionResult.result;
			finalState = state;
		}
	}
	state = finalState;

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.yieldExpression(
		expression,
		start,
		end
	);

	return {
		result,
		state
	}
}

// storytailor-specific

export const parsePrototypeExpression = (state: IParserState): IParseResult<IAstPrototypeExpression> => {
	if (isEndOfFile(state)) {
		return undefined;
	}

	let start = getCursorPosition(state);

	// parse :
	if (!getTokenOfType(state, [CodeTokenType.Colon])) {
		return undefined;
	}
	state = skipTokens(state, 1);

	// skip comments and whitespace
	state = skipComments(state, true, false);

	// parse prototype expression
	let expression: IAstNode;
	let expressionResult = parseExpression(state, false);
	if (expressionResult) {
		state = expressionResult.state;
		expression = expressionResult.result;
	}

	// prepare result
	let end = getCursorPosition(state);
	let result = astFactory.prototypeExpression(expression, start, end);
	return {
		state,
		result
	}
}
export const parseTag = (state: IParserState): IParseResult<IAstTag> => {
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

export const parseErrorTokens = (state: IParserState, filter: (state: IParserState) => boolean): IParserState => {
	while (!isEndOfFile(state)) {
		// skip comments if any
		let curPos = state.cursor;
		state = skipComments(state, false, false);
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

export const skipComments = (state: IParserState, isSkipWhitespace: boolean = false, isMultiline: boolean = false): IParserState => {
	while (true) {
		if (isSkipWhitespace === true) {
			state = skipWhitespace(state, isMultiline);
		}

		let commentBlockResult = parseCommentBlock(state);
		if (commentBlockResult) {
			state = commentBlockResult.state;
			continue;
		}

		let commentLineResult = parseCommentLine(state);
		if (commentLineResult) {
			state = commentLineResult.state;
			continue;
		}

		if (isSkipWhitespace === true) {
			state = skipWhitespace(state, isMultiline);
		}

		break;
	}

	return state;
}
export const skipCommentLine = (state: IParserState): IParserState => {
	let parseResult = parseCommentLine(state);
	if (parseResult) {
		return parseResult.state;
	}

	return undefined;
}
export const skipCommentBlock = (state: IParserState): IParserState => {
	let parseResult = parseCommentBlock(state);
	if (parseResult) {
		return parseResult.state;
	}

	return undefined;
}

export const skipWhitespace = (state: IParserState, multiline: boolean = false): IParserState => {
	const tokenTypes = multiline
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