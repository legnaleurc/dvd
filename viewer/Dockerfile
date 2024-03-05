FROM node:18.19.1-bookworm-slim AS builder

RUN : \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
WORKDIR /app
RUN make release

FROM debian:bookworm-slim AS production

COPY --from=builder /app/build /app
WORKDIR /app
