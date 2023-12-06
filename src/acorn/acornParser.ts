import * as acorn from "acorn";
import { Parser } from "acorn";
const TokContext = (acorn as any).TokContext;
const tokContexts = (acorn as any).tokContexts;

class StoryTailorVariableDeclarationNode {
	type: string;
	variableName: string;
	expression: acorn.Node;

	constructor(variableName, expression) {
		this.type = "StoryTailorVariableDeclaration";
		this.variableName = variableName;
		this.expression = expression;
	}
}

export enum Separators {
	Endline13 = '\r',
	EndLine10 = '\n',
	Tab = '\t',
	Space = ' ',
	Colon = ':',
	Semicolon = ';',
	Dot = '.',
	Coma = ',',
	Not = '!',
	Quote = '"',
	Prime = '\'',
	Tilde = '`',
	Plus = '+',
	Minus = '-',
	Equals = '=',
	Star = '*',
	Slash = '/',
	Backslash = '\\',
	More = '>',
	Less = '<',
	Caret = '^',
	Percent = '%',
	Dollar = '$',
	Hash = '#',
	At = '@',
	ParenL = '(',
	ParenR = ')',
	BraceL = '{',
	BraceR = '}',
	BraketL = '[',
	BraketR = ']',
	Question = '?',
	Or = '|',
	And = '&',
}
export const allSeparators = []
export const sortedSeparators = {}
// fillSeparators
for (const key in Separators) {
	let separator = Separators[key];
	if (separator == ' ') {
		separator = '\\s';
	}
	allSeparators.push(separator);
	sortedSeparators[separator] = key;
}

export enum NodeTypes {
	OuterTextLine = "OuterTextLine",
	OuterDeclaration = "OuterDeclaration",
	TextLineInclude = "TextLineInclude",
	TextLineWord = "TextLineWord"
}

export interface IOuterExpression extends acorn.Node {

}

export interface IOuterTextLine extends acorn.Node {
	values: acorn.Node[];
}

