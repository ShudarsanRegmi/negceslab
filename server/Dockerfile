# -------------------------
# Build stage
# -------------------------
FROM node:20-bullseye AS builder

WORKDIR /app

# Copy package files first (only from server, since deps are there)
COPY server/package*.json ./server/

# Install dependencies inside /app/server
WORKDIR /app/server
RUN npm install

# Back to /app root
WORKDIR /app

# Copy server and shared folders with correct structure
COPY server ./server
COPY shared ./shared

# -------------------------
# Runtime stage
# -------------------------
FROM node:20-bullseye-slim AS runtime

WORKDIR /app

# Copy built app from builder stage
COPY --from=builder /app ./

WORKDIR /app/server

EXPOSE 5000

CMD ["node", "index.js"]
