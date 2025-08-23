from argparse import ArgumentParser
from dataclasses import dataclass


@dataclass(frozen=True, kw_only=True)
class Arguments:
    port: int
    unpack: str
    drive: str
    static: str
    token: str
    ipv6: bool
    expose: bool
    log_path: str


def parse_args(args: list[str]) -> Arguments:
    parser = ArgumentParser("engine")

    parser.add_argument("-p", "--port", required=True, type=int)
    parser.add_argument("-u", "--unpack", required=True, type=str)
    parser.add_argument("-d", "--drive", required=True, type=str)
    parser.add_argument("-s", "--static", type=str, default="")
    parser.add_argument("-t", "--token", type=str, default="")
    parser.add_argument("-6", "--ipv6", action="store_true")
    parser.add_argument("--expose", action="store_true")
    parser.add_argument("--log-path", type=str, default="")

    kwargs = parser.parse_args(args)
    return Arguments(**vars(kwargs))
