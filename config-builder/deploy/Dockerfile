# Build from the repository root:
#   docker build -f config-builder/deploy/Dockerfile -t yggdrasil-service .
# The root .dockerignore keeps server/.env and server/data/ out of the image;
# pass configuration at runtime with --env-file and a data volume instead.
FROM node:22-alpine

WORKDIR /app
COPY config-builder/package.json config-builder/package-lock.json ./config-builder/
RUN cd config-builder && npm ci --omit=dev
COPY config-builder ./config-builder

WORKDIR /app/config-builder
ENV HOST=0.0.0.0 \
    PORT=8788 \
    DATA_DIR=/app/config-builder/server/data \
    TEMPLATE_URL=bundled
VOLUME ["/app/config-builder/server/data"]
EXPOSE 8788
CMD ["node", "server/index.js"]
