from datetime import datetime
from typing import TypedDict


class ImageSizeDict(TypedDict):
    width: int
    height: int


class VideoSizeDict(TypedDict):
    name: str
    mime_type: str
    width: int
    height: int
    path: str
    id: str


class ImageListCacheDict(TypedDict):
    id: str
    name: str
    image_list: list[ImageSizeDict]


class NodeDict(TypedDict):
    id: str
    name: str
    parent_id: str | None
    is_trashed: bool
    is_directory: bool
    mtime: str
    mime_type: str
    hash: str
    size: int


class SearchNodeDict(NodeDict):
    parent_path: str


class ImageDict(TypedDict):
    type: str
    width: int
    height: int
    size: int
    id: str
    etag: str
    mtime: datetime
