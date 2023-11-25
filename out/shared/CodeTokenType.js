"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeTokenType = void 0;
var CodeTokenType;
(function (CodeTokenType) {
    // \r?\n
    CodeTokenType["Endline"] = "Endline";
    // $
    CodeTokenType["Endfile"] = "Endfile";
    // \s
    CodeTokenType["Space"] = "Space";
    /**: */
    CodeTokenType["Colon"] = "Colon";
    /**; */
    CodeTokenType["Semicolon"] = "Semicolon";
    /**; */
    CodeTokenType["Dot"] = "Dot";
    /**, */
    CodeTokenType["Comma"] = "Comma";
    /**! */
    CodeTokenType["NotSign"] = "NotSign";
    /**' */
    CodeTokenType["Prime"] = "Prime";
    // `
    CodeTokenType["Tilde"] = "Tilde";
    /**| */
    CodeTokenType["OrSign"] = "OrSign";
    // ?
    CodeTokenType["Question"] = "Question";
    // №
    CodeTokenType["NumSign"] = "NumSign";
    /**" */
    CodeTokenType["Quote"] = "Quote";
    /**\* */
    CodeTokenType["Star"] = "Star";
    // -
    CodeTokenType["Minus"] = "Minus";
    // +
    CodeTokenType["Plus"] = "Plus";
    // =
    CodeTokenType["Equals"] = "Equals";
    // ^
    CodeTokenType["Caret"] = "Caret";
    // %
    CodeTokenType["Percent"] = "Percent";
    // $
    CodeTokenType["Dollar"] = "Dollar";
    // #
    CodeTokenType["Hash"] = "Hash";
    /**@ */
    CodeTokenType["AtSign"] = "AtSign";
    /**& */
    CodeTokenType["Ampersand"] = "Ampersand";
    // (
    CodeTokenType["ParenOpen"] = "ParenOpen";
    // )
    CodeTokenType["ParenClose"] = "ParenClose";
    /**
     * [
     */
    CodeTokenType["BracketOpen"] = "BracketOpen";
    /**
     * ]
     */
    CodeTokenType["BracketClose"] = "BracketClose";
    /**
     * {
     */
    CodeTokenType["BraceOpen"] = "BraceOpen";
    /**
     * }
     */
    CodeTokenType["BraceClose"] = "BraceClose";
    /**
     * <
     */
    CodeTokenType["TupleOpen"] = "TupleOpen";
    /**
     * \>
     */
    CodeTokenType["TupleClose"] = "TupleClose";
    /**
     * /
     */
    CodeTokenType["Slash"] = "Slash";
    /**
     * \
     */
    CodeTokenType["Backslash"] = "Backslash";
    // everything else is Word
    CodeTokenType["Word"] = "Word";
    // //
    CodeTokenType["CommentLine"] = "CommentLine";
    // /*
    CodeTokenType["CommentBlockOpen"] = "CommentBlockOpen";
    // */
    CodeTokenType["CommentBlockClose"] = "CommentBlockClose";
})(CodeTokenType = exports.CodeTokenType || (exports.CodeTokenType = {}));
