FROM debian:bookworm-slim AS builder

RUN : \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        libarchive-dev \
        libcurl4-openssl-dev \
        libboost-locale-dev \
        libssl-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
WORKDIR /app
RUN make release && strip /app/release/unpack

FROM debian:bookworm-slim AS production

COPY --from=builder /app/release/unpack /app/unpack
WORKDIR /app
