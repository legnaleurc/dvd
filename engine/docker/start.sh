#! /bin/sh

CMD="/app/.venv/bin/python3 -m engine"
CMD="$CMD -H 0.0.0.0"
CMD="$CMD -p $DVD_ENGINE_PORT"
CMD="$CMD -d $DVD_ENGINE_DRIVE"
CMD="$CMD -u $DVD_ENGINE_UNPACK"

if [ -n "$DVD_ENGINE_TOKEN" ] ; then
    CMD="$CMD -t $DVD_ENGINE_TOKEN"
fi

export TMPDIR="$DVD_ENGINE_TMP"

exec $CMD
