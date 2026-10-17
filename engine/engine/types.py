from datetime import datetime
from typing import Literal, TypedDict


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
    changed_time: str
    mime_type: str
    hash: str
    size: int


class RemovedChangeDict(TypedDict):
    removed: Literal[True]
    id: str


class UpsertChangeDict(TypedDict):
    removed: Literal[False]
    node: NodeDict


type ChangeDict = RemovedChangeDict | UpsertChangeDict


class SearchNodeDict(NodeDict):
    parent_path: str


class ImageDict(TypedDict):
    type: str
    width: int
    height: int
    size: int
    id: str
    etag: str
    modified_time: datetime
