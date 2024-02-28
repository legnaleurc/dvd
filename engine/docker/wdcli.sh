#! /bin/sh

if [ -z "$DVD_ENGINE_UID" ] || [ -z "$DVD_ENGINE_GID" ] ; then
    exit 1
fi

exec setpriv \
    --reuid="$DVD_ENGINE_UID" \
    --regid="$DVD_ENGINE_GID" \
    --groups="$DVD_ENGINE_GID" \
    poetry run -- \
    python3 -m wcpan.drive.cli --config="$DVD_ENGINE_DRIVE" "$@"
