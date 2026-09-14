import { Prisma } from "@prisma/client";

/**
 * 公开的「作者」字段（脱敏：不含 passwordHash / oauthId / email）。
 * 所有关联查询（作品、评论、通知、私信、搜索、推荐作者）统一使用，
 * 避免在 API 响应中泄露密码哈希等敏感字段。
 */
export const AUTHOR_SELECT = {
  id: true,
  nickname: true,
  avatar: true,
  bio: true,
  tags: true,
  region: true,
  country: true,
  _count: { select: { followers: true, works: true } },
} satisfies Prisma.UserSelect;

/** 作品关联字段（作者脱敏 + 标签）。 */
export const WORK_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  tags: true,
} satisfies Prisma.WorkInclude;
