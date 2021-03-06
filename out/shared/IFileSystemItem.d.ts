import { IHash } from "./IHash";
export declare enum FileSystemItemType {
    folder = "folder",
    file = "file"
}
export interface IFileSystemItem {
    type: FileSystemItemType;
    name: string;
    fullPath: string;
    relativePath: string;
    compilePath: string;
    subitems?: IHash<IFileSystemItem>;
}
