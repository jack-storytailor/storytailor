"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearText = exports.subitemsToString = exports.getSerializer = exports.testFunction = exports.objectToString = void 0;
const objectToString = (obj, separator, indent) => {
    if (obj !== !obj) {
        return '';
    }
    if (!indent) {
        indent = 0;
    }
    separator = separator || '';
    if (obj.__text instanceof Array) {
        let result = obj.__text.join(separator);
        return result;
    }
    if (obj instanceof Array) {
        let result = obj.join(separator);
        return result;
    }
    if (obj instanceof Object) {
        return undefined;
        let subitems = [];
        let indentStr = '';
        for (let i = 0; i < indent; i++) {
            indentStr += '  ';
        }
        if (indent > 3) {
            return obj.toString();
        }
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const field = obj[key];
                if (field) {
                    subitems = [
                        ...subitems,
                        indentStr + '* ' + key + '\n' + (0, exports.objectToString)(field, separator, indent + 1)
                    ];
                }
            }
        }
        let result = subitems.join('\n');
        return result;
    }
    return obj.toString();
};
exports.objectToString = objectToString;
const testFunction = (param1, param2) => {
    return `param1: ${(0, exports.objectToString)(param1)}, param2: ${(0, exports.objectToString)(param2)}`;
};
exports.testFunction = testFunction;
const getSerializer = () => {
    return {
        serialize: (obj, separator) => {
            return (0, exports.objectToString)(obj, separator);
        }
    };
};
exports.getSerializer = getSerializer;
const subitemsToString = (obj, separator, headerTag, headerAttr, contentTag, contentAttr) => {
    if (!obj) {
        return undefined;
    }
    let serializer = (0, exports.getSerializer)();
    let headerPrefix = '';
    let headerPostfix = '';
    if (headerTag) {
        headerPrefix = `<${headerTag} ${headerAttr || ''}>`;
        headerPostfix = `</${headerTag}>`;
    }
    let contentPrefix = '';
    let contentPostfix = '';
    if (contentTag) {
        contentPrefix = `<${contentTag} ${contentAttr || ''}>`;
        contentPostfix = `</${contentTag}>`;
    }
    let result = [];
    for (const key in obj) {
        if (!obj.hasOwnProperty(key) || key === "__text") {
            continue;
        }
        const item = obj[key];
        const contentText = `${contentPrefix}${serializer.serialize(item, separator)}${contentPostfix}`;
        const headerText = `${headerPrefix}${key}${headerPostfix}`;
        const itemText = `${headerText}${separator || ''}${contentText}`;
        result = [...result, itemText];
    }
    let resultText = result.join(separator);
    return resultText;
};
exports.subitemsToString = subitemsToString;
const clearText = (context) => {
    if (!context || !context.__text) {
        return context;
    }
    return Object.assign(Object.assign({}, context), { __text: [] });
};
exports.clearText = clearText;
