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
