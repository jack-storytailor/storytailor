import { ICodeToken } from "../shared/ICodeToken";
import { ISymbolPosition } from "../shared/ISymbolPosition";
import { OperatorType } from "./OperatorType";
import { VariableDeclarationKind } from "./VariableDeclarationKind";
import { KeywordType } from "./KeywordType";
import { AstNodeType } from "./AstNodeType";
import { ObjectPropertyKind } from "./objectPropertyKind";

// General
export interface IAstNode {
	nodeType: AstNodeType;
	start: ISymbolPosition;
	end: ISymbolPosition;
}
export interface IAstToken extends IAstNode {
	token: ICodeToken;
}
export interface IAstTokenSequence extends IAstNode {
	tokens: ICodeToken[];
}
export interface IAstKeyword extends IAstNode {
	keywordType: KeywordType;
}
export interface IAstDebuggerKeyword extends IAstKeyword {
}
export interface IAstText extends IAstNode {
	text: string;
}
export interface IAstOperator extends IAstNode {
	operatorType: OperatorType;
	value: string;
}
export interface IAstModule extends IAstNode {
	tokens: ICodeToken[];
	modulePath: string;
	content: IAstProgram;
	imports: IAstImportStatement[];
}
export interface IAstProgram extends IAstNode {
	content: IAstNode[];
}
export interface IAstCommentLine extends IAstNode {
	text: string;
}
export interface IAstCommentBlock extends IAstNode {
	text: string;
}
export interface IAstKeywordNode extends IAstNode {
	keyword: IAstKeyword;
	node: IAstNode;
	isKeywordFirst: boolean;
}

// Literals
export interface IAstNumber extends IAstNode {
	value: number;
}
export interface IAstString extends IAstNode {
	allowIncludes: boolean;
	value: IAstNode[];
}
export interface IAstRegexLiteral extends IAstNode {
	value: string;
}
export interface IAstBoolean extends IAstNode {
	value: boolean;
}
export interface IAstArray extends IAstNode {
	value: IAstNode[];
}
export interface IAstObject extends IAstNode {
	properties: IAstNode[];
}
export interface IAstFunction extends IAstNode {
	isLambda: boolean;
	isAsync: boolean;
	isGenerator: boolean;
	isNoKeyword: boolean;
	name: IAstNode;
	args: IAstNode[];
	body: IAstNode;
}

// Identifiers
export interface IAstIdentifier extends IAstNode {
	value: string;
	isJsIdentifier: boolean;
}
export interface IAstRawIdentifier extends IAstNode {
	value: IAstNode;
}
export interface IAstContextIdentifier extends IAstNode {
	value: IAstNode;
}
export interface IAstIdentifierScope extends IAstNode {
	value: IAstNode[];
}

// Declarations
export interface IAstVariableDeclaration extends IAstNode {
	identifiers: IAstNode[];
	value: IAstNode;
	kind: VariableDeclarationKind;
}
export interface IAstPropertyDeclaration extends IAstNode {
	propertyKind: ObjectPropertyKind;
	identifier: IAstNode;
	value: IAstNode;
	initializer: IAstNode;
}
export interface IAstClassDeclaration extends IAstNode {
	name: IAstNode;
	contents: IAstNode[];
}

// Statements
export interface IAstBreakStatement extends IAstNode { }
export interface IAstContinueStatement extends IAstNode { }
export interface IAstBlockStatement extends IAstNode {
	content: IAstNode[];
	withoutBraces: boolean;
}
export interface IAstThrowStatement extends IAstNode {
	expression: IAstNode;
}
export interface IAstIfStatement extends IAstNode {
	condition: IAstNode;
	thenValue: IAstNode;
	elseValue: IAstNode;
}
export interface IAstSwitchStatement extends IAstNode {
	condition: IAstNode;
	cases: IAstNode[];
}
export interface IAstCaseStatement extends IAstNode {
	condition: IAstNode;
	body: IAstNode[];
	consequent: IAstNode;
}
export interface IAstWhileStatement extends IAstNode {
	condition: IAstNode;
	body: IAstNode;
}
export interface IAstDoWhileStatement extends IAstNode {
	condition: IAstNode;
	body: IAstNode;
}
export interface IAstForStatement extends IAstNode {
	init: IAstNode;
	test: IAstNode;
	update: IAstNode;
	body: IAstNode;
}
export interface IAstForInStatement extends IAstNode {
	left: IAstNode;
	right: IAstNode;
	body: IAstNode;
}
export interface IAstForOfStatement extends IAstNode {
	left: IAstNode;
	right: IAstNode;
	body: IAstNode;
}
export interface IAstImportStatement extends IAstNode {
	identifier: IAstNode;
	path: IAstNode;
	importInContext: boolean;
}
export interface IAstRawImportStatement extends IAstNode {
	identifier: IAstNode | IAstNode[];
	path: IAstNode;
}
export interface IAstImportItem extends IAstNode {
	identifier: IAstNode;
	alias: IAstNode;
}
export interface IAstTryStatement extends IAstNode {
	body: IAstNode;
	catchClause: IAstNode;
	finallyBlock: IAstNode;
}
export interface IAstCatchStatement extends IAstNode {
	varDeclaration: IAstNode;
	body: IAstNode;
}
export interface IAstFinallyStatement extends IAstNode {
	body: IAstNode;
}

// Expressions
export interface IAstParenExpression extends IAstNode {
	expression: IAstNode;
}
export interface IAstCallExpression extends IAstNode {
	calee: IAstNode;
	args: IAstNode[];
}
export interface IAstUpdateExpression extends IAstNode {
	operator: IAstNode;
	argument: IAstNode;
	prefix: boolean;
}
export interface IAstBinaryExpression extends IAstNode {
	left: IAstNode;
	right: IAstNode;
	operator: IAstNode;
}
export interface IAstMemberExpression extends IAstNode {
	object: IAstNode;
	property: IAstNode;
	optional: boolean;
}
export interface IAstIndexerExpression extends IAstNode {
	member: IAstMemberExpression;
}
export interface IAstConditionalExpression extends IAstNode {
	condition: IAstNode;
	questionToken: IAstNode;
	whenTrue: IAstNode;
	colonToken: IAstNode;
	whenFalse: IAstNode;
}

// storytailor-Specific
export interface IAstOuterStatement extends IAstNode {
	indent: number;
	statement: IAstNode;
}
export interface IAstTextLineStatement extends IAstNode {
	indent: number;
	text: IAstNode[];
}
export interface IAstObjectLineStatement extends IAstNode {
	object: IAstNode;
	value: IAstNode;
	tags: IAstNode[];
}
export interface IAstStringIncludeStatement extends IAstNode {
	expression: IAstNode;
}
export interface IAstPrototypeExpression extends IAstNode {
	value: IAstNode;
}
export interface IAstDeleteLineExpression extends IAstNode {
	object: IAstNode;
}
export interface IAstScope extends IAstNode {
	content: IAstNode[];
	open: IAstNode;
	close: IAstNode;
}
