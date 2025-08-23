FROM node:20-trixie-slim AS builder

RUN : \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
WORKDIR /app
RUN make release

FROM alpine:latest AS production

COPY --from=builder /app/build /app
WORKDIR /app
