import * as acorn from "acorn";
import { Parser } from "acorn";

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
			console.log("Reading a token!")
			super.readToken(code);
		}
		parseStatement(context, topLevel, exports) {
			// Custom parsing logic here
			// ...
			const result = super.parseStatement(context, topLevel, exports);
			console.log(`parsed ${result} node`, result);
		}
	}
}

// Create an instance of the parser with the plugin
const MyParser = Parser.extend(noisyReadToken as any);


export const acornCompiler = {
	parse: (fileContent: string): acorn.Program => {
		const options: acorn.Options = acorn.defaultOptions;
		const result = MyParser.parse(fileContent, options);
		return result;
		return undefined;
	}
}