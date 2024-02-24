#! /bin/sh

poetry run -- python3 -m wcpan.drive.cli --config="$DVD_ENGINE_DRIVE" "$@"
