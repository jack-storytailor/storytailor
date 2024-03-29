"use strict";
// original source: https://github.com/Rich-Harris/vlq
Object.defineProperty(exports, "__esModule", { value: true });
exports.vlq = void 0;
let charToInteger = {};
let integerToChar = {};
'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('').forEach(function (char, i) {
    charToInteger[char] = i;
    integerToChar[i] = char;
});
const decode = (string) => {
    let result = [];
    let shift = 0;
    let value = 0;
    for (let i = 0; i < string.length; i += 1) {
        let integer = charToInteger[string[i]];
        if (integer === undefined) {
            throw new Error('Invalid character (' + string[i] + ')');
        }
        const hasContinuationBit = integer & 32;
        integer &= 31;
        value += integer << shift;
        if (hasContinuationBit) {
            shift += 5;
        }
        else {
            const shouldNegate = value & 1;
            value >>= 1;
            result.push(shouldNegate ? -value : value);
            // reset
            value = shift = 0;
        }
    }
    return result;
};
const encode = (value) => {
    let result;
    if (typeof value === 'number') {
        result = encodeInteger(value);
    }
    else {
        result = '';
        for (let i = 0; i < value.length; i += 1) {
            result += encodeInteger(value[i]);
        }
    }
    return result;
};
function encodeInteger(num) {
    let result = '';
    if (num < 0) {
        num = (-num << 1) | 1;
    }
    else {
        num <<= 1;
    }
    do {
        let clamped = num & 31;
        num >>= 5;
        if (num > 0) {
            clamped |= 32;
        }
        result += integerToChar[clamped];
    } while (num > 0);
    return result;
}
exports.vlq = {
    decode,
    encode
};
