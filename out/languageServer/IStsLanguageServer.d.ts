export declare enum ProjectItemType {
    Directory = 0,
    File = 1
}
export interface IStsProject {
    projectItems: Map<string, IStsProjectItem>;
}
export interface IStsProjectItem {
    itemType: ProjectItemType;
    name: string;
    uri: string;
}