function storyTailor(Parser) {
	const parser = class extends Parser {
		outerLineContext;

		// if true, we don't apply storytailor's type of parsing
		// if false, we parse tokens by calling super.readToken
		isJsMode: boolean = false;
		initialContext(): any[] {
			this.outerLineContext = new (acorn as any).TokContext("*", true, true);
			return [tokContexts.b_stat, this.outerLineContext];
		}
		nextToken() {
			return super.nextToken();
		}
		readToken(code) {
			if (this.isJsMode) {
				const token = super.readToken(code);
				return token;
			}
			else {
				const result = this.readWord();
				return result;
			}
		}
		readWord1() {
			const context = this.curContext();
			if (context.token === "*") {
				// storytailor
				return this.readStoryTailorWord();
			}
			return super.readWord1();
		}
		charAtPos(charPos?: number) {
			if (charPos === undefined) {
				charPos = this.pos;
			}

			if (this.input.length <= charPos) {
				return undefined;
			}

			return this.input.charAt(charPos);
		}
		nextChar(): string {
			const nextPos = this.pos + 1;
			return this.charAtPos(nextPos);
		}
		checkCharSequence(sequence: string[], startPos?: number): boolean {
			if (startPos === undefined) {
				startPos = this.pos;
			}

			if (sequence === undefined || sequence.length === 0) {
				return false;
			}

			for (let cIndex = 0; cIndex < sequence.length; cIndex++) {
				const char = sequence[cIndex];
				if (this.charAtPos(startPos + cIndex) !== char) {
					return false;
				}
			}

			return true;
		}
		checkString(value: string, startPos?: number): boolean {
			if (startPos === undefined) {
				startPos = this.pos;
			}

			if (!value) {
				return false;
			}

			const valueLength = value.length;
			if (valueLength === 0 || startPos + valueLength >= this.input.length) {
				return false;
			}

			for (let cIndex = 0; cIndex < valueLength; cIndex++) {
				const char = value[cIndex];
				if (this.input.charAt(startPos + cIndex) !== char) {
					return false;
				}
			}

			return true;
		}
		checkCommentsBeginning(): boolean {
			if (this.charAtPos() === '/') {
				if (this.checkString("//")) {
					return true;
				}
				if (this.checkString("/*")) {
					return true;
				}
			}

			return false;
		}
		isSeparatorAtPos(): boolean {
			const char = this.charAtPos();
			return this.isSeparator(char);
		}
		isSeparator(char): boolean {
			if (char === undefined) {
				return false;
			}

			if (char == ' ') {
				char = '\\s';
			}

			if (!sortedSeparators[char]) {
				return false;
			}

			return true;
		}
		readStoryTailorWord(): string {
			if (this.checkCommentsBeginning()) {
				const char = this.charAtPos();
				this.pos++;
				return char;
			}

			this.containsEsc = false;
			let startPos: number = this.pos;
			let isEscaping: boolean = false;
			while (this.pos < this.input.length) {
				if (!isEscaping && this.checkCommentsBeginning()) {
					break;
				}

				var char = this.charAtPos();
				if (this.isSeparator(char)) {
					if (char === '\n') {
						if (startPos === this.pos) {
							// if it's a first symbol in work and it's an endline, we return this endline as result
							this.pos++;
						}
						// anyways, endline ends the word
						break;
					}

					if (isEscaping) {
						// we have an escaped separator
						isEscaping = false;
						this.pos++;
						continue;
					}

					if (char === '\\') {
						// we have an escape symbol and we're not escaping
						isEscaping = true;
						this.pos++;
						continue;
					}

					if (startPos < this.pos) {
						// it's not a first symbol of this word and we found a separator and it's not escaped
						// and we don't include this symbol into the result (because it's not a first symbol in a word)
						break;
					}

					// if we here, that means we have a separator, but it's a first symbol in the word
					this.pos++;
					break;
				}

				// if we are here, that means we found not a separator, so continue reading the word

				isEscaping = false; // whatever it is, we're not in an escaping mode from now until the next \ symbol
				this.pos++;
				continue;
			}

			return this.input.slice(startPos, this.pos);
		}
		skipComments(): boolean {
			const ctx = this.curContext();

			const isSkipSpaces: boolean = ctx.preserveSpace !== true;
			
			if (isSkipSpaces) {
				this.skipSpace();
			}
			
			// skip one line comment
			while (this.skipSingleLineComment() === true) {
				return true;
			}

			// skip multiline comment
			let isSkipped = false;
			while (this.skipMultilineComment() === true) {
				isSkipped = true;

				this.skipSpace();
			}

			return isSkipped;
		}
		skipSingleLineComment(): boolean {
			if (this.value != '/' || this.charAtPos() != '/') {
				return false;
			}

			// skip until the end of line
			while (!this.isEndOfFile()) {
				this.nextToken();
				if (this.value !== '\n') {
					continue;
				}

				break;
			}

			return true;
		}
		skipMultilineComment(): boolean {
			if (!this.checkString("/*")) {
				return false;
			}

			this.pos += 2;

			while (!this.isEndOfFile()) {
				if (this.checkString("*/")) {
					this.pos += 2;
					break;
				}
				else {
					this.pos++;
				}
			}

			return true;
		}

		parseIndent(context, topLevel, exports) {
			if (topLevel !== true) {
				return undefined;
			}

			try {
				// parse tab symbols
				let indent = 0;

				while (!this.isEndOfFile()) {
					if (this.value == '\t') {
						indent++;
						this.nextToken();
						continue;
					}
					break;
				}

				return indent;
			} catch (error) {
				return undefined;
			}
		}
		parseTopLevel(node) {
			return super.parseTopLevel(node);
		}
		parseStatement(context, topLevel, exports) {
			// skip comments
			while (this.skipComments() === true) {
				if (this.value === '\n') {
					this.nextToken();
					continue;
				}

				if (this.isEndOfFile()) {
					this.nextToken();
					return undefined;
				}
			}

			const outerStatement = this.parseTopLevelStatement(context, topLevel, exports);
			if (outerStatement) {
				return outerStatement;
			}

			this.isJsMode = true;

			try {
				this.context.pop();
				const statement = super.parseStatement(context, topLevel, exports);
				return statement;
			} catch (error) {
				// TODO: add error to the errors list
				return undefined;
			} finally {
				this.context.push(this.outerLineContext);
				this.isJsMode = false;
			}
		}
		parseTopLevelStatement(context, topLevel, exports) {
			if (topLevel !== true) {
				return undefined;
			}

			const outerStatement = this.parseOuterCodeBlock(context, topLevel, exports);
			if (outerStatement) {
				return outerStatement;
			}

			const outerDeclaration = this.parseOuterDeclaration(context, topLevel, exports);
			if (outerDeclaration) {
				return outerDeclaration;
			}

			const outerTextLine = this.parseOuterTextLine(context, topLevel, exports);
			if (outerTextLine) {
				return outerTextLine;
			}

			return undefined;
		}
		parseOuterCodeBlock(context, topLevel, exports) {
			if (this.isOuterCodeBlock(context, topLevel, exports) !== true) {
				return undefined;
			}

			try {
				context.pop();

				this.expect(acorn.tokTypes.star);
				return super.parseStatement(context, topLevel, exports);
			} catch (error) {
				return undefined;
			} finally {
				context.push(this.outerLineContext);
			}
		}
		parseOuterDeclaration(context, topLevel, exports) {
			if (topLevel !== true) {
				return;
			}

			try {
				// parse indent
				// parse identifier until end of line or until the = sign
				return undefined;
			} catch (error) {
				return undefined;
			}
		}
		parseOuterTextLine(context, topLevel, exports) {
			if (topLevel !== true) {
				return undefined;
			}

			try {
				const resultValues = [];
				// parse indent
				const indent = this.parseIndent(context, topLevel, exports);

				// if it's an empty commented line, skip it
				if (this.skipComments() === true) {
					if (this.value === '\n') {
						this.nextToken();
						return undefined;
					}
				}

				const result = this.startNode();
				result.type = NodeTypes.OuterTextLine;
				result.indent = indent;

				// parse everything until the end of line
				while (!this.isEndOfFile()) {
					if (this.value === "\n" || this.value === "\r") {
						this.nextToken();
						break;
					}

					const textInclude = this.parseTextLineInclude(context, topLevel, exports);
					if (textInclude) {
						resultValues.push(textInclude);
					}
					else {
						const wordNode = {
							type: NodeTypes.TextLineWord,
							value: this.value
						}
						resultValues.push(wordNode);
					}

					this.nextToken();
				}

				result.end = this.pos;
				result.value = resultValues;

				if (this.isEndOfFile()) {
					this.nextToken();
				}

				return result;
			} catch (error) {
				return undefined;
			}
		}
		parseTextLineInclude(context, topLevel, exports) {
			if (this.isEndOfFile()) {
				return undefined;
			}

			if (this.value !== "*") {
				return undefined;
			}

			// skip star
			this.nextToken();

			let result = undefined;
			try {
				this.context.pop();

				// skip comments
				this.skipComments();

				// parse expression
				result = super.parseExpression();

				// skip comments
				this.skipComments();

				// skip ;
				if (this.value === ";") {
					this.nextToken();
				}
			} catch (error) {
				console.error(error);
			} finally {
				this.context.push(this.outerLineContext);
			}

			return result;
		}

		isOuterCodeBlock(context, topLevel, exports): boolean {
			if (topLevel !== true) {
				return false;
			}

			// check the sequence [\t\s]*\*
			const pos: number = this.pos as number;
			const inputText = this.input;

			// check the length of string. And also keep in mind that string has to be at least 3 symbols long (* {)
			if (!inputText || inputText.length <= (pos + 3)) {
				return false;
			}

			const regex = new RegExp(`^(?:.{0, ${this.pos}})[\\t\\s]*\\*[\\t\\s]*\\{`);
			if (!regex.test(inputText)) {
				return false;
			}

			return true;
		}
		isEndOfFile(): boolean {
			if (!this.input || this.input.length <= this.pos || this.type === acorn.tokTypes.eof) {
				return true;
			}

			return false;
		}
	}

	return parser;
}

// Create an instance of the parser with the plugin
const MyParser = Parser.extend(storyTailor as any);


export const acornParser = {
	parse: (fileContent: string): acorn.Program => {
		const options: acorn.Options = acorn.defaultOptions;
		const result = MyParser.parse(fileContent, options);
		return result;
		return undefined;
	}
}