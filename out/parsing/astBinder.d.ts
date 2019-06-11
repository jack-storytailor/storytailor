import { IAstNode } from "../ast/IAstNode";
export interface ICollectBindingsRequest {
    ast: IAstNode;
}
export interface ICollectBindingsResponse {
}
export declare const collectBindings: (request: ICollectBindingsRequest) => ICollectBindingsResponse;
