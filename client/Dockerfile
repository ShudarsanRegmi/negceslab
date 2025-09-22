# Multi-stage build for production
FROM docker.io/node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY client/package*.json ./
RUN npm install

# Copy source code
COPY client/ ./
COPY shared ../shared

# Build the application
RUN npm run build

# Development stage (for local development)
FROM docker.io/node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY client/package*.json ./
RUN npm install

# Copy source code
COPY client/ ./
COPY shared ../shared

EXPOSE 5173

CMD ["npm", "run", "preview"]

# Output stage - just holds the built files for extraction
FROM docker.io/library/alpine:latest AS output

# Copy built files from builder stage
COPY --from=builder /app/dist /build-output

# Command to copy files to mounted volume
CMD ["sh", "-c", "cp -r /build-output/* /output/ 2>/dev/null || cp -r /build-output/. /output/"]
