FROM python:3.13-slim-trixie AS base

# env
ENV POETRY_HOME=/opt/poetry

# setup poetry
RUN python3 -m venv $POETRY_HOME
RUN $POETRY_HOME/bin/pip install "poetry>=2.1.0,<3.0.0"
# add poetry to path
ENV PATH=$POETRY_HOME/bin:$PATH

FROM base AS builder

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
# do not use bundled mediainfo
ARG POETRY_INSTALLER_NO_BINARY=pymediainfo
RUN make release

FROM base AS production

# FIXME needed for unpack binary and pymediainfo
RUN : \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        libarchive13t64 \
        libcurl4t64 \
        libboost-locale1.83.0 \
    && apt-get install -y --no-install-recommends \
        libmediainfo0v5 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
RUN ln -s /app/docker/wdcli.sh /usr/local/bin/wdcli
COPY --from=builder /app/.venv /app/.venv
WORKDIR /app
