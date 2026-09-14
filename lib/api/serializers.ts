/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 后端 → 前端 数据映射层。
 * 负责把 NestJS/Prisma 的返回（枚举大写、Tag 关系、User 关联、ISO 时间）转换为
 * 前端 types/index.ts 定义的契约形状。仅在 HTTP 模式使用。
 */
import type {
  Author,
  Chapter,
  ChatMessage,
  CommentItem,
  Conversation,
  CoverRatio,
  FeedKind,
  HotTopic,
  NotificationItem,
  ShelfItem,
  Tag,
  User,
  Work,
  WorkStatus,
  WorkVisibility,
} from "@/types";

const STATUS: Record<string, WorkStatus> = { ONGOING: "ongoing", COMPLETED: "completed" };
const VISIBILITY: Record<string, WorkVisibility> = {
  PUBLIC: "public",
  FOLLOWERS: "followers",
  PRIVATE: "private",
};
const RATIO: Record<string, CoverRatio> = {
  RATIO_16_9: "16:9",
  RATIO_3_4: "3:4",
  RATIO_1_1: "1:1",
};
const GENDER: Record<string, NonNullable<User["gender"]>> = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  SECRET: "secret",
};

const FEEDKIND: Record<string, FeedKind> = {
  PHOTO: "photo",
  ESSAY: "essay",
  NOVEL: "novel",
};

const NOTIF_TYPE: Record<string, NotificationItem["type"]> = {
  LIKE: "like",
  COMMENT: "comment",
  COLLECT: "collect",
  FOLLOW: "follow",
  AI: "ai",
  OFFICIAL: "official",
};

const MSG_TYPE: Record<string, ChatMessage["type"]> = {
  TEXT: "text",
  IMAGE: "image",
  GIF: "gif",
  EMOJI: "emoji",
  WORK: "work",
};

/** 解析 SQLite 存的 JSON 字符串字段（数组 / 对象），兼容已是数组/对象的情况。 */
function jsonField<T = unknown>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }
  return v as T;
}

