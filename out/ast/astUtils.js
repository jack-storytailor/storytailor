"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.astUtils = void 0;
const AstNodeType_1 = require("./AstNodeType");
const astFactory_1 = require("./astFactory");
const childrenRegistry = {
    Token: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    TokenSequence: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    Text: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    Operator: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    Module: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.content];
    },
    Program: (ast) => {
        if (!ast) {
            return undefined;
        }
        return ast.content;
    },
    Keyword: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    DebuggerKeyword: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    CommentLine: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    CommentBlock: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    Number: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    String: (ast) => {
        if (!ast) {
            return undefined;
        }
        return ast.value;
    },
    Boolean: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    Array: (ast) => {
        if (!ast) {
            return undefined;
        }
        return ast.value;
    },
    Identifier: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    IdentifierScope: (ast) => {
        if (!ast) {
            return undefined;
        }
        return ast.value;
    },
    RawIdentifier: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.value];
    },
    ContextIdentifier: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.value];
    },
    FunctionExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [...ast.args, ast.body];
    },
    FunctionDeclaration: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.identifier, ...ast.args, ast.body];
    },
    VariableDeclaration: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.identifier, ast.value];
    },
    PropertyDeclaration: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.identifier, ast.value];
    },
    Statement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.statement];
    },
    BreakStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    ReturnStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    ContinueStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return undefined;
    },
    BlockStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return ast.content;
    },
    IfStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.condition, ast.thenValue, ast.elseValue];
    },
    SwitchStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.condition, ...ast.cases];
    },
    CaseStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.condition, ...ast.body, ast.consequent];
    },
    WhileStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.condition, ast.body];
    },
    DoWhileStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.condition, ast.body];
    },
    ForStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.init, ast.test, ast.update, ast.body];
    },
    ForInStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.left, ast.right, ast.body];
    },
    ImportStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.identifier, ast.alias, ast.path];
    },
    TryStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.body, ast.catchClause, ast.finallyBlock];
    },
    CatchStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.varDeclaration, ast.body];
    },
    FinallyStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.body];
    },
    ThrowStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.expression];
    },
    ExpressionStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.expression];
    },
    AwaitExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.expression];
    },
    YieldExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.expression];
    },
    ParenExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.expression];
    },
    ObjectExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return ast.properties;
    },
    CallExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.calee, ...ast.args];
    },
    OperationExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.operation];
    },
    UpdateExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        if (ast.prefix) {
            return [ast.operator, ast.argument];
        }
        else {
            return [ast.argument, ast.operator];
        }
    },
    BinaryExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.left, ast.operator, ast.right];
    },
    MemberExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.object, ast.property];
    },
    IndexerExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.member];
    },
    ConditionalExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.condition, ast.whenTrue, ast.whenFalse];
    },
    NewExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.expression];
    },
    DeleteExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.expression];
    },
    OuterStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.statement];
    },
    TextLineStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return ast.text;
    },
    ObjectLineStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.object, ast.value, ...ast.tags];
    },
    StringIncludeStatement: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.expression];
    },
    PrototypeExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.value];
    },
    DeleteLineExpression: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.object];
    },
    Scope: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.open, ...ast.content, ast.close];
    },
    Tag: (ast) => {
        if (!ast) {
            return undefined;
        }
        return [ast.open, ...ast.content, ast.close];
    }
};
exports.astUtils = {
    childrenRegistry,
    forEachChild: (root, operation) => {
        if (!root || !operation) {
            return;
        }
        let rootNodeType = root.nodeType;
        switch (rootNodeType) {
            case AstNodeType_1.AstNodeType.Token: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Token);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.TokenSequence: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.TokenSequence);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Text: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Text);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Operator: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Operator);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Module: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Module);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Program: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Program);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Keyword: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Keyword);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.DebuggerKeyword: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.DebuggerKeyword);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.CommentLine: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.CommentLine);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.CommentBlock: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.CommentBlock);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Number: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Number);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.String: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.String);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Boolean: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Boolean);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Array: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Array);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Identifier: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Identifier);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.IdentifierScope: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.IdentifierScope);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.RawIdentifier: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.RawIdentifier);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ContextIdentifier: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ContextIdentifier);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.FunctionExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.FunctionExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.FunctionDeclaration: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.FunctionDeclaration);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.VariableDeclaration: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.VariableDeclaration);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.PropertyDeclaration: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.PropertyDeclaration);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Statement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Statement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.BreakStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.BreakStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ReturnStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ReturnStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ContinueStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ContinueStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.BlockStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.BlockStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.IfStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.IfStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.SwitchStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.SwitchStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.CaseStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.CaseStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.WhileStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.WhileStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.DoWhileStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.DoWhileStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ForStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ForStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ForInStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ForInStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ImportStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ImportStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.TryStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.TryStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.CatchStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.CatchStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.FinallyStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.FinallyStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ThrowStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ThrowStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ExpressionStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ExpressionStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ParenExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ParenExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.AwaitExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.AwaitExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.YieldExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.YieldExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ObjectExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ObjectExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.CallExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.CallExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.OperationExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.OperationExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.UpdateExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.UpdateExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.BinaryExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.BinaryExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.MemberExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.MemberExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.IndexerExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.IndexerExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ConditionalExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ConditionalExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.NewExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.NewExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.DeleteExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.DeleteExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.OuterStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.OuterStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.TextLineStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.TextLineStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ObjectLineStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ObjectLineStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.StringIncludeStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.StringIncludeStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.PrototypeExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.PrototypeExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.DeleteLineExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.DeleteLineExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Scope: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Scope);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Tag: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Tag);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        operation(child);
                    }
                });
                break;
            }
            default: break;
        }
    },
    forEachChildSpecific: (root, operations, defaultOp) => {
        if (!root || !operations) {
            return;
        }
        let rootNodeType = root.nodeType;
        switch (rootNodeType) {
            case AstNodeType_1.AstNodeType.Token: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Token);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.TokenSequence: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.TokenSequence);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Text: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Text);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Operator: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Operator);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Module: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Module);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Program: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Program);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Keyword: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Keyword);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.DebuggerKeyword: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.DebuggerKeyword);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.CommentLine: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.CommentLine);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.CommentBlock: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.CommentBlock);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Number: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Number);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.String: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.String);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Boolean: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Boolean);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Array: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Array);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Identifier: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Identifier);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.IdentifierScope: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.IdentifierScope);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.RawIdentifier: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.RawIdentifier);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ContextIdentifier: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ContextIdentifier);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.FunctionExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.FunctionExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.FunctionDeclaration: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.FunctionDeclaration);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.VariableDeclaration: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.VariableDeclaration);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.PropertyDeclaration: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.PropertyDeclaration);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Statement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Statement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.BreakStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.BreakStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ReturnStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ReturnStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ContinueStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ContinueStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.BlockStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.BlockStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.IfStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.IfStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.SwitchStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.SwitchStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.CaseStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.CaseStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.WhileStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.WhileStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.DoWhileStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.DoWhileStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ForStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ForStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ForInStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ForInStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ImportStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ImportStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.TryStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.TryStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.CatchStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.CatchStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.FinallyStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.FinallyStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ThrowStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ThrowStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ExpressionStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ExpressionStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ParenExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ParenExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.AwaitExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.AwaitExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.YieldExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.YieldExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ObjectExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ObjectExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.CallExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.CallExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.OperationExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.OperationExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.UpdateExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.UpdateExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.BinaryExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.BinaryExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.MemberExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.MemberExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.IndexerExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.IndexerExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ConditionalExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ConditionalExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.NewExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.NewExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.DeleteExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.DeleteExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.OuterStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.OuterStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.TextLineStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.TextLineStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.ObjectLineStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.ObjectLineStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.StringIncludeStatement: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.StringIncludeStatement);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.PrototypeExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.PrototypeExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.DeleteLineExpression: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.DeleteLineExpression);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Scope: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Scope);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            case AstNodeType_1.AstNodeType.Tag: {
                let astNode = astFactory_1.astFactory.asNode(root, AstNodeType_1.AstNodeType.Tag);
                if (!astNode) {
                    return;
                }
                let getChildren = childrenRegistry[rootNodeType];
                if (!getChildren) {
                    return;
                }
                let children = getChildren(astNode);
                if (!children) {
                    return;
                }
                children.forEach(child => {
                    if (child) {
                        let operation = operations[child.nodeType] || defaultOp;
                        if (!operation) {
                            return;
                        }
                        operation(child);
                    }
                });
                break;
            }
            default: break;
        }
    },
};
