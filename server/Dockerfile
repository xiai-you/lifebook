# LifeBook NestJS 后端镜像
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001
# 首次上线无 migrations 目录，用 db push 从 schema 建表（对齐 schema.prisma 的 DATABASE_URL）。
# 之后建议用 `prisma migrate dev` 提交迁移、改回 `migrate deploy` 以获得可回滚的历史。
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
