import { ISymbolPosition } from "./ISymbolPosition";
import { CodeTokenType } from "./CodeTokenType";

export interface ICodeToken {
	type: CodeTokenType;
	value?: string;
	start: ISymbolPosition;
	end: ISymbolPosition;
	length: number;
}