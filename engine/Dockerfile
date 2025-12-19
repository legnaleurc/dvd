FROM python:3.13-slim-trixie AS builder

# build-essential is required for GNU/Make and native modules
RUN : \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
ENV UV_SYSTEM_PYTHON=1
# do not use bundled mediainfo
ENV UV_NO_BINARY_PACKAGE=pymediainfo

# build venv
COPY pyproject.toml uv.lock Makefile /app/
WORKDIR /app
RUN make release

FROM python:3.13-slim-trixie AS production

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
