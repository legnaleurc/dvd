from argparse import ArgumentParser
from dataclasses import dataclass


@dataclass(frozen=True, kw_only=True)
class Arguments:
    host: str
    port: int
    unpack: str
    drive: str
    static: str | None
    token: str | None
    log_path: str | None


def parse_args(args: list[str]) -> Arguments:
    parser = ArgumentParser("engine")

    parser.add_argument("-H", "--host", type=str, default="127.0.0.1")
    parser.add_argument("-p", "--port", required=True, type=int)
    parser.add_argument("-u", "--unpack", required=True, type=str)
    parser.add_argument("-d", "--drive", required=True, type=str)
    parser.add_argument("-s", "--static", type=str)
    parser.add_argument("-t", "--token", type=str)
    parser.add_argument("--log-path", type=str)

    kwargs = parser.parse_args(args)
    return Arguments(**vars(kwargs))
