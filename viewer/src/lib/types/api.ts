export interface NodeResponse {
  id: string;
  name: string;
  parent_id: string | null;
  mtime: string;
  mime_type: string;
  is_directory: boolean;
  is_trashed: boolean;
}

export interface SearchResponse extends NodeResponse {
  hash: string;
  size: number;
  parent_path: string;
}

export interface RemovedChangeResponse {
  removed: true;
  id: string;
}

export interface UpsertChangeResponse {
  removed: false;
  node: NodeResponse;
}

export type ChangeResponse = RemovedChangeResponse | UpsertChangeResponse;

export interface ImageResponse {
  width: number;
  height: number;
}

export interface CachedImageResponse {
  id: string;
  name: string;
  image_list: ImageResponse[];
}

export interface VideoResponse {
  id: string;
  name: string;
  mime_type: string;
  width: number;
  height: number;
  path: string;
}
