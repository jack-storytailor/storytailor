import { 
  IAstNode, 
  IAstToken, 
  IAstTokenSequence, 
  IAstText, 
  IAstOperator, 
  IAstProgram, 
  IAstKeyword, 
  IAstDebuggerKeyword, 
  IAstCommentLine, 
  IAstCommentBlock, 
  IAstIdentifier, 
  IAstIdentifierScope, 
  IAstRawIdentifier, 
  IAstContextIdentifier, 
  IAstPropertyDeclaration, 
  IAstBreakStatement, 
  IAstContinueStatement, 
  IAstBlockStatement, 
  IAstIfStatement, 
  IAstSwitchStatement, 
  IAstCaseStatement, 
  IAstWhileStatement, 
  IAstDoWhileStatement, 
  IAstForStatement, 
  IAstForInStatement, 
  IAstImportStatement, 
  IAstTryStatement, 
  IAstCatchStatement, 
  IAstFinallyStatement, 
  IAstThrowStatement, 
  IAstParenExpression, 
  IAstObject, 
  IAstCallExpression, 
  IAstUpdateExpression, 
  IAstBinaryExpression, 
  IAstMemberExpression, 
  IAstIndexerExpression, 
  IAstConditionalExpression, 
  IAstOuterStatement, 
  IAstTextLineStatement, 
  IAstObjectLineStatement, 
  IAstStringIncludeStatement, 
  IAstPrototypeExpression, 
  IAstDeleteLineExpression, 
  IAstScope, 
  IAstNumber, 
  IAstString, 
  IAstBoolean, 
  IAstArray, 
  IAstModule, 
  IAstRegexLiteral,
  IAstVariableDeclaration
} from "./IAstNode";
import { AstNodeType } from "./AstNodeType";
import { astFactory } from "./astFactory";
import { IHash } from "../shared/IHash";

