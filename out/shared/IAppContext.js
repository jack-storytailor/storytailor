"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appContextFactory = exports.AppContextValueType = exports.AppContextItemType = void 0;
var AppContextItemType;
(function (AppContextItemType) {
    AppContextItemType["module"] = "module";
    AppContextItemType["object"] = "object";
    AppContextItemType["value"] = "value";
    AppContextItemType["array"] = "array";
    AppContextItemType["import"] = "import";
})(AppContextItemType = exports.AppContextItemType || (exports.AppContextItemType = {}));
var AppContextValueType;
(function (AppContextValueType) {
    AppContextValueType["any"] = "any";
    AppContextValueType["string"] = "string";
    AppContextValueType["number"] = "number";
    AppContextValueType["boolean"] = "boolean";
})(AppContextValueType = exports.AppContextValueType || (exports.AppContextValueType = {}));
exports.appContextFactory = {
    createAppContext: (modules) => {
        return {
            modules: modules
        };
    },
    createModule: (name, items, start, end) => {
        return {
            type: AppContextItemType.module,
            name: name,
            items: items,
            start: start,
            end: end,
        };
    },
    createObject: (fields, start, end) => {
        return {
            type: AppContextItemType.object,
            fields: fields,
            start: start,
            end: end,
        };
    },
    createValue: (value, valueType, start, end) => {
        return {
            type: AppContextItemType.value,
            value: value,
            valueType: valueType,
            start: start,
            end: end,
        };
    },
    createArray: (items, start, end) => {
        return {
            type: AppContextItemType.array,
            items: items,
            start: start,
            end: end,
        };
    },
    createImport: (importPath, start, end) => {
        return {
            type: AppContextItemType.import,
            importPath: importPath,
            start: start,
            end: end,
        };
    },
};
