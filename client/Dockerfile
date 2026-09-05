# Multi-stage build for production
FROM docker.io/node:20-alpine AS builder

# Build Arguments for Automated Deployment Tracking
ARG VITE_GIT_COMMIT_HASH="dev"
ARG VITE_GIT_COMMIT_DATE="unknown"
ARG VITE_GIT_BRANCH="main"

# Set VITE_ environment variables so Vite bakes them into frontend JS bundle
ENV VITE_GIT_COMMIT_HASH=${VITE_GIT_COMMIT_HASH}
ENV VITE_GIT_COMMIT_DATE=${VITE_GIT_COMMIT_DATE}
ENV VITE_GIT_BRANCH=${VITE_GIT_BRANCH}

WORKDIR /app

# Copy package files first for better caching
COPY client/package*.json ./
RUN npm install

# Copy environment file
COPY client/.env ./

# Copy vite config
COPY client/vite.config.ts ./

# Copy source code
COPY client/ ./
COPY shared ../shared

# Build the application (Vite injects VITE_GIT_* env vars into bundle)
RUN npm run build

# Output stage - just holds the built files for extraction
FROM docker.io/library/alpine:latest AS output

# Copy built files from builder stage
COPY --from=builder /app/dist /build-output

# Command to copy files to mounted volume
CMD ["sh", "-c", "cp -r /build-output/* /output/ 2>/dev/null || cp -r /build-output/. /output/"]
