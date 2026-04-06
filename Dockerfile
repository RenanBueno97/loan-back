FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

VOLUME ["/app/data"]

ENV PORT=3001
EXPOSE 3001

CMD ["node", "src/server.js"]
