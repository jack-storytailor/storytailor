export declare const mkDirByPathSync: (targetDir: string, { isRelativeToScript }?: {
    isRelativeToScript?: boolean;
}) => string;
export declare const copyDirectory: (fromPath: any, toPath: any, excludePattern?: RegExp[], includePattern?: RegExp[]) => void;
export declare const getFileNames: (dirPath: string, isRecoursive: boolean) => string[];
export declare const getFileNamesAndFilter: (rootPath: string, isRecoursive: boolean, include?: RegExp[], exclude?: RegExp[]) => string[];
export declare const filterFileNames: (fileNames: string[], rootDirPath: string, include?: RegExp[], exclude?: RegExp[]) => string[];
export declare const getRelativeFileName: (filePath: string, relativeTo: string) => string;
