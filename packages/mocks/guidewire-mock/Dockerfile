# Simplified Dockerfile for Guidewire mock
FROM node:18-alpine

WORKDIR /app

# Install runtime tools
RUN apk add --no-cache dumb-init

# Copy application files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Install dependencies
RUN npm install && \
    npm cache clean --force

# Build
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nestjs && \
    adduser -S -u 1001 -G nestjs nestjs && \
    chown -R nestjs:nestjs /app

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
