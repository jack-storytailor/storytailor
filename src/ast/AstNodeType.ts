export enum AstNodeType {
  // general
  Token = "Token",
  TokenSequence = "TokenSequence",
  Text = "Text",
  Operator = "Operator",
  Module = "Module",
  Program = "Program",
  Keyword = "Keyword",
  DebuggerKeyword = "DebuggerKeyword",
  CommentLine = "CommentLine",
  CommentBlock = "CommentBlock",
  // literals
  Number = "Number",
  String = "String",
  RegexLiteral = "RegexLiteral",
  Boolean = "Boolean",
  Array = "Array",
  Object = "Object",
  Function = "Function",
  // identifiers
  Identifier = "Identifier",
  IdentifierScope = "IdentifierScope",
  RawIdentifier = "RawIdentifier",
  ContextIdentifier = "ContextIdentifier",
  // declarations
  VariableDeclaration = "VariableDeclaration",
  PropertyDeclaration = "PropertyDeclaration",
  DeconstructionAssignment = "DeconstructionAssignment",
  // statements
  BreakStatement = "BreakStatement",
  ContinueStatement = "ContinueStatement",
  BlockStatement = "BlockStatement",
  IfStatement = "IfStatement",
  SwitchStatement = "SwitchStatement",
  CaseStatement = "CaseStatement",
  WhileStatement = "WhileStatement",
  DoWhileStatement = "DoWhileStatement",
  ForStatement = "ForStatement",
  ForInStatement = "ForInStatement",
  ForOfStatement = "ForOfStatement",
  ImportStatement = "ImportStatement",
  RawImportStatement = "RawImportStatement",
  ImportItem = "ImportItem",
  TryStatement = "TryStatement",
  CatchStatement = "CatchStatement",
  FinallyStatement = "FinallyStatement",
  ThrowStatement = "ThrowStatement",
  ExportStatement = "ExportStatement",
  ClassDeclaration = "ClassDeclaration",
  // expression statements
  KeywordNode = "KeywordNode",
  ParenExpression = "ParenExpression",
  CallExpression = "CallExpression",
  UpdateExpression = "UpdateExpression",
  BinaryExpression = "BinaryExpression",
  MemberExpression = "MemberExpression",
  IndexerExpression = "IndexerExpression",
  ConditionalExpression = "ConditionalExpression",
  // storytailor-specific
  OuterStatement = "OuterStatement",
  TextLineStatement = "TextLineStatement",
  ObjectLineStatement = "ObjectLineStatement",
  StringIncludeStatement = "StringIncludeStatement",
  PrototypeExpression = "PrototypeExpression",
  DeleteLineExpression = "DeleteLineExpression",
  Scope = "Scope",
}
