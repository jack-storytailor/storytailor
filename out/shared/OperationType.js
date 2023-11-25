"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationType = void 0;
var OperationType;
(function (OperationType) {
    // +
    OperationType["Sum"] = "Sum";
    // - 
    OperationType["Diff"] = "Diff";
    // *
    OperationType["Multiply"] = "Multiply";
    // /
    OperationType["Divide"] = "Divide";
    // ...
    OperationType["Copy"] = "Copy";
    // *-
    OperationType["Delete"] = "Delete";
    // ^x
    OperationType["Power"] = "Power";
    // \^
    OperationType["Root"] = "Root";
    // . // means item.subitem
    OperationType["Get"] = "Get";
    // function call
    OperationType["Call"] = "Call";
    // array index // means item[asd]
    OperationType["Index"] = "Index";
    // declare
    OperationType["Declare"] = "Declare";
    // = 
    OperationType["Set"] = "Set";
    // import
    OperationType["Import"] = "Import";
    // *=
    OperationType["Return"] = "Return";
    // ||
    OperationType["Or"] = "Or";
    // && 
    OperationType["And"] = "And";
    // >
    OperationType["More"] = "More";
    // < 
    OperationType["Less"] = "Less";
    // >=
    OperationType["MoreOrEquals"] = "MoreOrEquals";
    // <= 
    OperationType["LessOrEquals"] = "LessOrEquals";
    // : //var: signature
    OperationType["Signature"] = "Signature";
})(OperationType = exports.OperationType || (exports.OperationType = {}));
