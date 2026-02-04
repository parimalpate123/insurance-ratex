# Simplified Dockerfile - copy ai-services source directly
FROM node:18-alpine

WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++ dumb-init

# Copy ai-services source first
RUN mkdir -p src/ai-services
COPY packages/ai-services/src/* ./src/ai-services/

# Copy orchestrator files (excluding ai-services symlink via .dockerignore)
COPY apps/orchestrator/package*.json ./
COPY apps/orchestrator/tsconfig*.json ./
COPY apps/orchestrator/nest-cli.json ./
# Copy src files but skip ai-services directory
COPY apps/orchestrator/src/controllers ./src/controllers
COPY apps/orchestrator/src/services ./src/services
COPY apps/orchestrator/src/entities ./src/entities
COPY apps/orchestrator/src/modules ./src/modules
COPY apps/orchestrator/src/dto ./src/dto
COPY apps/orchestrator/src/utils ./src/utils
COPY apps/orchestrator/src/config ./src/config
COPY apps/orchestrator/src/*.ts ./src/

# Install dependencies (includes AWS SDK from package.json)
RUN npm install && \
    npm cache clean --force

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nestjs && \
    adduser -S -u 1001 -G nestjs nestjs && \
    chown -R nestjs:nestjs /app

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
