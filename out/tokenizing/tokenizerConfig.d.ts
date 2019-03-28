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
export declare const stsConfig: {
    separators: ITokenConfig[];
    tokens: ITokenConfig[];
    operations: IOperationConfig[];
    sortedSeparators: IHash<ITokenConfig>;
    sortedTokens: IHash<ITokenConfig>;
    sortedOperations: IHash<IOperationConfig>;
    allSeparatorsPattern: string;
    allSeparatorsRegexp: RegExp;
    allTokensPattern: string;
    allTokensRegexp: RegExp;
    combinePatterns: (patterns: string[], separator?: string, isGroup?: boolean) => string;
    wrapPatternWithCursorPos: (pattern: string, cursorPos: number) => string;
    getTokenType: (tokenValue: string, tokensConfigs?: ITokenConfig[]) => CodeTokenType;
    getOperationType: (tokenValue: string, operationConfigs?: IOperationConfig[]) => OperationType;
};
