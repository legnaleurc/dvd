#! /bin/sh

CMD="poetry run -- python3 -m engine"
CMD="$CMD -p $DVD_ENGINE_PORT"
CMD="$CMD -d $DVD_ENGINE_DRIVE"
CMD="$CMD -u $DVD_ENGINE_UNPACK"
CMD="$CMD --expose"

if [ -n "$DVD_ENGINE_TOKEN" ] ; then
    CMD="$CMD -t $DVD_ENGINE_TOKEN"
fi

exec $CMD
