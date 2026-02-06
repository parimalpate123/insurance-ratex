# Dockerfile for InsurRateX Rating API
FROM node:18-alpine

WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++ dumb-init curl

# Copy and build shared-types package first
COPY packages/shared-types ./packages/shared-types
WORKDIR /app/packages/shared-types
RUN npm install && npm run build && npm cache clean --force

# Copy rating-api files
WORKDIR /app/rating-api
COPY apps/rating-api/package*.json ./
COPY apps/rating-api/tsconfig*.json ./
COPY apps/rating-api/nest-cli.json ./
COPY apps/rating-api/src ./src

# Install dependencies and link shared-types
RUN cd /app/packages/shared-types && npm link && \
    cd /app/rating-api && npm link @rating-poc/shared-types && \
    npm install --legacy-peer-deps && \
    npm cache clean --force

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nestjs && \
    adduser -S -u 1001 -G nestjs nestjs && \
    chown -R nestjs:nestjs /app

USER nestjs

WORKDIR /app/rating-api

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/api/v1/product-lines', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
