#! /bin/sh

if [ -z "$DVD_ENGINE_UID" ] || [ -z "$DVD_ENGINE_GID" ] ; then
    exit 1
fi

CMD="poetry run -- python3 -m engine"
CMD="$CMD -p $DVD_ENGINE_PORT"
CMD="$CMD -d $DVD_ENGINE_DRIVE"
CMD="$CMD -u $DVD_ENGINE_UNPACK"
CMD="$CMD --expose"

if [ -n "$DVD_ENGINE_TOKEN" ] ; then
    CMD="$CMD -t $DVD_ENGINE_TOKEN"
fi

export TMPDIR="$DVD_ENGINE_TMP"

exec setpriv \
    --reuid="$DVD_ENGINE_UID" \
    --regid="$DVD_ENGINE_GID" \
    --groups="$DVD_ENGINE_GID" \
    $CMD
