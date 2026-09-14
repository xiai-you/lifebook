# LifeBook · 人生小说平台

> 把真实人生写成小说 —— 一个「人生到小说」的 AI 协作创作与阅读平台。
> 融合小红书式的瀑布流、抖音式的沉浸阅读、晋江式的故事社区、Medium 式的长文创作与 AI 写作助手。

## ✨ 产品定位

LifeBook 不是传统小说网站，而是一个**人生故事平台**：普通人把自己的真实经历（北漂、至亲离世、大病初愈、创业失败……）交给 AI 协作，整理成一篇篇可读、可共鸣的小说。读者在别人的故事里照见自己，一键「共鸣」——「**3784 人与你有相似经历**」。

## 🧭 功能清单

| 模块 | 说明 | 前端路由 |
| --- | --- | --- |
| 首页 | 瀑布流信息流（推荐 / 关注 / 最新 / 热门） | `/` |
| 发现 | 分类树 + 热门标签 + 筛选 | `/discover` |
| 分类 | 13 个一级分类 · 三级体系 | `lib/constants/categories.ts` |
| 作品详情 | 信息卡 / 共鸣 / AI 分析 / 目录 / 评论 / 相关推荐 | `/work/[workId]` |
| 沉浸阅读 | Kindle 式阅读器：主题 / 字号 / 章节切换 | `components/reader/` |
| 创作 | AI 五阶段工作台（采访→结构→小说化→润色→封面） | `/create` |
| 书架 | 继续阅读 / 收藏 / 历史 | `/shelf` |
| 搜索 | 小说 / 作者 / 标签 / 城市 / 国家 / 情绪 / 时间 | `/search` |
| 个人主页 | 小红书式个人页 + 作品 / 草稿 / 收藏 | `/me` |
| 通知 | 赞 / 评论 / 收藏 / 关注 / AI / 官方 | `/notifications` |
| 私信 | 微信式会话列表 + 聊天 | `/messages` |
| 登录 | 账号密码 + OAuth（微信 / Apple / 邮箱） | `/login` |
| AI 特色 | 人生时间轴 / 情绪曲线 / 人物关系图 | 作品详情页内 |

## 🎨 设计系统

- **品牌色** `#5B8DEF`（静蓝，主色）· `#2F5FD0`（深）· `#FF8A65`（珊瑚橙点缀）
- **Logo** 一本打开的书，书页化作飞鸟（`components/shared/Logo.tsx`）
- **字体** Inter / HarmonyOS Sans SC / Noto Sans SC / SF Pro Display；正文衬线 Noto Serif SC
- **令牌** CSS 变量 + Tailwind 映射（`app/globals.css`、`tailwind.config.ts`）
- **深浅色** 自动切换（`class` 策略，无闪烁），阅读器另有纸白 / 护眼绿 / 暖黄 / 暗黑四套主题

## 🏗 技术栈

**前端**（根目录）
- Next.js 14（App Router）+ React 18 + TypeScript
- Tailwind CSS 3.4 · framer-motion · zustand · @tanstack/react-query v5
- lucide-react 图标 · shadcn/ui 风格组件（cva + cn）

**后端**（`server/`）
- NestJS 10 · Prisma 5 · PostgreSQL · Redis（ioredis）
- JWT + Passport（RBAC 角色守卫）· OAuth（微信 / Apple）· Swagger OpenAPI
- class-validator 入参校验 · helmet 安全头

**工程化**
- Docker Compose 一键起服务 · Vitest 单测 · Playwright E2E · ESLint · TypeScript 严格模式

## 📁 目录结构

