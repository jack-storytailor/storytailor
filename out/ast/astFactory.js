"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AstNodeType_1 = require("./AstNodeType");
exports.astFactory = {
    // general
    token: (token, start) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Token,
            start: start,
            end: Object.assign({}, start, { symbol: start.symbol + 1 }),
            token: token
        };
    },
    tokenSequence: (tokens, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.TokenSequence,
            start,
            end,
            tokens
        };
    },
    keyword: (keywordType, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Keyword,
            start,
            end,
            keywordType
        };
    },
    debuggerKeyword: (keywordType, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.DebuggerKeyword,
            start,
            end,
            keywordType
        };
    },
    text: (text, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Text,
            start: start,
            end: end,
            text: text
        };
    },
    operator: (operatorType, value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Operator,
            start: start,
            end: end,
            operatorType,
            value
        };
    },
    module: (tokens, content, imports, modulePath) => {
        let start = {
            symbol: 0,
            line: 0,
            column: 0
        };
        let end = Object.assign({}, start);
        if (tokens && tokens.length > 0) {
            let firstToken = tokens[0];
            let lastToken = tokens[tokens.length - 1];
            start = Object.assign({}, firstToken.start);
            end = Object.assign({}, lastToken.end);
        }
        return {
            nodeType: AstNodeType_1.AstNodeType.AstModule,
            tokens,
            content,
            imports,
            modulePath,
            start,
            end
        };
    },
    program: (content, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Program,
            content,
            start,
            end
        };
    },
    commentLine: (text, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.CommentLine,
            text,
            start,
            end
        };
    },
    commentBlock: (text, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.CommentBlock,
            text,
            start,
            end
        };
    },
    // literals
    numberLiteral: (value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Number,
            value,
            start,
            end
        };
    },
    stringLiteral: (value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.String,
            value,
            start,
            end
        };
    },
    booleanLiteral: (value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Boolean,
            value,
            start,
            end
        };
    },
    arrayLiteral: (value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Array,
            value,
            start,
            end
        };
    },
    // identifiers
    identifier: (value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Identifier,
            value,
            start,
            end
        };
    },
    rawIndentifier: (value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.RawIdentifier,
            value,
            start,
            end
        };
    },
    IdentifierScope: (value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.IdentifierScope,
            value,
            start,
            end
        };
    },
    // declarations
    functionDeclaration: (args, body, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.FunctionDeclaration,
            start,
            end,
            args,
            body,
        };
    },
    variableDeclaration: (identifier, kind, value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.VariableDeclaration,
            start,
            end,
            identifier,
            kind,
            value
        };
    },
    propertyDeclaration: (identifier, value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.PropertyDeclaration,
            start,
            end,
            identifier,
            value
        };
    },
    // statements
    statement: (statement, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Statement,
            start,
            end,
            statement
        };
    },
    breakStatement: (start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.BreakStatement,
            start,
            end
        };
    },
    returnStatement: (value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.ReturnStatement,
            start,
            end,
            value
        };
    },
    continueStatement: (start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.ContinueStatement,
            start,
            end
        };
    },
    blockStatement: (content, start, end, withoutBraces = false) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.BlockStatement,
            start,
            end,
            content,
            withoutBraces
        };
    },
    ifStatement: (condition, thenValue, elseValue, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.IfStatement,
            start,
            end,
            condition,
            thenValue,
            elseValue
        };
    },
    switchStatement: (condition, cases, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.SwitchStatement,
            start,
            end,
            cases,
            condition,
        };
    },
    caseStatement: (condition, body, consequent, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.CaseStatement,
            start,
            end,
            condition,
            body,
            consequent
        };
    },
    whileStatement: (condition, body, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.WhileStatement,
            start,
            end,
            condition,
            body
        };
    },
    doWhileStatement: (condition, body, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.DoWhileStatement,
            start,
            end,
            condition,
            body
        };
    },
    forStatement: (init, test, update, body, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.ForStatement,
            start,
            end,
            init,
            test,
            update,
            body
        };
    },
    forInStatement: (left, right, body, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.ForInStatement,
            start,
            end,
            left,
            right,
            body
        };
    },
    importStatement: (alias, identifier, path, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.ImportStatement,
            start,
            end,
            alias,
            path,
            identifier
        };
    },
    tryStatement: (body, catchClause, finallyBlock, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.TryStatement,
            start,
            end,
            body,
            catchClause,
            finallyBlock
        };
    },
    catchStatement: (body, varDeclaration, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.CatchStatement,
            start,
            end,
            body,
            varDeclaration
        };
    },
    finallyStatement: (body, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.FinallyStatement,
            start,
            end,
            body
        };
    },
    throwStatement: (expression, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.ThrowStatement,
            start,
            end,
            expression
        };
    },
    // expression statements
    expressionStatement: (expression, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.ExpressionStatement,
            start,
            end,
            expression
        };
    },
    parenExpression: (expression, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.ParenExpression,
            start,
            end,
            expression
        };
    },
    objectExpression: (properties, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.ObjectExpression,
            start,
            end,
            properties
        };
    },
    callExpression: (calee, args, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.CallExpression,
            start,
            end,
            args,
            calee
        };
    },
    operationExpression: (operation, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.OperationExpression,
            start,
            end,
            operation
        };
    },
    updateExpression: (argument, operator, prefix, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.UpdateExpression,
            start,
            end,
            argument,
            operator,
            prefix
        };
    },
    binaryExpression: (left, operator, right, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.BinaryExpression,
            start,
            end,
            left,
            operator,
            right
        };
    },
    memberExpression: (object, property, computed, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.MemberExpression,
            start,
            end,
            object,
            property,
            computed
        };
    },
    IndexerExpression: (member, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.IndexerExpression,
            start,
            end,
            member
        };
    },
    conditionalExpression: (condition, whenTrue, whenFalse, colonToken, questionToken, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.ConditionalExpression,
            start,
            end,
            condition,
            whenFalse,
            whenTrue,
            colonToken,
            questionToken
        };
    },
    newExpression: (expression, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.NewExpression,
            start,
            end,
            expression
        };
    },
    deleteExpression: (expression, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.DeleteExpression,
            start,
            end,
            expression
        };
    },
    // storytailor-specific
    outerStatement: (indent, statement, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.OuterStatement,
            start,
            end,
            indent,
            statement
        };
    },
    textLineStatement: (indent, text, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.TextLineStatement,
            start,
            end,
            indent,
            text
        };
    },
    objectLineStatement: (object, value, tags, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.ObjectLineStatement,
            start,
            end,
            object,
            value,
            tags
        };
    },
    stringIncludeStatement: (expression, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.StringIncludeStatement,
            start,
            end,
            expression
        };
    },
    prototypeExpression: (value, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.PrototypeExpression,
            start,
            end,
            value
        };
    },
    deleteLineExpression: (object, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.DeleteLineExpression,
            start,
            end,
            object
        };
    },
    scope: (content, open, close, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Scope,
            start,
            end,
            content,
            open,
            close
        };
    },
    tag: (content, open, close, start, end) => {
        return {
            nodeType: AstNodeType_1.AstNodeType.Tag,
            start,
            end,
            content,
            open,
            close
        };
    },
    // casting
    asNode: (ast, nodeType) => {
        if (!ast || ast.nodeType !== nodeType) {
            return undefined;
        }
        return ast;
    }
};
