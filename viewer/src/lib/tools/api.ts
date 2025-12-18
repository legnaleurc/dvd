import { delete_, get, getBaseUrl, patch, post } from "./ajax";
import type {
  CachedImageResponse,
  ChangeResponse,
  ImageResponse,
  NodeResponse,
  NodeSearchParam,
  SearchResponse,
  VideoResponse,
} from "$types/api";

export async function readRootNode(): Promise<NodeResponse> {
  const res = await get("/api/v1/nodes/root");
  const rv: NodeResponse = await res.json();
  return rv;
}

export async function readNode(id: string): Promise<NodeResponse> {
  const res = await get(`/api/v1/nodes/${id}`);
  const rv: NodeResponse = await res.json();
  return rv;
}

export async function listNodeChildren(id: string): Promise<NodeResponse[]> {
  const res = await get(`/api/v1/nodes/${id}/children`);
  const rv: NodeResponse[] = await res.json();
  return rv;
}

export async function createChangeList(): Promise<ChangeResponse[]> {
  const res = await post("/api/v1/changes");
  const rv: ChangeResponse[] = await res.json();
  return rv;
}

export async function listImage(
  id: string,
  maxSize?: number,
): Promise<ImageResponse[]> {
  let url = `/api/v1/nodes/${id}/images`;
  if (maxSize !== undefined && maxSize > 0) {
    url += `?max_size=${maxSize}`;
  }
  const res = await get(url);
  const rv: ImageResponse[] = await res.json();
  return rv;
}

export async function listCachedImage(
  maxSize?: number,
): Promise<CachedImageResponse[]> {
  let url = "/api/v1/caches/images";
  if (maxSize !== undefined && maxSize > 0) {
    url += `?max_size=${maxSize}`;
  }
  const res = await get(url);
  const rv: CachedImageResponse[] = await res.json();
  return rv;
}

export async function clearCachedImage(): Promise<void> {
  await delete_("/api/v1/caches/images");
}

export function getImageUrl(
  id: string,
  index: number,
  maxSize?: number,
): string {
  let url = `${getBaseUrl()}/api/v1/nodes/${id}/images/${index}`;
  if (maxSize !== undefined && maxSize > 0) {
    url += `?max_size=${maxSize}`;
  }
  return url;
}

export async function listVideo(id: string): Promise<VideoResponse[]> {
  const res = await get(`/api/v1/nodes/${id}/videos`);
  const rv: VideoResponse[] = await res.json();
  return rv;
}

export async function createFolder(name: string, parentId: string) {
  await post(`/api/v1/nodes`, {
    name,
    parent_id: parentId,
  });
}

export async function trashNode(id: string): Promise<void> {
  await delete_(`/api/v1/nodes/${id}`);
}

export async function moveNodeToId(src: string, dst: string) {
  await patch(`/api/v1/nodes/${src}`, {
    parent_id: dst,
  });
}

export async function moveNodeToPath(src: string, dst: string) {
  await patch(`/api/v1/nodes/${src}`, {
    parent_path: dst,
  });
}

export async function renameNode(id: string, name: string) {
  await patch(`/api/v1/nodes/${id}`, {
    name,
  });
}

export async function listNode(param: NodeSearchParam) {
  const r = await get("/api/v1/nodes", param);
  const rv: SearchResponse[] = await r.json();
  return rv;
}

export async function applyCommand(command: string, kwargs: unknown) {
  await post("/api/v1/apply", {
    command,
    kwargs,
  });
}

export async function getSearchHistory(): Promise<NodeSearchParam[]> {
  const r = await get("/api/v1/history");
  const rv: NodeSearchParam[] = await r.json();
  return rv;
}

export function getStreamUrl(id: string, name: string): string {
  return `${getBaseUrl()}/api/v1/nodes/${id}/stream/${encodeURI(name)}`;
}

export function getDownloadUrl(id: string): string {
  return `${getBaseUrl()}/api/v1/nodes/${id}/download`;
}