const childrenRegistry = {
  Token: (ast: IAstToken): IAstNode[] => {
    if (!ast) { return undefined; }
    
    return undefined;
  },
  
  TokenSequence: (ast: IAstTokenSequence): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return undefined;
  },
  
  Text: (ast: IAstText): IAstNode[] => {
    if (!ast) { return undefined; }

    return undefined;
  },
  
  Operator: (ast: IAstOperator): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return undefined;
  },
  
  Module: (ast: IAstModule): IAstNode[] => {
    if (!ast) { return undefined; }

    return [ast.content];
  },
  
  Program: (ast: IAstProgram): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return ast.content;
  },
  
  Keyword: (ast: IAstKeyword): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return undefined;
  },
  
  DebuggerKeyword: (ast: IAstDebuggerKeyword): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return undefined;
  },
  
  CommentLine: (ast: IAstCommentLine): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return undefined;
  },
  
  CommentBlock: (ast: IAstCommentBlock): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return undefined;
  },
  
  Number: (ast: IAstNumber): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return undefined;
  },
  
  String: (ast: IAstString): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return ast.value;
  },
  
  RegexLiteral: (ast: IAstRegexLiteral): IAstNode[] => {
	if (!ast) { return undefined; }

	return undefined;
  },

  Boolean: (ast: IAstBoolean): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return undefined;
  },
  
  Array: (ast: IAstArray): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return ast.value;
  },
  
  Identifier: (ast: IAstIdentifier): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return undefined;
  },
  
  IdentifierScope: (ast: IAstIdentifierScope): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return ast.value;
  },
  
  RawIdentifier: (ast: IAstRawIdentifier): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.value];
  },
  
  ContextIdentifier: (ast: IAstContextIdentifier): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.value];
  },
  
  VariableDeclaration: (ast: IAstVariableDeclaration): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [...ast.identifiers, ast.value];
  },
  
  PropertyDeclaration: (ast: IAstPropertyDeclaration): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.identifier, ast.value, ast.initializer];
  },
  
  BreakStatement: (ast: IAstBreakStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return undefined;
  },
    
  ContinueStatement: (ast: IAstContinueStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return undefined;
  },
  
  BlockStatement: (ast: IAstBlockStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return ast.content;
  },
  
  IfStatement: (ast: IAstIfStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.condition, ast.thenValue, ast.elseValue];
  },
  
  SwitchStatement: (ast: IAstSwitchStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.condition, ...ast.cases];
  },
  
  CaseStatement: (ast: IAstCaseStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.condition, ...ast.body, ast.consequent];
  },
  
  WhileStatement: (ast: IAstWhileStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.condition, ast.body];
  },
  
  DoWhileStatement: (ast: IAstDoWhileStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.condition, ast.body];
  },
  
  ForStatement: (ast: IAstForStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.init, ast.test, ast.update, ast.body];
  },
  
  ForInStatement: (ast: IAstForInStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.left, ast.right, ast.body];
  },
  
  ImportStatement: (ast: IAstImportStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.identifier, ast.path];
  },
  
  TryStatement: (ast: IAstTryStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.body, ast.catchClause, ast.finallyBlock];
  },
  
  CatchStatement: (ast: IAstCatchStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.varDeclaration, ast.body];
  },
  
  FinallyStatement: (ast: IAstFinallyStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.body];
  },
  
  ThrowStatement: (ast: IAstThrowStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.expression];
  },
  
  ParenExpression: (ast: IAstParenExpression): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.expression];
  },
  
  ObjectExpression: (ast: IAstObject): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return ast.properties;
  },
  
  CallExpression: (ast: IAstCallExpression): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.calee, ...ast.args];
  },
  
  UpdateExpression: (ast: IAstUpdateExpression): IAstNode[] => {
    if (!ast) { return undefined; }
  
    if (ast.prefix) {
      return [ast.operator, ast.argument];
    }
    else {
      return [ast.argument, ast.operator];
    }
  },
  
  BinaryExpression: (ast: IAstBinaryExpression): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.left, ast.operator, ast.right];
  },
  
  MemberExpression: (ast: IAstMemberExpression): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.object, ast.property];
  },
  
  IndexerExpression: (ast: IAstIndexerExpression): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.member];
  },
  
  ConditionalExpression: (ast: IAstConditionalExpression): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.condition, ast.whenTrue, ast.whenFalse];
  },
  
  OuterStatement: (ast: IAstOuterStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.statement];
  },
  
  TextLineStatement: (ast: IAstTextLineStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return ast.text;
  },
  
  ObjectLineStatement: (ast: IAstObjectLineStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.object, ast.value];
  },
  
  StringIncludeStatement: (ast: IAstStringIncludeStatement): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.expression];
  },
  
  PrototypeExpression: (ast: IAstPrototypeExpression): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.value];
  },
  
  DeleteLineExpression: (ast: IAstDeleteLineExpression): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.object];
  },
  
  Scope: (ast: IAstScope): IAstNode[] => {
    if (!ast) { return undefined; }
  
    return [ast.open, ...ast.content, ast.close];
  },
}

