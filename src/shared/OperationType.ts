export enum OperationType {
  // +
  Sum = 'Sum',
  // - 
  Diff = 'Diff',
  // *
  Multiply = 'Multiply',
  // /
  Divide = 'Divide',
  // ...
  Copy = 'Copy',
  // *-
  Delete = 'Delete',

  // ^x
  Power = 'Power',
  // \^
  Root = 'Root',

  // . // means item.subitem
  Get = 'Get',
  // function call
  Call = 'Call',
  // array index // means item[asd]
  Index = 'Index',

  // declare
  Declare = 'Declare',
  // = 
  Set = 'Set',
  // import
  Import = 'Import',

  // *=
  Return = 'Return',

  // ||
  Or = 'Or',
  // && 
  And = 'And',
  // >
  More = 'More',
  // < 
  Less = 'Less',
  // >=
  MoreOrEquals = 'MoreOrEquals',
  // <= 
  LessOrEquals = 'LessOrEquals',

  // : //var: signature
  Signature = 'Signature'
}
