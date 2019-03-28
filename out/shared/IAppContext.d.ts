import { ISymbolPosition } from "./ISymbolPosition";
import { IHash } from "./IHash";
export interface IAppContext {
    modules: IHash<IAppContextItem>;
}
export declare enum AppContextItemType {
    module = "module",
    object = "object",
    value = "value",
    array = "array",
    import = "import"
}
export declare enum AppContextValueType {
    any = "any",
    string = "string",
    number = "number",
    boolean = "boolean"
}
export interface IAppContextItem {
    type: AppContextItemType;
    start?: ISymbolPosition;
    end?: ISymbolPosition;
}
export interface IAppContextModule extends IAppContextItem {
    name: string;
    items: IHash<IAppContextItem>;
}
export interface IAppContextObject extends IAppContextItem {
    fields: IHash<IAppContextItem>;
}
export interface IAppContextValue extends IAppContextItem {
    valueType: AppContextValueType;
    value: any;
}
export interface IAppContextArray extends IAppContextItem {
    items: IAppContextItem[];
}
export interface IAppContextImport extends IAppContextItem {
    importPath: string;
}
export declare const appContextFactory: {
    createAppContext: (modules: IHash<IAppContextItem>) => IAppContext;
    createModule: (name: string, items: IHash<IAppContextItem>, start?: ISymbolPosition, end?: ISymbolPosition) => IAppContextModule;
    createObject: (fields: IHash<IAppContextItem>, start?: ISymbolPosition, end?: ISymbolPosition) => IAppContextObject;
    createValue: (value: any, valueType: AppContextValueType, start?: ISymbolPosition, end?: ISymbolPosition) => IAppContextValue;
    createArray: (items: IAppContextItem[], start?: ISymbolPosition, end?: ISymbolPosition) => IAppContextArray;
    createImport: (importPath: string, start?: ISymbolPosition, end?: ISymbolPosition) => IAppContextImport;
};