export const astUtils = {

  childrenRegistry,

  forEachChild: (root: IAstNode, operation: (node: IAstNode) => void) => {
    if (!root || !operation) {
      return;
    }

    let rootNodeType: AstNodeType = root.nodeType;

    switch (rootNodeType) {
      case AstNodeType.Token: {
        let astNode = astFactory.asNode<IAstToken>(root, AstNodeType.Token);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.TokenSequence: {
        let astNode = astFactory.asNode<IAstTokenSequence>(root, AstNodeType.TokenSequence);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.Text: {
        let astNode = astFactory.asNode<IAstText>(root, AstNodeType.Text);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.Operator: {
        let astNode = astFactory.asNode<IAstOperator>(root, AstNodeType.Operator);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.Module: {
        let astNode = astFactory.asNode<IAstModule>(root, AstNodeType.Module);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.Program: {
        let astNode = astFactory.asNode<IAstProgram>(root, AstNodeType.Program);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.Keyword: {
        let astNode = astFactory.asNode<IAstKeyword>(root, AstNodeType.Keyword);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.DebuggerKeyword: {
        let astNode = astFactory.asNode<IAstDebuggerKeyword>(root, AstNodeType.DebuggerKeyword);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.CommentLine: {
        let astNode = astFactory.asNode<IAstCommentLine>(root, AstNodeType.CommentLine);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.CommentBlock: {
        let astNode = astFactory.asNode<IAstCommentBlock>(root, AstNodeType.CommentBlock);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.Number: {
        let astNode = astFactory.asNode<IAstNumber>(root, AstNodeType.Number);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.String: {
        let astNode = astFactory.asNode<IAstString>(root, AstNodeType.String);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.RegexLiteral: {
        let astNode = astFactory.asNode<IAstRegexLiteral>(root, AstNodeType.RegexLiteral);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.Boolean: {
        let astNode = astFactory.asNode<IAstBoolean>(root, AstNodeType.Boolean);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.Array: {
        let astNode = astFactory.asNode<IAstArray>(root, AstNodeType.Array);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.Identifier: {
        let astNode = astFactory.asNode<IAstIdentifier>(root, AstNodeType.Identifier);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.IdentifierScope: {
        let astNode = astFactory.asNode<IAstIdentifierScope>(root, AstNodeType.IdentifierScope);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.RawIdentifier: {
        let astNode = astFactory.asNode<IAstRawIdentifier>(root, AstNodeType.RawIdentifier);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.ContextIdentifier: {
        let astNode = astFactory.asNode<IAstContextIdentifier>(root, AstNodeType.ContextIdentifier);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.VariableDeclaration: {
        let astNode = astFactory.asNode<IAstVariableDeclaration>(root, AstNodeType.VariableDeclaration);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.PropertyDeclaration: {
        let astNode = astFactory.asNode<IAstPropertyDeclaration>(root, AstNodeType.PropertyDeclaration);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.BreakStatement: {
        let astNode = astFactory.asNode<IAstBreakStatement>(root, AstNodeType.BreakStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.ContinueStatement: {
        let astNode = astFactory.asNode<IAstContinueStatement>(root, AstNodeType.ContinueStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.BlockStatement: {
        let astNode = astFactory.asNode<IAstBlockStatement>(root, AstNodeType.BlockStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.IfStatement: {
        let astNode = astFactory.asNode<IAstIfStatement>(root, AstNodeType.IfStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.SwitchStatement: {
        let astNode = astFactory.asNode<IAstSwitchStatement>(root, AstNodeType.SwitchStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.CaseStatement: {
        let astNode = astFactory.asNode<IAstCaseStatement>(root, AstNodeType.CaseStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.WhileStatement: {
        let astNode = astFactory.asNode<IAstWhileStatement>(root, AstNodeType.WhileStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.DoWhileStatement: {
        let astNode = astFactory.asNode<IAstDoWhileStatement>(root, AstNodeType.DoWhileStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.ForStatement: {
        let astNode = astFactory.asNode<IAstForStatement>(root, AstNodeType.ForStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.ForInStatement: {
        let astNode = astFactory.asNode<IAstForInStatement>(root, AstNodeType.ForInStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.ImportStatement: {
        let astNode = astFactory.asNode<IAstImportStatement>(root, AstNodeType.ImportStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.TryStatement: {
        let astNode = astFactory.asNode<IAstTryStatement>(root, AstNodeType.TryStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.CatchStatement: {
        let astNode = astFactory.asNode<IAstCatchStatement>(root, AstNodeType.CatchStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.FinallyStatement: {
        let astNode = astFactory.asNode<IAstFinallyStatement>(root, AstNodeType.FinallyStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.ThrowStatement: {
        let astNode = astFactory.asNode<IAstThrowStatement>(root, AstNodeType.ThrowStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.ParenExpression: {
        let astNode = astFactory.asNode<IAstParenExpression>(root, AstNodeType.ParenExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }

      case AstNodeType.Object: {
        let astNode = astFactory.asNode<IAstObject>(root, AstNodeType.Object);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.CallExpression: {
        let astNode = astFactory.asNode<IAstCallExpression>(root, AstNodeType.CallExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.UpdateExpression: {
        let astNode = astFactory.asNode<IAstUpdateExpression>(root, AstNodeType.UpdateExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.BinaryExpression: {
        let astNode = astFactory.asNode<IAstBinaryExpression>(root, AstNodeType.BinaryExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.MemberExpression: {
        let astNode = astFactory.asNode<IAstMemberExpression>(root, AstNodeType.MemberExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.IndexerExpression: {
        let astNode = astFactory.asNode<IAstIndexerExpression>(root, AstNodeType.IndexerExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.ConditionalExpression: {
        let astNode = astFactory.asNode<IAstConditionalExpression>(root, AstNodeType.ConditionalExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.OuterStatement: {
        let astNode = astFactory.asNode<IAstOuterStatement>(root, AstNodeType.OuterStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.TextLineStatement: {
        let astNode = astFactory.asNode<IAstTextLineStatement>(root, AstNodeType.TextLineStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.ObjectLineStatement: {
        let astNode = astFactory.asNode<IAstObjectLineStatement>(root, AstNodeType.ObjectLineStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.StringIncludeStatement: {
        let astNode = astFactory.asNode<IAstStringIncludeStatement>(root, AstNodeType.StringIncludeStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.PrototypeExpression: {
        let astNode = astFactory.asNode<IAstPrototypeExpression>(root, AstNodeType.PrototypeExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.DeleteLineExpression: {
        let astNode = astFactory.asNode<IAstDeleteLineExpression>(root, AstNodeType.DeleteLineExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      case AstNodeType.Scope: {
        let astNode = astFactory.asNode<IAstScope>(root, AstNodeType.Scope);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => {
          if (child) { operation(child); }
        });
        break;
      }
      
      default: break;
    }

  },

  forEachChildSpecific: (root: IAstNode, operations: IHash<(node) => void>, defaultOp: (node) => void) => {
    if (!root || !operations) {
      return;
    }

    let rootNodeType: AstNodeType = root.nodeType;

    switch (rootNodeType) {

      case AstNodeType.Token: {
        let astNode = astFactory.asNode<IAstToken>(root, AstNodeType.Token);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.TokenSequence: {
        let astNode = astFactory.asNode<IAstTokenSequence>(root, AstNodeType.TokenSequence);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.Text: {
        let astNode = astFactory.asNode<IAstText>(root, AstNodeType.Text);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.Operator: {
        let astNode = astFactory.asNode<IAstOperator>(root, AstNodeType.Operator);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.Module: {
        let astNode = astFactory.asNode<IAstModule>(root, AstNodeType.Module);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.Program: {
        let astNode = astFactory.asNode<IAstProgram>(root, AstNodeType.Program);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.Keyword: {
        let astNode = astFactory.asNode<IAstKeyword>(root, AstNodeType.Keyword);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.DebuggerKeyword: {
        let astNode = astFactory.asNode<IAstDebuggerKeyword>(root, AstNodeType.DebuggerKeyword);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.CommentLine: {
        let astNode = astFactory.asNode<IAstCommentLine>(root, AstNodeType.CommentLine);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.CommentBlock: {
        let astNode = astFactory.asNode<IAstCommentBlock>(root, AstNodeType.CommentBlock);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.Number: {
        let astNode = astFactory.asNode<IAstNumber>(root, AstNodeType.Number);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.String: {
        let astNode = astFactory.asNode<IAstString>(root, AstNodeType.String);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.RegexLiteral: {
        let astNode = astFactory.asNode<IAstRegexLiteral>(root, AstNodeType.RegexLiteral);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.Boolean: {
        let astNode = astFactory.asNode<IAstBoolean>(root, AstNodeType.Boolean);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.Array: {
        let astNode = astFactory.asNode<IAstArray>(root, AstNodeType.Array);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.Identifier: {
        let astNode = astFactory.asNode<IAstIdentifier>(root, AstNodeType.Identifier);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.IdentifierScope: {
        let astNode = astFactory.asNode<IAstIdentifierScope>(root, AstNodeType.IdentifierScope);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.RawIdentifier: {
        let astNode = astFactory.asNode<IAstRawIdentifier>(root, AstNodeType.RawIdentifier);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.ContextIdentifier: {
        let astNode = astFactory.asNode<IAstContextIdentifier>(root, AstNodeType.ContextIdentifier);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.VariableDeclaration: {
        let astNode = astFactory.asNode<IAstVariableDeclaration>(root, AstNodeType.VariableDeclaration);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.PropertyDeclaration: {
        let astNode = astFactory.asNode<IAstPropertyDeclaration>(root, AstNodeType.PropertyDeclaration);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.BreakStatement: {
        let astNode = astFactory.asNode<IAstBreakStatement>(root, AstNodeType.BreakStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.ContinueStatement: {
        let astNode = astFactory.asNode<IAstContinueStatement>(root, AstNodeType.ContinueStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.BlockStatement: {
        let astNode = astFactory.asNode<IAstBlockStatement>(root, AstNodeType.BlockStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.IfStatement: {
        let astNode = astFactory.asNode<IAstIfStatement>(root, AstNodeType.IfStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.SwitchStatement: {
        let astNode = astFactory.asNode<IAstSwitchStatement>(root, AstNodeType.SwitchStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.CaseStatement: {
        let astNode = astFactory.asNode<IAstCaseStatement>(root, AstNodeType.CaseStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.WhileStatement: {
        let astNode = astFactory.asNode<IAstWhileStatement>(root, AstNodeType.WhileStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.DoWhileStatement: {
        let astNode = astFactory.asNode<IAstDoWhileStatement>(root, AstNodeType.DoWhileStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.ForStatement: {
        let astNode = astFactory.asNode<IAstForStatement>(root, AstNodeType.ForStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.ForInStatement: {
        let astNode = astFactory.asNode<IAstForInStatement>(root, AstNodeType.ForInStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.ImportStatement: {
        let astNode = astFactory.asNode<IAstImportStatement>(root, AstNodeType.ImportStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.TryStatement: {
        let astNode = astFactory.asNode<IAstTryStatement>(root, AstNodeType.TryStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.CatchStatement: {
        let astNode = astFactory.asNode<IAstCatchStatement>(root, AstNodeType.CatchStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.FinallyStatement: {
        let astNode = astFactory.asNode<IAstFinallyStatement>(root, AstNodeType.FinallyStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.ThrowStatement: {
        let astNode = astFactory.asNode<IAstThrowStatement>(root, AstNodeType.ThrowStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.ParenExpression: {
        let astNode = astFactory.asNode<IAstParenExpression>(root, AstNodeType.ParenExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.Object: {
        let astNode = astFactory.asNode<IAstObject>(root, AstNodeType.Object);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.CallExpression: {
        let astNode = astFactory.asNode<IAstCallExpression>(root, AstNodeType.CallExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.UpdateExpression: {
        let astNode = astFactory.asNode<IAstUpdateExpression>(root, AstNodeType.UpdateExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.BinaryExpression: {
        let astNode = astFactory.asNode<IAstBinaryExpression>(root, AstNodeType.BinaryExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.MemberExpression: {
        let astNode = astFactory.asNode<IAstMemberExpression>(root, AstNodeType.MemberExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.IndexerExpression: {
        let astNode = astFactory.asNode<IAstIndexerExpression>(root, AstNodeType.IndexerExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.ConditionalExpression: {
        let astNode = astFactory.asNode<IAstConditionalExpression>(root, AstNodeType.ConditionalExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.OuterStatement: {
        let astNode = astFactory.asNode<IAstOuterStatement>(root, AstNodeType.OuterStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.TextLineStatement: {
        let astNode = astFactory.asNode<IAstTextLineStatement>(root, AstNodeType.TextLineStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.ObjectLineStatement: {
        let astNode = astFactory.asNode<IAstObjectLineStatement>(root, AstNodeType.ObjectLineStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.StringIncludeStatement: {
        let astNode = astFactory.asNode<IAstStringIncludeStatement>(root, AstNodeType.StringIncludeStatement);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.PrototypeExpression: {
        let astNode = astFactory.asNode<IAstPrototypeExpression>(root, AstNodeType.PrototypeExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.DeleteLineExpression: {
        let astNode = astFactory.asNode<IAstDeleteLineExpression>(root, AstNodeType.DeleteLineExpression);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      case AstNodeType.Scope: {
        let astNode = astFactory.asNode<IAstScope>(root, AstNodeType.Scope);
        if (!astNode) { return; }
      
        let getChildren = childrenRegistry[rootNodeType];
        if (!getChildren) { return; }
      
        let children = getChildren(astNode);
        if (!children) { return; }
      
        children.forEach(child => { 
          if (child) {
            let operation = operations[child.nodeType] || defaultOp;
            if (!operation) { return; }
            
            operation(child);
          }
        });
        break;
      }
      
      default: break;
    }

  },

}