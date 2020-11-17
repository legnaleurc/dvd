export type Dict<T> = Record<string, T>;


export interface INodeLike {
  id: string;
  name: string;
  mimeType: string;
  children: string[] | null;
  parentId: string | null;
}
