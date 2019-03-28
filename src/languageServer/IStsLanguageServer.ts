export enum ProjectItemType {
  Directory,
  File
}

export interface IStsProject {
  projectItems: Map<string, IStsProjectItem>;
}

export interface IStsProjectItem {
  itemType: ProjectItemType;
  name: string;
  uri: string;
}


