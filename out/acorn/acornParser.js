"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acornParser = exports.NodeTypes = exports.sortedSeparators = exports.allSeparators = exports.Separators = void 0;
const acorn = require("acorn");
const acorn_1 = require("acorn");
const TokContext = acorn.TokContext;
const tokContexts = acorn.tokContexts;
class StoryTailorVariableDeclarationNode {
    constructor(variableName, expression) {
        this.type = "StoryTailorVariableDeclaration";
        this.variableName = variableName;
        this.expression = expression;
    }
}
var Separators;
(function (Separators) {
    Separators["Endline13"] = "\r";
    Separators["EndLine10"] = "\n";
    Separators["Tab"] = "\t";
    Separators["Space"] = " ";
    Separators["Colon"] = ":";
    Separators["Semicolon"] = ";";
    Separators["Dot"] = ".";
    Separators["Coma"] = ",";
    Separators["Not"] = "!";
    Separators["Quote"] = "\"";
    Separators["Prime"] = "'";
    Separators["Tilde"] = "`";
    Separators["Plus"] = "+";
    Separators["Minus"] = "-";
    Separators["Equals"] = "=";
    Separators["Star"] = "*";
    Separators["Slash"] = "/";
    Separators["Backslash"] = "\\";
    Separators["More"] = ">";
    Separators["Less"] = "<";
    Separators["Caret"] = "^";
    Separators["Percent"] = "%";
    Separators["Dollar"] = "$";
    Separators["Hash"] = "#";
    Separators["At"] = "@";
    Separators["ParenL"] = "(";
    Separators["ParenR"] = ")";
    Separators["BraceL"] = "{";
    Separators["BraceR"] = "}";
    Separators["BraketL"] = "[";
    Separators["BraketR"] = "]";
    Separators["Question"] = "?";
    Separators["Or"] = "|";
    Separators["And"] = "&";
})(Separators || (exports.Separators = Separators = {}));
exports.allSeparators = [];
exports.sortedSeparators = {};
// fillSeparators
for (const key in Separators) {
    let separator = Separators[key];
    if (separator == ' ') {
        separator = '\\s';
    }
    exports.allSeparators.push(separator);
    exports.sortedSeparators[separator] = key;
}
var NodeTypes;
(function (NodeTypes) {
    NodeTypes["OuterTextLine"] = "OuterTextLine";
    NodeTypes["OuterDeclaration"] = "OuterDeclaration";
})(NodeTypes || (exports.NodeTypes = NodeTypes = {}));
function storyTailor(Parser) {
    const parser = class extends Parser {
        constructor() {
            super(...arguments);
            // if true, we don't apply storytailor's type of parsing
            // if false, we parse tokens by calling super.readToken
            this.isJsMode = false;
        }
        initialContext() {
            this.outerLineContext = new acorn.TokContext("*", true, true);
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
        charAtPos(charPos) {
            if (charPos === undefined) {
                charPos = this.pos;
            }
            if (this.input.length <= charPos) {
                return undefined;
            }
            return this.input.charAt(charPos);
        }
        nextChar() {
            const nextPos = this.pos + 1;
            return this.charAtPos(nextPos);
        }
        checkCharSequence(sequence, startPos) {
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
        checkString(value, startPos) {
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
        checkCommentsBeginning() {
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
        isSeparatorAtPos() {
            const char = this.charAtPos();
            return this.isSeparator(char);
        }
        isSeparator(char) {
            if (char === undefined) {
                return false;
            }
            if (char == ' ') {
                char = '\\s';
            }
            if (!exports.sortedSeparators[char]) {
                return false;
            }
            return true;
        }
        readStoryTailorWord() {
            if (this.checkCommentsBeginning()) {
                const char = this.charAtPos();
                this.pos++;
                return char;
            }
            this.containsEsc = false;
            let startPos = this.pos;
            let isEscaping = false;
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
        skipComments() {
            // skip one line comment
            while (this.skipSingleLineComment() === true) {
                return true;
            }
            // skip multiline comment
            let isSkipped = false;
            while (this.skipMultilineComment() === true) {
                isSkipped = true;
            }
            return isSkipped;
        }
        skipSingleLineComment() {
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
        skipMultilineComment() {
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
            }
            catch (error) {
                // TODO: add error to the errors list
                return undefined;
            }
            finally {
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
            }
            catch (error) {
                return undefined;
            }
            finally {
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
            }
            catch (error) {
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
                    resultValues.push(this.value);
                    this.nextToken();
                }
                result.end = this.pos;
                result.value = resultValues.join('');
                if (this.isEndOfFile()) {
                    this.nextToken();
                }
                return result;
            }
            catch (error) {
                return undefined;
            }
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
            }
            catch (error) {
                return undefined;
            }
        }
        isOuterCodeBlock(context, topLevel, exports) {
            if (topLevel !== true) {
                return false;
            }
            // check the sequence [\t\s]*\*
            const pos = this.pos;
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
        isEndOfFile() {
            if (!this.input || this.input.length <= this.pos || this.type === acorn.tokTypes.eof) {
                return true;
            }
            return false;
        }
    };
    return parser;
}
// Create an instance of the parser with the plugin
const MyParser = acorn_1.Parser.extend(storyTailor);
exports.acornParser = {
    parse: (fileContent) => {
        const options = acorn.defaultOptions;
        const result = MyParser.parse(fileContent, options);
        return result;
        return undefined;
    }
};
