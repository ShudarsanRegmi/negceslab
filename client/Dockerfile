FROM node:20-bullseye
WORKDIR /app
COPY client/package*.json ./
RUN npm install -g npm@10.9.2 && npm install
COPY client/ ./
COPY shared ../shared
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
