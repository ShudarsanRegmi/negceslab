FROM node:20-bullseye

WORKDIR /app

# Copy all source code first
COPY server/ ./
COPY shared ../shared

# Install all dependencies after copying source
RUN npm install

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

CMD ["node", "index.js"]
