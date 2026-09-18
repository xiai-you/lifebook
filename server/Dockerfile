FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

# 启动前应用数据库结构（无 migrations，用 db push 幂等同步），避免首次部署空库报 "relation does not exist"。
CMD ["sh", "-c", "npx prisma db push && node dist/main.js"]