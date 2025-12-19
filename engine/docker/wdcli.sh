#! /bin/sh

exec /app/.venv/bin/python3 -m wcpan.drive.cli --config="$DVD_ENGINE_DRIVE" "$@"