function jsonArray<T = unknown>(v: unknown): T[] {
  const parsed = jsonField<unknown>(v);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

/** ISO 时间 → "YYYY-MM-DD HH:mm"（与 Mock 格式一致）。 */
function dt(value?: string | Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 发布日期 → "YYYY-MM-DD"（无时间部分）。 */
function date(value?: string | Date | null): string | null {
  if (!value) return null;
  return dt(value).slice(0, 10);
}

export function toAuthor(u: any): Author {
  if (!u) return { id: "unknown", nickname: "佚名" };
  return {
    id: u.id,
    nickname: u.nickname,
    avatar: u.avatar ?? null,
    coverImage: u.coverImage ?? null,
    bio: u.bio ?? null,
    tags: jsonArray<string>(u.tags),
    region: u.region ?? null,
    country: u.country ?? null,
    followed: u.followed ?? undefined,
    fansCount: u.fansCount ?? u._count?.followers,
    workCount: u.workCount ?? u._count?.works,
  };
}

export function toWork(w: any): Work {
  return {
    id: w.id,
    authorId: w.authorId,
    author: toAuthor(w.author),
    title: w.title,
    subtitle: w.subtitle ?? null,
    summary: w.summary,
    coverImage: w.coverImage ?? null,
    coverColor: w.coverColor ?? undefined,
    feedKind: FEEDKIND[w.feedKind] ?? "essay",
    momentLabel: w.momentLabel ?? null,
    featuredLine: w.featuredLine ?? null,
    categoryL1: w.categoryL1,
    categoryL2: w.categoryL2,
    categoryL3: w.categoryL3 ?? null,
    tags: Array.isArray(w.tags) ? w.tags.map((t: any) => (typeof t === "string" ? t : t.name)) : [],
    emotion: w.emotion ?? null,
    city: w.city ?? null,
    country: w.country ?? null,
    format: w.format ?? "MEMOIR",
    excerpt: w.excerpt ?? null,
    lifeStage: w.lifeStage ?? null,
    occupation: w.occupation ?? null,
    storySource: w.storySource ?? "AUTHOR_WRITTEN",
    year: w.year ?? null,
    totalWords: w.totalWords ?? 0,
    chapterCount: w.chapterCount ?? 0,
    status: STATUS[w.status] ?? "ongoing",
    visibility: VISIBILITY[w.visibility] ?? "public",
    viewCount: w.viewCount ?? 0,
    likeCount: w.likeCount ?? 0,
    collectCount: w.collectCount ?? 0,
    commentCount: w.commentCount ?? 0,
    resonateCount: w.resonateCount ?? 0,
    readMinutes: w.readMinutes ?? 5,
    coverRatio: RATIO[w.coverRatio] ?? "3:4",
    publishAt: date(w.publishAt),
    createdAt: dt(w.createdAt),
    updatedAt: dt(w.updatedAt),
  };
}

export function toUser(u: any): User {
  return {
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    avatar: u.avatar ?? null,
    coverImage: u.coverImage ?? null,
    bio: u.bio ?? null,
    region: u.region ?? null,
    country: u.country ?? null,
    gender: GENDER[u.gender] ?? null,
    createdDays: u.createdDays ?? undefined,
    interests: jsonArray<string>(u.interests),
    tags: jsonArray<string>(u.tags),
    stats: u.stats ?? undefined,
  };
}

export function toChapter(c: any): Chapter {
  return {
    id: c.id,
    workId: c.workId,
    order: c.order,
    title: c.title,
    content: jsonArray<Chapter["content"][number]>(c.content),
    wordCount: c.wordCount ?? 0,
    createdAt: dt(c.createdAt),
  };
}

export function toComment(c: any): CommentItem {
  return {
    id: c.id,
    workId: c.workId ?? null,
    chapterId: c.chapterId ?? null,
    author: toAuthor(c.author),
    content: c.content,
    parentId: c.parentId ?? null,
    likes: c.likes ?? 0,
    createdAt: dt(c.createdAt),
    replies: Array.isArray(c.replies) ? c.replies.map(toComment) : undefined,
  };
}

export function toNotification(n: any): NotificationItem {
  return {
    id: n.id,
    type: NOTIF_TYPE[n.type] ?? "official",
    actor: n.actor ? toAuthor(n.actor) : undefined,
    content: n.content ?? undefined,
    workTitle: n.work?.title ?? n.workTitle ?? undefined,
    workId: n.workId ?? n.work?.id ?? null,
    authorId: n.actorId ?? n.actor?.id ?? null,
    createdAt: dt(n.createdAt),
    read: n.read ?? false,
  };
}

export function toConversation(c: any, meId: string): Conversation {
  const other = c.userA?.id === meId ? c.userB : c.userA;
  return {
    id: c.id,
    user: toAuthor(other),
    lastMessage: c.lastMessage ?? "",
    lastAt: dt(c.lastAt),
    unread: c.unread ?? 0,
  };
}

export function toChatMessage(m: any, meId: string): ChatMessage {
  return {
    id: m.id,
    from: m.fromId === meId ? "me" : "other",
    type: MSG_TYPE[m.type] ?? "text",
    content: m.content,
    workId: m.workId ?? null,
    createdAt: dt(m.createdAt),
  };
}

export function toShelfItem(s: any): ShelfItem {
  return {
    work: toWork(s.work),
    progress: s.progress ?? 0,
    lastChapterOrder: s.lastChapterOrder ?? 0,
    lastReadAt: dt(s.lastReadAt),
  };
}

export function toHotTopic(t: any): HotTopic {
  return { id: t.id, title: t.title, heat: t.heat ?? 0, trend: t.trend ?? "flat" };
}

export function toTag(t: any): Tag {
  return { id: t.id, name: t.name };
}
