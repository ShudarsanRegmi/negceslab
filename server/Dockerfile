FROM node:20-bullseye

WORKDIR /app

# Copy package files first for better caching
COPY server/package*.json ./

# Install dependencies
RUN npm install --production=false

# Clean up dev dependencies for production (optional)
RUN if [ "$NODE_ENV" = "production" ]; then npm prune --production; fi

# Copy environment files (if they exist)
COPY server/.env* ./

# Copy config directory (for Firebase service account key)
COPY server/config ./config

# Copy source code
COPY server/ ./
COPY shared ../shared

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

CMD ["node", "index.js"]
