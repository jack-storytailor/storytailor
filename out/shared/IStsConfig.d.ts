export interface IStsConfig {
    sourceRoot: string;
    javascriptOutputRoot: string;
    isEmitJavascript: boolean;
    environmentPath?: string;
    exclude?: string[];
    include?: string[];
    excludeParsed?: RegExp[];
    includeParsed?: RegExp[];
}
