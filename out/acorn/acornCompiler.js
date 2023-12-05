"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acornCompiler = void 0;
const acorn = require("acorn");
const acorn_1 = require("acorn");
class StoryTailorVariableDeclarationNode {
    constructor(variableName, expression) {
        this.type = "StoryTailorVariableDeclaration";
        this.variableName = variableName;
        this.expression = expression;
    }
}
function StoryTailorExtension(Parser) {
    // Modify the prototype to add or override methods
    const extendedParser = Parser.extend({}, {
        parseStatement(context, topLevel, exports) {
            // Custom parsing logic here
            // ...
            const result = super.parseStatement(context, topLevel, exports);
            console.log(`parsed ${result} node`, result);
            return result;
        }
    });
    return extendedParser;
}
function noisyReadToken(Parser) {
    return class extends Parser {
        readToken(code) {
            console.log("Reading a token!");
            super.readToken(code);
        }
        parseStatement(context, topLevel, exports) {
            // Custom parsing logic here
            // ...
            const result = super.parseStatement(context, topLevel, exports);
            console.log(`parsed ${result} node`, result);
        }
    };
}
// Create an instance of the parser with the plugin
const MyParser = acorn_1.Parser.extend(noisyReadToken);
exports.acornCompiler = {
    parse: (fileContent) => {
        const options = acorn.defaultOptions;
        const result = MyParser.parse(fileContent, options);
        return result;
        return undefined;
    }
};
