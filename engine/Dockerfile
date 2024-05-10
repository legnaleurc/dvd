FROM python:3.12-slim-bookworm as base

# env
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VERSION=1.8.2

# setup poetry
RUN python3 -m venv $POETRY_HOME
RUN $POETRY_HOME/bin/pip install poetry==$POETRY_VERSION
# add poetry to path
ENV PATH=$POETRY_HOME/bin:$PATH

FROM base as builder

# build-essential is required for GNU/Make and native modules
RUN : \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# prepare environment
COPY pyproject.toml poetry.lock poetry.toml Makefile /app/
WORKDIR /app
RUN make release

FROM base as production

# FIXME needed for unpack binary
RUN : \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        libarchive13 \
        libcpprest2.10 \
        libboost-locale1.74.0 \
        libboost-filesystem1.74.0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
RUN ln -s /app/docker/wdcli.sh /usr/local/bin/wdcli
COPY --from=builder /app/.venv /app/.venv
WORKDIR /app
