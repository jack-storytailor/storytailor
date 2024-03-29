import { AstNodeType } from "./AstNodeType";
import { ISymbolPosition } from "../shared/ISymbolPosition";
import { ICodeToken } from "../shared/ICodeToken";
import {
	IAstToken,
	IAstKeyword,
	IAstText,
	IAstOperator,
	IAstProgram,
	IAstModule,
	IAstNode,
	IAstCommentLine,
	IAstCommentBlock,
	IAstNumber,
	IAstString,
	IAstBoolean,
	IAstArray,
	IAstIdentifier,
	IAstRawIdentifier,
	IAstIdentifierScope,
	IAstPropertyDeclaration,
	IAstBreakStatement,
	IAstContinueStatement,
	IAstBlockStatement,
	IAstIfStatement,
	IAstSwitchStatement,
	IAstCaseStatement,
	IAstWhileStatement,
	IAstDoWhileStatement,
	IAstForStatement,
	IAstForInStatement,
	IAstImportStatement,
	IAstParenExpression,
	IAstObject,
	IAstCallExpression,
	IAstUpdateExpression,
	IAstBinaryExpression,
	IAstMemberExpression,
	IAstIndexerExpression,
	IAstOuterStatement,
	IAstTextLineStatement,
	IAstObjectLineStatement,
	IAstStringIncludeStatement,
	IAstPrototypeExpression,
	IAstScope,
	IAstTokenSequence,
	IAstConditionalExpression,
	IAstFinallyStatement,
	IAstCatchStatement,
	IAstTryStatement,
	IAstThrowStatement,
	IAstDebuggerKeyword,
	IAstDeleteLineExpression,
	IAstContextIdentifier,
	IAstRegexLiteral,
	IAstVariableDeclaration,
	IAstRawImportStatement,
	IAstImportItem,
	IAstClassDeclaration,
	IAstKeywordNode,
	IAstFunction,
	IAstDeconstructingAssignment
} from "./IAstNode";
import { KeywordType } from "./KeywordType";
import { OperatorType } from "./OperatorType";
import { VariableDeclarationKind } from "./VariableDeclarationKind";

