# LifeBook API 接口说明

> 基础路径：`/api/v1`（开发环境 `http://localhost:3001`）
> 交互式文档：启动后访问 `http://localhost:3001/docs`（Swagger）
> 鉴权：除标注 `公开` 外，均需 `Authorization: Bearer <token>`

## 认证 `auth`

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| POST | `/auth/register` | 注册 | 公开 |
| POST | `/auth/login` | 登录，返回 accessToken | 公开 |
| GET | `/auth/me` | 当前用户信息 | 登录 |

## 作品 `works`

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| GET | `/works?sort=&category=&page=` | 信息流（recommend / latest / hot） | 公开 |
| GET | `/works/feed/follow` | 关注流 | 登录 |
| GET | `/works/:id` | 作品详情（阅读量 +1） | 公开 |
| GET | `/works/:id/chapters` | 章节列表 | 公开 |
| GET | `/works/:id/comments` | 评论（含回复） | 公开 |
| GET | `/works/:id/related` | 相关推荐 | 公开 |
| POST | `/works` | 创建作品 | 登录 |
| PATCH | `/works/:id` | 更新作品 | 作者 |
| DELETE | `/works/:id` | 删除作品 | 作者 |
| POST | `/works/:id/like` | 点赞 / 取消（toggle） | 登录 |
| POST | `/works/:id/collect` | 收藏 / 取消 | 登录 |
| POST | `/works/:id/resonate` | 共鸣 / 取消 | 登录 |
| POST | `/works/:id/comments` | 发表评论 | 登录 |

## AI 特色 `ai`

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| GET | `/ai/works/:workId/insight` | 时间轴 / 情绪曲线 / 人物关系 | 公开 |
| POST | `/ai/works/:workId/generate` | 触发 AI 重新生成 | 登录 |

## 搜索 `search`

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| GET | `/search?q=` | 作品 / 作者 / 标签三路检索 | 公开 |

## 用户 `users`

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| GET | `/users/:id` | 个人主页 | 登录 |
| GET | `/users/:id/works` | 用户作品 | 登录 |
| POST | `/users/:id/follow` | 关注 | 登录 |
| DELETE | `/users/:id/follow` | 取关 | 登录 |

## 通知 `notifications`

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| GET | `/notifications` | 通知列表 | 登录 |
| PATCH | `/notifications/:id/read` | 标记已读 | 登录 |
| PATCH | `/notifications/read-all` | 全部已读 | 登录 |

## 私信 `messages`

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| GET | `/messages/conversations` | 会话列表 | 登录 |
| GET | `/messages/conversations/:id` | 消息记录 | 登录 |
| POST | `/messages/conversations/:toId` | 发送消息 | 登录 |

## 管理后台 `admin`（ADMIN / EDITOR）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/admin/stats` | 核心数据统计 |
| GET | `/admin/users` | 用户列表 |
| PATCH | `/admin/users/:id/role` | 变更用户角色 |
| GET | `/admin/works` | 作品列表 |

## 发现 `discover`

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| GET | `/discover/hot-topics` | 热门话题 | 公开 |
| GET | `/discover/recommended-authors` | 推荐作者 | 公开 |
| GET | `/discover/hot-tags` | 热门标签 | 公开 |

## 我的 `me`

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| GET | `/me/shelf` | 书架（阅读进度） | 登录 |
| GET | `/me/collections` | 收藏夹 | 登录 |

## 数据模型映射

前端 `types/index.ts` 与后端 `server/prisma/schema.prisma` 一一对应：

- `Work` → `Work`（`coverRatio` 枚举 `RATIO_16_9` 等）
- `ContentBlock[]` → `Chapter.content`（JSON）
- `TimelineNode[] / EmotionPoint[] / CharacterGraph` → `WorkAi`（JSON）
- `resonateCount` → `Resonate` 关系 + `Work.resonateCount` 计数
