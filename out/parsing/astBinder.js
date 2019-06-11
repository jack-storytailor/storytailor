"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const astUtils_1 = require("../ast/astUtils");
exports.collectBindings = (request) => {
    if (!request || !request.ast) {
        return undefined;
    }
    let ast = request.ast;
    let state = {
        ast
    };
    astUtils_1.astUtils.forEachChild(ast, (node) => { visitNode(node, state); });
    // prepare result
    let result = {};
    return result;
};
const visitNode = (node, state) => {
    if (!node || !state) {
        console.log("visit node returns without params");
        return;
    }
    console.log("node, start, end: ", node.nodeType, node.start, node.end);
};