export const astFactory = {

	// general

	token: (token: ICodeToken, start: ISymbolPosition): IAstToken => {
		return {
			nodeType: AstNodeType.Token,
			start: start,
			end: { ...start, symbol: start.symbol + 1 },
			token: token
		}
	},
	tokenSequence: (tokens: ICodeToken[], start: ISymbolPosition, end: ISymbolPosition): IAstTokenSequence => {
		return {
			nodeType: AstNodeType.TokenSequence,
			start,
			end,
			tokens
		}
	},
	keyword: (keywordType: KeywordType, start: ISymbolPosition, end: ISymbolPosition): IAstKeyword => {
		return {
			nodeType: AstNodeType.Keyword,
			start,
			end,
			keywordType
		}
	},
	debuggerKeyword: (keywordType: KeywordType, start: ISymbolPosition, end: ISymbolPosition): IAstDebuggerKeyword => {
		return {
			nodeType: AstNodeType.DebuggerKeyword,
			start,
			end,
			keywordType
		}
	},
	text: (text: string, start: ISymbolPosition, end: ISymbolPosition): IAstText => {
		return {
			nodeType: AstNodeType.Text,
			start: start,
			end: end,
			text: text
		}
	},
	operator: (operatorType: OperatorType, value: string, start: ISymbolPosition, end: ISymbolPosition): IAstOperator => {
		return {
			nodeType: AstNodeType.Operator,
			start: start,
			end: end,
			operatorType,
			value
		}
	},
	module: (tokens: ICodeToken[], content: IAstProgram, imports: IAstImportStatement[], exports: IAstKeywordNode[], modulePath: string): IAstModule => {
		let start: ISymbolPosition = {
			symbol: 0,
			line: 0,
			column: 0
		};
		let end: ISymbolPosition = { ...start };

		if (tokens && tokens.length > 0) {
			let firstToken = tokens[0];
			let lastToken = tokens[tokens.length - 1];
			start = { ...firstToken.start };
			end = { ...lastToken.end }
		}

		return {
			nodeType: AstNodeType.Module,
			tokens,
			content,
			imports,
			exports,
			modulePath,
			start,
			end
		}
	},
	program: (content: IAstNode[], start: ISymbolPosition, end: ISymbolPosition): IAstProgram => {
		return {
			nodeType: AstNodeType.Program,
			content,
			start,
			end
		}
	},
	commentLine: (text: string, start: ISymbolPosition, end: ISymbolPosition): IAstCommentLine => {
		return {
			nodeType: AstNodeType.CommentLine,
			text,
			start,
			end
		}
	},
	commentBlock: (text: string, start: ISymbolPosition, end: ISymbolPosition): IAstCommentBlock => {
		return {
			nodeType: AstNodeType.CommentBlock,
			text,
			start,
			end
		}
	},

	// literals
	numberLiteral: (value: number, start: ISymbolPosition, end: ISymbolPosition): IAstNumber => {
		return {
			nodeType: AstNodeType.Number,
			value,
			start,
			end
		}
	},
	stringLiteral: (value: IAstNode[], allowIncludes: boolean, hasIncludes: boolean, start: ISymbolPosition, end: ISymbolPosition): IAstString => {
		return {
			nodeType: AstNodeType.String,
			allowIncludes,
			value,
			hasIncludes,
			start,
			end
		}
	},
	regexLiteral: (value: string, start: ISymbolPosition, end: ISymbolPosition): IAstRegexLiteral => {
		return {
			nodeType: AstNodeType.RegexLiteral,
			value,
			start,
			end
		}
	},
	booleanLiteral: (value: boolean, start: ISymbolPosition, end: ISymbolPosition): IAstBoolean => {
		return {
			nodeType: AstNodeType.Boolean,
			value,
			start,
			end
		}
	},
	arrayLiteral: (value: IAstNode[], start: ISymbolPosition, end: ISymbolPosition): IAstArray => {
		return {
			nodeType: AstNodeType.Array,
			value,
			start,
			end
		}
	},
	functionLiteral: (name: IAstNode, args: IAstNode[], body: IAstNode, isLambda: boolean, isAsync: boolean, isNoKeyword: boolean, isGenerator: boolean, start: ISymbolPosition, end: ISymbolPosition): IAstFunction => {
		return {
			nodeType: AstNodeType.Function,
			isLambda,
			isAsync,
			isGenerator,
			isNoKeyword,
			name,
			args,
			body,
			start,
			end
		}
	},

	// identifiers
	identifier: (value: string, isJsIdentifier: boolean, start: ISymbolPosition, end: ISymbolPosition): IAstIdentifier => {
		return {
			nodeType: AstNodeType.Identifier,
			value,
			isJsIdentifier,
			start,
			end
		}
	},
	rawIndentifier: (value: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstRawIdentifier => {
		return {
			nodeType: AstNodeType.RawIdentifier,
			value,
			start,
			end
		}
	},
	contextIndentifier: (value: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstContextIdentifier => {
		return {
			nodeType: AstNodeType.ContextIdentifier,
			value,
			start,
			end
		}
	},
	IdentifierScope: (value: IAstNode[], start: ISymbolPosition, end: ISymbolPosition): IAstIdentifierScope => {
		return {
			nodeType: AstNodeType.IdentifierScope,
			value,
			start,
			end
		}
	},

	// declarations
	variableListDeclaration: (identifiers: IAstNode[], kind: VariableDeclarationKind, value: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstVariableDeclaration => {
		return {
			nodeType: AstNodeType.VariableDeclaration,
			start,
			end,
			identifiers,
			kind,
			value
		}
	},
	propertyDeclaration: (identifier: IAstNode, value: IAstNode, initializer: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstPropertyDeclaration => {
		return {
			nodeType: AstNodeType.PropertyDeclaration,
			start,
			end,
			identifier,
			value,
			initializer
		}
	},
	deconstructionAssignment: (variables: IAstNode, initializer: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstDeconstructingAssignment => {
		return {
			nodeType: AstNodeType.DeconstructionAssignment,
			variables,
			initializer,
			start, 
			end
		}
	},
	classDeclaration: (name: IAstNode, contents: IAstNode[], parent: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstClassDeclaration => {
		return {
			nodeType: AstNodeType.ClassDeclaration,
			name,
			parent,
			contents,
			start,
			end
		}
	},

	// statements
	breakStatement: (start: ISymbolPosition, end: ISymbolPosition): IAstBreakStatement => {
		return {
			nodeType: AstNodeType.BreakStatement,
			start,
			end
		}
	},
	continueStatement: (start: ISymbolPosition, end: ISymbolPosition): IAstContinueStatement => {
		return {
			nodeType: AstNodeType.ContinueStatement,
			start,
			end
		}
	},
	blockStatement: (content: IAstNode[], start: ISymbolPosition, end: ISymbolPosition, withoutBraces: boolean = false): IAstBlockStatement => {
		return {
			nodeType: AstNodeType.BlockStatement,
			start,
			end,
			content,
			withoutBraces
		}
	},
	ifStatement: (condition: IAstNode, thenValue: IAstNode, elseValue: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstIfStatement => {
		return {
			nodeType: AstNodeType.IfStatement,
			start,
			end,
			condition,
			thenValue,
			elseValue
		}
	},
	switchStatement: (condition: IAstNode, cases: IAstNode[], start: ISymbolPosition, end: ISymbolPosition): IAstSwitchStatement => {
		return {
			nodeType: AstNodeType.SwitchStatement,
			start,
			end,
			cases,
			condition,
		}
	},
	caseStatement: (condition: IAstNode, body: IAstNode[], consequent: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstCaseStatement => {
		return {
			nodeType: AstNodeType.CaseStatement,
			start,
			end,
			condition,
			body,
			consequent
		}
	},
	whileStatement: (condition: IAstNode, body: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstWhileStatement => {
		return {
			nodeType: AstNodeType.WhileStatement,
			start,
			end,
			condition,
			body
		}
	},
	doWhileStatement: (condition: IAstNode, body: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstDoWhileStatement => {
		return {
			nodeType: AstNodeType.DoWhileStatement,
			start,
			end,
			condition,
			body
		}
	},
	forStatement: (init: IAstNode, test: IAstNode, update: IAstNode, body: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstForStatement => {
		return {
			nodeType: AstNodeType.ForStatement,
			start,
			end,
			init,
			test,
			update,
			body
		}
	},
	forInStatement: (left: IAstNode, right: IAstNode, body: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstForInStatement => {
		return {
			nodeType: AstNodeType.ForInStatement,
			start,
			end,
			left,
			right,
			body
		}
	},
	forOfStatement: (left: IAstNode, right: IAstNode, body: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstForInStatement => {
		return {
			nodeType: AstNodeType.ForOfStatement,
			start,
			end,
			left,
			right,
			body
		}
	},
	importStatement: (identifier: IAstNode, importInContext: boolean, path: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstImportStatement => {
		return {
			nodeType: AstNodeType.ImportStatement,
			start,
			end,
			path,
			identifier,
			importInContext
		}
	},
	rawImportStatement: (identifier: IAstNode | IAstNode[], path: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstRawImportStatement => {
		return {
			nodeType: AstNodeType.RawImportStatement,
			identifier, 
			path,
			start, 
			end
		}
	},
	importItem: (identifier: IAstNode, alias: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstImportItem => {
		return {
			nodeType: AstNodeType.ImportItem,
			identifier,
			alias,
			start,
			end
		};
	},
	tryStatement: (body: IAstNode, catchClause: IAstNode, finallyBlock: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstTryStatement => {
		return {
			nodeType: AstNodeType.TryStatement,
			start,
			end,
			body,
			catchClause,
			finallyBlock
		}
	},
	catchStatement: (body: IAstNode, varDeclaration: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstCatchStatement => {
		return {
			nodeType: AstNodeType.CatchStatement,
			start,
			end,
			body,
			varDeclaration
		}
	},
	finallyStatement: (body: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstFinallyStatement => {
		return {
			nodeType: AstNodeType.FinallyStatement,
			start,
			end,
			body
		}
	},
	throwStatement: (expression: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstThrowStatement => {
		return {
			nodeType: AstNodeType.ThrowStatement,
			start,
			end,
			expression
		}
	},

	// expression statements
	keywordNode: (keyword: IAstKeyword, node: IAstNode, isKeywordFirst: boolean, start: ISymbolPosition, end: ISymbolPosition): IAstKeywordNode => {
		return {
			nodeType: AstNodeType.KeywordNode,
			keyword,
			node,
			isKeywordFirst,
			start,
			end
		}
	},
	parenExpression: (expression: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstParenExpression => {
		return {
			nodeType: AstNodeType.ParenExpression,
			start,
			end,
			expression
		}
	},
	objectLiteral: (properties: IAstNode[], start: ISymbolPosition, end: ISymbolPosition): IAstObject => {	
		return {
			nodeType: AstNodeType.Object,
			start,
			end,
			properties
		}
	},
	callExpression: (calee: IAstNode, args: IAstNode[], start: ISymbolPosition, end: ISymbolPosition): IAstCallExpression => {
		return {
			nodeType: AstNodeType.CallExpression,
			start,
			end,
			args,
			calee
		}
	},
	updateExpression: (argument: IAstNode, operator: IAstNode, prefix: boolean, start: ISymbolPosition, end: ISymbolPosition): IAstUpdateExpression => {
		return {
			nodeType: AstNodeType.UpdateExpression,
			start,
			end,
			argument,
			operator,
			prefix
		}
	},
	binaryExpression: (left: IAstNode, operator: IAstNode, right: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstBinaryExpression => {
		return {
			nodeType: AstNodeType.BinaryExpression,
			start,
			end,
			left,
			operator,
			right
		}
	},
	memberExpression: (object: IAstNode, property: IAstNode, optional: boolean, start: ISymbolPosition, end: ISymbolPosition): IAstMemberExpression => {
		return {
			nodeType: AstNodeType.MemberExpression,
			start,
			end,
			object,
			property,
			optional
		}
	},
	IndexerExpression: (member: IAstMemberExpression, start: ISymbolPosition, end: ISymbolPosition): IAstIndexerExpression => {
		return {
			nodeType: AstNodeType.IndexerExpression,
			start,
			end,
			member
		}
	},
	conditionalExpression: (condition: IAstNode, whenTrue: IAstNode, whenFalse: IAstNode, colonToken: IAstNode, questionToken: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstConditionalExpression => {
		return {
			nodeType: AstNodeType.ConditionalExpression,
			start,
			end,
			condition,
			whenFalse,
			whenTrue,
			colonToken,
			questionToken
		}
	},

	// storytailor-specific

	outerStatement: (indent: number, statement: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstOuterStatement => {
		return {
			nodeType: AstNodeType.OuterStatement,
			start,
			end,
			indent,
			statement
		}
	},
	textLineStatement: (indent: number, text: IAstNode[], hasIncludes: boolean, start: ISymbolPosition, end: ISymbolPosition): IAstTextLineStatement => {
		return {
			nodeType: AstNodeType.TextLineStatement,
			start,
			end,
			indent,
			text,
			hasIncludes
		}
	},
	objectLineStatement: (object: IAstNode, value: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstObjectLineStatement => {
		return {
			nodeType: AstNodeType.ObjectLineStatement,
			start,
			end,
			object,
			value
		}
	},
	stringIncludeStatement: (expression: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstStringIncludeStatement => {
		return {
			nodeType: AstNodeType.StringIncludeStatement,
			start,
			end,
			expression
		}
	},
	prototypeExpression: (value: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstPrototypeExpression => {
		return {
			nodeType: AstNodeType.PrototypeExpression,
			start,
			end,
			value
		}
	},
	deleteLineExpression: (object: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstDeleteLineExpression => {
		return {
			nodeType: AstNodeType.DeleteLineExpression,
			start,
			end,
			object
		}
	},

	scope: (content: IAstNode[], open: IAstNode, close: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstScope => {
		return {
			nodeType: AstNodeType.Scope,
			start,
			end,
			content,
			open,
			close
		}
	},
	tag: (content: IAstNode[], open: IAstNode, close: IAstNode, start: ISymbolPosition, end: ISymbolPosition): IAstScope => {
		return {
			nodeType: AstNodeType.Scope,
			start,
			end,
			content,
			open,
			close
		}
	},

	// casting
	asNode: <TAst extends IAstNode>(ast: IAstNode, nodeType: AstNodeType): TAst => {
		if (!ast || ast.nodeType !== nodeType) {
			return undefined;
		}

		return ast as TAst;
	}
}
