export interface IStsConfig {
    /**
     * in a config file this path should be relative to the config file's path.
     *
     * But if you create config instance yourself, keep in mind that
     * here should be full path to the root dir of your sts files
     */
    sourceRoot: string;
    /**
     * in a config file this path should be relative to the config file's path.
     *
     * But if you create config instance yourself, keep in mind that
     * here should be full path to the root dir of your output javascripts files
     */
    javascriptOutputRoot: string;
    /**
     * If specified and true, compiler will create and write output javascript files
     */
    isEmitJavascript?: boolean;
    environmentPath?: string;
    exclude?: string[];
    include?: string[];
    excludeParsed?: RegExp[];
    includeParsed?: RegExp[];
}
