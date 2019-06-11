import { IAstNode } from "../ast/IAstNode";
import { astUtils } from "../ast/astUtils";

export interface ICollectBindingsRequest {
  ast: IAstNode;
}

export interface ICollectBindingsResponse {

}

interface ICollectState {
  ast: IAstNode;

}

export const collectBindings = (request: ICollectBindingsRequest): ICollectBindingsResponse => {
  if (!request || !request.ast) {
    return undefined;
  }

  let ast = request.ast;
  let state: ICollectState = {
    ast
  };

  astUtils.forEachChild(ast, (node) => { visitNode(node, state)});

  // prepare result
  let result = {};
  return result;
}

const visitNode = (node: IAstNode, state: ICollectState) => {
  if (!node || !state) {
    console.log("visit node returns without params");
    return;
  }

  console.log("node, start, end: ", node.nodeType, node.start, node.end);
  astUtils.forEachChild(node, (node) => { visitNode(node, state); })
}