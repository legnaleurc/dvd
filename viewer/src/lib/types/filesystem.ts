export interface Node_ {
  id: string;
  name: string;
  isFolder: boolean;
  parentId: string | null;
  changed: number;
  mimeType: string;
  category: string;
}

export type NodeMap = Record<string, Node_>;

export type ChildrenMap = Record<string, string[]>;
