FROM debian:trixie-slim AS builder

RUN : \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        libarchive-dev \
        libboost-locale-dev \
        libboost-url-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
WORKDIR /app
RUN make release && strip /app/release/unpack

FROM alpine:latest AS production

COPY --from=builder /app/release/unpack /app/unpack
WORKDIR /app
