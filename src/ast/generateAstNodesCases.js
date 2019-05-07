let obj = {
  // general
  Token: "Token",
  TokenSequence: "TokenSequence",
  Text: "Text",
  Operator: "Operator",
  Module: "Module",
  Program: "Program",
  Keyword: "Keyword",
  DebuggerKeyword: "DebuggerKeyword",
  CommentLine: "CommentLine",
  CommentBlock: "CommentBlock",
  // literals
  Number: "Number",
  String: "String",
  Boolean: "Boolean",
  Array: "Array",
  // identifiers
  Identifier: "Identifier",
  IdentifierScope: "IdentifierScope",
  RawIdentifier: "RawIdentifier",
  ContextIdentifier: "ContextIdentifier",
  // declarations
  FunctionDeclaration: "FunctionDeclaration",
  VariableDeclaration: "VariableDeclaration",
  PropertyDeclaration: "PropertyDeclaration",
  // statements
  Statement: "Statement",
  BreakStatement: "BreakStatement",
  ReturnStatement: "ReturnStatement",
  ContinueStatement: "ContinueStatement",
  BlockStatement: "BlockStatement",
  IfStatement: "IfStatement",
  SwitchStatement: "SwitchStatement",
  CaseStatement: "CaseStatement",
  WhileStatement: "WhileStatement",
  DoWhileStatement: "DoWhileStatement",
  ForStatement: "ForStatement",
  ForInStatement: "ForInStatement",
  ImportStatement: "ImportStatement",
  TryStatement: "TryStatement",
  CatchStatement: "CatchStatement",
  FinallyStatement: "FinallyStatement",
  ThrowStatement: "ThrowStatement",
  // expression statements
  ExpressionStatement: "ExpressionStatement",
  ParenExpression: "ParenExpression",
  ObjectExpression: "ObjectExpression",
  CallExpression: "CallExpression",
  OperationExpression: "OperationExpression",
  UpdateExpression: "UpdateExpression",
  BinaryExpression: "BinaryExpression",
  MemberExpression: "MemberExpression",
  IndexerExpression: "IndexerExpression",
  ConditionalExpression: "ConditionalExpression",
  NewExpression: "NewExpression",
  DeleteExpression: "DeleteExpression",
  // storytailor-specific
  OuterStatement: "OuterStatement",
  TextLineStatement: "TextLineStatement",
  ObjectLineStatement: "ObjectLineStatement",
  StringIncludeStatement: "StringIncludeStatement",
  PrototypeExpression: "PrototypeExpression",
  DeleteLineExpression: "DeleteLineExpression",
  Scope: "Scope",
  Tag: "Tag",
}

let result = [];
let chResult = [];

for (const key in obj) {
  // let caseResult = [];
  // caseResult = [...caseResult, `case AstNodeType.${key}: {`] ;
  // caseResult = [...caseResult, `  let astNode = astFactory.asNode<IAst${key}>(root, AstNodeType.${key});`];
  // caseResult = [...caseResult, `  if (!astNode) { return; }`];
  // caseResult = [...caseResult, ``];
  // caseResult = [...caseResult, `  let getChildren = childrenRegistry[rootNodeType];`];
  // caseResult = [...caseResult, `  if (!getChildren) { return; }`];
  // caseResult = [...caseResult, ``];
  // caseResult = [...caseResult, `  let children = getChildren(astNode);`];
  // caseResult = [...caseResult, `  if (!children) { return; }`];
  // caseResult = [...caseResult, ``];
  // caseResult = [...caseResult, `  children.forEach(child => { `];
  // caseResult = [...caseResult, `    if (child) { operation(child); }`];
  // caseResult = [...caseResult, `  });`];
  // caseResult = [...caseResult, `  break;`];
  // caseResult = [...caseResult, `}`];

  let caseResult = [];
  caseResult = [...caseResult, `case AstNodeType.${key}: {`] ;
  caseResult = [...caseResult, `  let astNode = astFactory.asNode<IAst${key}>(root, AstNodeType.${key});`];
  caseResult = [...caseResult, `  if (!astNode) { return; }`];
  caseResult = [...caseResult, ``];
  caseResult = [...caseResult, `  let getChildren = childrenRegistry[rootNodeType];`];
  caseResult = [...caseResult, `  if (!getChildren) { return; }`];
  caseResult = [...caseResult, ``];
  caseResult = [...caseResult, `  let children = getChildren(astNode);`];
  caseResult = [...caseResult, `  if (!children) { return; }`];
  caseResult = [...caseResult, ``];
  caseResult = [...caseResult, `  children.forEach(child => { `];
  caseResult = [...caseResult, `    if (child) {`];
  caseResult = [...caseResult, `      let operation = operations[child.nodeType];`];
  caseResult = [...caseResult, `      if (!operation) { return; }`];
  caseResult = [...caseResult, `      `];
  caseResult = [...caseResult, `      operation(child);`];
  caseResult = [...caseResult, `    }`];
  caseResult = [...caseResult, `  });`];
  caseResult = [...caseResult, `  break;`];
  caseResult = [...caseResult, `}`];

  result = [...result, caseResult.join('\n')];

  let childrenResult = [];
  childrenResult = [...childrenResult, `${key}: (ast: IAst${key}): IAstNode[] => {`];
  childrenResult = [...childrenResult, `  if (!ast) { return undefined; }`];
  childrenResult = [...childrenResult, ``];
  childrenResult = [...childrenResult, `}`];

  chResult = [...chResult, childrenResult.join('\n')];
}

let resultText = result.join('\n\n');
// resultText = chResult.join(',\n\n');

console.log(resultText);
