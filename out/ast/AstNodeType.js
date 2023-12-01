"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstNodeType = void 0;
var AstNodeType;
(function (AstNodeType) {
    // general
    AstNodeType["Token"] = "Token";
    AstNodeType["TokenSequence"] = "TokenSequence";
    AstNodeType["Text"] = "Text";
    AstNodeType["Operator"] = "Operator";
    AstNodeType["Module"] = "Module";
    AstNodeType["Program"] = "Program";
    AstNodeType["Keyword"] = "Keyword";
    AstNodeType["DebuggerKeyword"] = "DebuggerKeyword";
    AstNodeType["CommentLine"] = "CommentLine";
    AstNodeType["CommentBlock"] = "CommentBlock";
    // literals
    AstNodeType["Number"] = "Number";
    AstNodeType["String"] = "String";
    AstNodeType["RegexLiteral"] = "RegexLiteral";
    AstNodeType["Boolean"] = "Boolean";
    AstNodeType["Array"] = "Array";
    // identifiers
    AstNodeType["Identifier"] = "Identifier";
    AstNodeType["IdentifierScope"] = "IdentifierScope";
    AstNodeType["RawIdentifier"] = "RawIdentifier";
    AstNodeType["ContextIdentifier"] = "ContextIdentifier";
    // declarations
    AstNodeType["FunctionDeclaration"] = "FunctionDeclaration";
    AstNodeType["VariableDeclaration"] = "VariableDeclaration";
    AstNodeType["PropertyDeclaration"] = "PropertyDeclaration";
    // statements
    AstNodeType["Statement"] = "Statement";
    AstNodeType["BreakStatement"] = "BreakStatement";
    AstNodeType["ReturnStatement"] = "ReturnStatement";
    AstNodeType["ContinueStatement"] = "ContinueStatement";
    AstNodeType["BlockStatement"] = "BlockStatement";
    AstNodeType["IfStatement"] = "IfStatement";
    AstNodeType["SwitchStatement"] = "SwitchStatement";
    AstNodeType["CaseStatement"] = "CaseStatement";
    AstNodeType["WhileStatement"] = "WhileStatement";
    AstNodeType["DoWhileStatement"] = "DoWhileStatement";
    AstNodeType["ForStatement"] = "ForStatement";
    AstNodeType["ForInStatement"] = "ForInStatement";
    AstNodeType["ForOfStatement"] = "ForOfStatement";
    AstNodeType["ImportStatement"] = "ImportStatement";
    AstNodeType["TryStatement"] = "TryStatement";
    AstNodeType["CatchStatement"] = "CatchStatement";
    AstNodeType["FinallyStatement"] = "FinallyStatement";
    AstNodeType["ThrowStatement"] = "ThrowStatement";
    // expression statements
    AstNodeType["ExpressionStatement"] = "ExpressionStatement";
    AstNodeType["AwaitExpression"] = "AwaitExpression";
    AstNodeType["YieldExpression"] = "YieldExpression";
    AstNodeType["ParenExpression"] = "ParenExpression";
    AstNodeType["ObjectLiteral"] = "ObjectLiteral";
    AstNodeType["CallExpression"] = "CallExpression";
    AstNodeType["OperationExpression"] = "OperationExpression";
    AstNodeType["UpdateExpression"] = "UpdateExpression";
    AstNodeType["BinaryExpression"] = "BinaryExpression";
    AstNodeType["MemberExpression"] = "MemberExpression";
    AstNodeType["IndexerExpression"] = "IndexerExpression";
    AstNodeType["ConditionalExpression"] = "ConditionalExpression";
    AstNodeType["NewExpression"] = "NewExpression";
    AstNodeType["DeleteExpression"] = "DeleteExpression";
    AstNodeType["TypeofExpression"] = "TypeofExpression";
    AstNodeType["FunctionExpression"] = "FunctionExpression";
    // storytailor-specific
    AstNodeType["OuterStatement"] = "OuterStatement";
    AstNodeType["TextLineStatement"] = "TextLineStatement";
    AstNodeType["ObjectLineStatement"] = "ObjectLineStatement";
    AstNodeType["StringIncludeStatement"] = "StringIncludeStatement";
    AstNodeType["PrototypeExpression"] = "PrototypeExpression";
    AstNodeType["DeleteLineExpression"] = "DeleteLineExpression";
    AstNodeType["Scope"] = "Scope";
    AstNodeType["Tag"] = "Tag";
})(AstNodeType || (exports.AstNodeType = AstNodeType = {}));
