FROM oven/bun:1-alpine AS builder
WORKDIR /build
COPY package.json bun.lock* ./
COPY packages/ packages/
COPY skills/ skills/
COPY channels/ channels/
COPY scripts/ scripts/
COPY src/ src/
COPY tsconfig.json biome.json ./
RUN bun install --frozen-lockfile
RUN bun build src/cli/src/index.ts \
    --outdir /app \
    --target bun \
    --compile \
    --outfile /app/seahorse

FROM alpine:3.20
RUN addgroup -S seahorse && adduser -S seahorse -G seahorse
WORKDIR /app
COPY --from=builder /app/seahorse /app/seahorse
RUN chmod +x /app/seahorse
ENV SEAHORSE_DB_PATH=/data/seahorse.db
VOLUME ["/data"]
EXPOSE 3000
USER seahorse
CMD ["/app/seahorse"]