```
maofu/
├─ app/                    # Next.js 页面（App Router）
│  ├─ work/[workId]/       # 作品详情 + 阅读器 + AI 分析
│  ├─ create/              # AI 五阶段写作工作台
│  ├─ messages/[id]/       # 私信聊天
│  └─ ...                  # discover / search / shelf / me / notifications / login
├─ components/
│  ├─ ui/                  # 基础组件（button / badge / avatar / input…）
│  ├─ shared/              # Logo / CoverImage / EmptyState…
│  ├─ work/                # WorkCard / WorkMasonry / AiFeatures / WorkDetail
│  ├─ reader/              # 沉浸式阅读器 + 富内容渲染
│  ├─ layout/              # 顶栏 / 侧栏 / 底部导航 / Footer
│  └─ search/              # 搜索客户端
├─ lib/
│  ├─ api/                 # API 契约层（当前 Mock，可切换后端）
│  │  ├─ index.ts          # 函数签名 = 后端接口契约
│  │  └─ mock/             # 模拟数据
│  └─ constants/           # 分类 / 国家 / 城市 / 情绪
├─ types/index.ts          # 数据模型（单一事实来源，对应 Prisma schema）
├─ server/                 # NestJS 后端
│  ├─ prisma/schema.prisma # 完整数据模型
│  └─ src/                 # auth / users / works / ai / search / notifications / messages / admin
├─ docs/api.md             # API 接口说明
├─ docker-compose.yml      # PostgreSQL + Redis + API + Web
└─ Dockerfile              # 前端镜像（server/Dockerfile 为后端镜像）
```

## 🚀 快速开始

### 1. 前端

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 生产构建
```

> 前端默认返回内存 Mock 数据。要连接真实后端，复制 `.env.example` 为 `.env.local`，
> 设置 `NEXT_PUBLIC_API_MODE=http`（`NEXT_PUBLIC_API_URL` 留空即走 `/api/v1` 代理）。

### 2. 后端

```bash
cd server
npm install
cp .env.example .env     # 填入数据库连接等
npx prisma migrate dev   # 初始化数据库
npm run start:dev        # http://localhost:3001/api/v1
```

> 打开 http://localhost:3001/docs 查看 Swagger 接口文档。

### 3. Docker 一键启动

```bash
docker compose up -d     # 同时启动 db + redis + api + web
```

## 🔌 API 契约

前端 `lib/api/index.ts` 中的函数签名即为后端接口契约，内部按 `NEXT_PUBLIC_API_MODE` 在 **Mock / HTTP** 两种实现间切换（签名与返回结构完全一致，上层组件无需改动）：

- `lib/api/http.ts` —— 统一 HTTP 客户端（基址 / Bearer 鉴权 / 错误归一化）
- `lib/api/serializers.ts` —— 后端 Prisma（枚举大写、Tag 关系、ISO 时间）→ 前端契约的映射
- `lib/api/mock/` —— 内存 Mock 数据

接口概览见 [docs/api.md](docs/api.md)；数据模型见 [server/prisma/schema.prisma](server/prisma/schema.prisma) 与 [types/index.ts](types/index.ts)。

## 🧪 测试

```bash
# 前端类型检查 / 构建
npx tsc --noEmit
npm run build

# 后端
cd server
npm test              # Vitest 单元测试
npm run test:e2e      # Playwright 端到端
```

## 📌 实现说明与后续

- **版本取舍**：为规避 Next.js 15 / React 19 的破坏性升级，当前采用 **Next 14 + React 18**（文档要求 15/19），已作为已知后续项记录，升级路径清晰。
- **Mock 数据层**：前端默认返回内存 Mock，数据形状与后端 Prisma 模型严格一致；设置 `NEXT_PUBLIC_API_MODE=http` 即可无缝切换到真实后端。
- **图标注意**：lucide-react v1.45.0 中 `Home`→`House`、`History`→`Clock3`、`Smile`→`Ellipsis`、`BookMarked`→`Bookmark`、无 `Github`。
- **推荐算法**：后端 `WorksService.orderBy("recommend")` 目前以共鸣 / 热度为近似，接入推荐系统后可替换。
- **关注态 `followed`**：HTTP 模式下作者卡片尚未填充「是否已关注」（需按当前登录用户逐作品计算，属后续增强）；前端 `Author.followed` 为可选字段，未填充时按未关注渲染。
- **未读数**：`Message.read` + 会话级 `unread` 已接入（打开会话自动标记已读）；历史迁移见 `prisma migrate dev`。
- **AI 生成**：`server/src/ai` 与 `/create` 五阶段流程为交互原型，接入 AI Provider 后替换占位逻辑。

## 📄 License

内部项目，未开源。
