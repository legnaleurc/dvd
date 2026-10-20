FROM node:22-trixie-slim AS builder

RUN : \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json /app/
WORKDIR /app
RUN npm ci

COPY . /app
RUN npm run build

FROM alpine:latest AS production

COPY --from=builder /app/build /app
WORKDIR /app
