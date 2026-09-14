# LifeBook 生产部署手册（Railway + PostgreSQL）

> 本文档描述把 LifeBook 从本地 demo 部署到公网 URL 的完整步骤。
> 目标：前端 + 后端两个 Web Service，数据存持久化 PostgreSQL，图片存 Railway Volume。

## 0. 架构总览

| 服务 | 目录 | 端口 | 说明 |
|---|---|---|---|
| 前端 | 仓库根 `/` | 3000 | Next.js 14（`next start`），代理 `/api/v1` 与 `/uploads` 到后端 |
| 后端 | `server/` | 3001 | NestJS 10，REST `/api/v1/*`，JWT Bearer |
| 数据库 | — | 5432 | Railway 托管的 PostgreSQL（**非 SQLite**） |
| 存储 | — | — | Railway Volume，挂载到后端 `/data`，`UPLOAD_DIR=/data/uploads` |

浏览器只访问前端域名；前端通过 `next.config.mjs` 的 rewrites 把 `/api/v1` 与 `/uploads` 代理到后端，
因此浏览器视角是**同源**，天然规避 CORS 与「Failed to parse URL from /api/v1」两类问题。

## 1. 上线前必须完成的一处代码改动（数据库切 PostgreSQL）

当前 `server/prisma/schema.prisma` 的 datasource 是 SQLite。改为 PostgreSQL：

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

然后（在拿到 Railway 的 `DATABASE_URL` 之后，或先本地验证 schema 能生成）：

```bash
cd server
npx prisma generate
npx prisma db push   # 用生产 DATABASE_URL 建表（无 migrations，首次用 db push）
```

> 说明：schema 已是 PostgreSQL 兼容（无 Prisma enum，全用字符串常量；cuid/now 默认值、复合主键/索引均可直接映射）。
> 本地开发想继续用 SQLite 的话，可把 `provider` 改回 `sqlite`；生产部署时用 `postgresql`。

## 2. 前置条件（需要你本人完成，Claude 无法代办）

- [ ] 安装 Git：<https://git-scm.com/download/win>（本机目前未安装 `git`）
- [ ] GitHub 账号，并创建一个私有/公开仓库
- [ ] Railway 账号：<https://railway.app>（首次部署可能需要绑定银行卡开启计费）

## 3. 部署步骤（Railway）

1. **推代码到 GitHub**
   ```bash
   cd "C:\Users\Lenovo\Desktop\智慧农业监测小程序\maofu"
   git init
   git add .
   git commit -m "feat: LifeBook 生产化（健康检查/0.0.0.0/存储路径/部署手册）"
   git branch -M main
   git remote add origin https://github.com/<你>/lifebook.git
   git push -u origin main
   ```
   仓库已通过 `.gitignore` 排除 `.env`、`server/dev.db`、`server/uploads/`、`server/dist`、`server/node_modules`，**密钥不会进仓库**。

2. **创建 Railway 项目 + 添加 PostgreSQL**
   - Railway 控制台 → New Project → **Add PostgreSQL**。
   - 记下它给的 `DATABASE_URL`（形如 `postgresql://postgres:...@...:5432/railway`）。

3. **部署后端服务**
   - New Service → **Deploy from GitHub repo** → 选 `lifebook` 仓库。
   - 服务设置中把 **Root Directory** 设为 `server`（Railway 会识别 `server/Dockerfile`）。
   - 添加 Volume：挂载路径 `/data`。
   - 设置环境变量（见下表后端列），并**生成一个强随机 `JWT_SECRET`**（不要用 dev 值）：
     ```bash
     openssl rand -base64 64
     ```
   - Railway 会自动执行 `server/Dockerfile`：`npm ci → prisma generate → nest build → prisma db push → node dist/main.js`。

4. **部署前端服务**
   - 再 New Service → 同一仓库 → **Root Directory 设为仓库根**（识别根 `Dockerfile`）。
   - 设置环境变量（见下表前端列），其中 `API_PROXY_TARGET` 和 `API_URL` 填上一步后端服务的公开域名（如 `https://lifebook-api.up.railway.app`）。

5. **发布公网域名**
   - 前端服务 → Settings → **Generate Domain**，得到 `https://xxxxx.up.railway.app`。
   - 把该域名回填为前端的 `NEXT_PUBLIC_*`（如用到）与后端的 `CORS_ORIGIN`。

## 4. 环境变量清单

### 后端（`server/` 服务）

| 变量 | 值 | 说明 |
|---|---|---|
| `DATABASE_URL` | Railway PostgreSQL 连接串 | **必填**，不能用 `file:./dev.db` |
| `JWT_SECRET` | 强随机值（`openssl rand -base64 64`） | **必填**，替换 dev 值 |
| `PORT` | `3001`（或留空，Railway 会注入） | 应用监听 `0.0.0.0` |
| `CORS_ORIGIN` | `https://<前端域名>` | 逗号分隔；前后端同源代理时可留空 |
| `UPLOAD_DIR` | `/data/uploads` | 指向 Volume，图片跨重启持久 |
| `NODE_ENV` | `production` | — |

### 前端（根服务）

| 变量 | 值 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_API_MODE` | `http` | 走真实后端 |
| `NEXT_PUBLIC_API_URL` | 留空 | 浏览器用相对 `/api/v1`，由 rewrite 代理 |
| `API_URL` | `https://<后端域名>/api/v1` | **SSR 服务端**访问后端的绝对地址，不能是 localhost |
| `API_PROXY_TARGET` | `https://<后端域名>` | rewrites 代理目标 |

## 5. 图片持久化

- 后端写入路径由 `UPLOAD_DIR` 决定；`main.ts` 静态托管也读同一变量（已修复二者不一致的隐患）。
- 上传返回相对 URL `/uploads/<userId>/<filename>`；前端 `<img src="/uploads/...">` 命中前端域名 → rewrite 代理到后端 `/uploads` → 从 Volume 读文件。
- 因此 **图片跨重启存在**（Volume 持久），且公开可访问（无鉴权拦截）。

## 6. 端到端验证清单

拿到公网域名后逐项验证（用真实账号，不随机造数据）：

- [ ] `GET https://<域名>/api/v1/health` 返回 `{"status":"ok"}`
- [ ] 注册新账号 → 登录成功，刷新/重登后数据仍在
- [ ] 发布作品（含章节 + 图片块）→ 详情页真实渲染
- [ ] 上传头像/封面 → 图片 URL 可公开访问，重启后仍存在
- [ ] 点赞 / 收藏 / 评论 / 「我也有过相似经历」计数持久
- [ ] 关注 / 取关 → 通知产生且已读状态持久
- [ ] 搜索作品 / 作者 / 标签返回真实结果
- [ ] 未登录访问私有接口返回 401；登录用户只能看自己的私有数据
- [ ] 前端无「Failed to parse URL from /api/v1」、无 CORS 报错

## 7. 常见问题

- **`Failed to parse URL from /api/v1`**：SSR 端 `API_URL` 未设绝对地址（或设成了 localhost）。确认前端服务的 `API_URL=https://<后端>/api/v1`。
- **图片 404**：`UPLOAD_DIR` 未指向 Volume，或前端 `API_PROXY_TARGET` 未配置导致 `/uploads` 未代理到后端。
- **`prisma migrate deploy` 无迁移**：已改为 `prisma db push`（见 `server/Dockerfile`）。后续要迁移历史再 `prisma migrate dev` 提交并改回 `migrate deploy`。
- **数据库连接失败**：`DATABASE_URL` 仍是 `file:./dev.db` 或 provider 未改成 `postgresql`。
