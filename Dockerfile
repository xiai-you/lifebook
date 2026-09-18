# LifeBook Next.js 前端镜像
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Railway 注入的 service 变量需显式声明 ARG 才能在 Docker 构建阶段读取；
# ENV 使其成为构建期环境变量，供 next.config.mjs 的 process.env.API_PROXY_TARGET 使用。
ARG API_PROXY_TARGET
ENV API_PROXY_TARGET=$API_PROXY_TARGET

# NEXT_PUBLIC_* 在 next build 时被内联进浏览器 bundle，构建阶段必须可用。
ARG NEXT_PUBLIC_API_MODE
ENV NEXT_PUBLIC_API_MODE=$NEXT_PUBLIC_API_MODE
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY package.json ./

EXPOSE 3000
CMD ["npm", "start"]
