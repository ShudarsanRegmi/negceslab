# Multi-stage build for production
FROM docker.io/node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY client/package*.json ./
RUN npm install

# Copy environment files first (this will bust cache when env changes)
COPY client/.env* ./

# Copy vite config (this will bust cache when config changes)
COPY client/vite.config.ts ./

# Copy source code
COPY client/ ./
COPY shared ../shared

# Build the application
RUN npm run build

# Output stage - just holds the built files for extraction
FROM docker.io/library/alpine:latest AS output

# Copy built files from builder stage
COPY --from=builder /app/dist /build-output

# Command to copy files to mounted volume
CMD ["sh", "-c", "cp -r /build-output/* /output/ 2>/dev/null || cp -r /build-output/. /output/"]
