export interface IStsConfig {
    sourceRoot: string;
    typescriptOutputRoot: string;
    javascriptOutputRoot: string;
    isEmitTypescript: boolean;
    isEmitJavascript: boolean;
    environmentPath?: string;
    /**
     * replace extension of compiled storytailor files (basically it's typescript)
     */
    typescriptExtension?: string;
    exclude?: string[];
    include?: string[];
    excludeParsed?: RegExp[];
    includeParsed?: RegExp[];
}
