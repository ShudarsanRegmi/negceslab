FROM node:20-bullseye
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ ./
COPY shared ../shared
EXPOSE 5000
CMD ["node", "index.js"]
