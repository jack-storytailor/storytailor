import { ISymbolPosition } from "./ISymbolPosition";
import { IHash } from "./IHash";

export interface IAppContext {
  modules: IHash<IAppContextItem>;
}

export enum AppContextItemType {
  module = 'module',
  object = 'object',
  value = 'value',
  array = 'array',
  import = 'import',
}

export enum AppContextValueType {
  any = 'any',
  string = 'string',
  number = 'number',
  boolean = 'boolean',
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

export const appContextFactory = {
  createAppContext: (modules: IHash<IAppContextItem>): IAppContext => {
    return {
      modules: modules
    }
  },

  createModule: (name: string, items: IHash<IAppContextItem>, start?: ISymbolPosition, end?: ISymbolPosition): IAppContextModule => {
    return {
      type: AppContextItemType.module,
      name: name,
      items: items,
      start: start,
      end: end,
    }
  },

  createObject: (fields: IHash<IAppContextItem>, start?: ISymbolPosition, end?: ISymbolPosition): IAppContextObject => {
    return {
      type: AppContextItemType.object,
      fields: fields,
      start: start,
      end: end,
    }
  },

  createValue: (value: any, valueType: AppContextValueType, start?: ISymbolPosition, end?: ISymbolPosition): IAppContextValue => {
    return {
      type: AppContextItemType.value,
      value: value,
      valueType: valueType,
      start: start,
      end: end,
    }
  },

  createArray: (items: IAppContextItem[], start?: ISymbolPosition, end?: ISymbolPosition): IAppContextArray => {
    return {
      type: AppContextItemType.array,
      items: items,
      start: start,
      end: end,
    }
  },

  createImport: (importPath: string, start?: ISymbolPosition, end?: ISymbolPosition): IAppContextImport => {
    return {
      type: AppContextItemType.import,
      importPath: importPath,
      start: start,
      end: end,
    }
  },

}
