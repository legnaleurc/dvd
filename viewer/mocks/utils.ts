import { HttpResponse } from "msw";

import type { NodeResponse } from "$types/api";
import type { Node_ } from "$types/filesystem";

export function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw TypeError("not a string");
  }
}

type OptionalNodeFields = Partial<{
  name: string;
  modified: number;
}>;

function toNode(
  id: string,
  parentId: string,
  isFolder: boolean,
  optional?: OptionalNodeFields,
): Node_ {
  return {
    id,
    parentId,
    name: optional?.name ?? id,
    isFolder,
    mimeType: isFolder ? null : "text/plain",
    category: isFolder ? "folder" : "text",
    modified: optional?.modified ?? 0,
  };
}

export function folderNode(
  id: string,
  parentId: string,
  optional?: OptionalNodeFields,
): Node_ {
  return toNode(id, parentId, true, optional);
}

export function fileNode(
  id: string,
  parentId: string,
  optional?: OptionalNodeFields,
): Node_ {
  return toNode(id, parentId, false, optional);
}

export function rootNode(): Node_ {
  return {
    id: "__ROOT__",
    parentId: null,
    name: null,
    isFolder: true,
    mimeType: null,
    category: "folder",
    modified: 0,
  };
}

type OptionalResponseFields = Partial<{
  name: string;
  trashed: boolean;
}>;

function toResponse(
  id: string,
  parentId: string,
  isFolder: boolean,
  optional?: OptionalResponseFields,
): NodeResponse {
  return {
    id,
    parent_id: parentId,
    is_directory: isFolder,
    name: optional?.name ?? id,
    mime_type: isFolder ? null : "text/plain",
    mtime: "",
    is_trashed: optional?.trashed ?? false,
  };
}

export function folderResponse(
  id: string,
  parentId: string,
  optional?: OptionalResponseFields,
): NodeResponse {
  return toResponse(id, parentId, true, optional);
}

export function fileResponse(
  id: string,
  parentId: string,
  optional?: OptionalResponseFields,
): NodeResponse {
  return toResponse(id, parentId, false, optional);
}

export function rootResponse(): NodeResponse {
  return {
    id: "__ROOT__",
    parent_id: null,
    name: null,
    is_directory: true,
    mime_type: null,
    mtime: "",
    is_trashed: false,
  };
}

export function status204(): HttpResponse {
  return new HttpResponse(null, {
    status: 204,
    statusText: "No Content",
  });
}

export function status404(): HttpResponse {
  return new HttpResponse(null, {
    status: 404,
    statusText: "Not Found",
  });
}
