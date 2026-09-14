import type {
  Work,
  HotTopic,
  Tag,
  Author,
  Chapter,
  ContentBlock,
  User,
  CommentItem,
  NotificationItem,
  Conversation,
  ChatMessage,
  ShelfItem,
  TimelineNode,
  EmotionPoint,
  CharacterNode,
  CharacterEdge,
  LifeMapLocation,
  SearchResult,
  WorkVisibility,
  WorkStatus,
  StoryFormat,
  StorySource,
  FeedKind,
  AiConversation,
  AiConversationDetail,
  LifeContext,
  Highlight,
} from "@/types";
import {
  mockWorks,
  mockHotTopics,
  mockRecommendedAuthors,
  mockHotTags,
  authors,
} from "./mock";
import { getChaptersForWork } from "./mock";
import {
  mockComments,
  mockNotifications,
  mockConversations,
  mockChatMessages,
  mockShelf,
  mockCollections,
  addMockComment,
  addMockMessage,
  addMockWork,
  updateMockWork,
} from "./mock";
import { photoFor } from "@/lib/photos";
import { ApiError, getApiBaseUrl, getAuthToken, http, isHttpMode, setAuthToken } from "./http";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  toAuthor,
  toChapter,
  toChatMessage,
  toComment,
  toConversation,
  toHotTopic,
  toNotification,
  toShelfItem,
  toTag,
  toUser,
  toWork,
} from "./serializers";

/**
 * API 层 —— 前端数据契约。
 * 默认返回 Mock 数据（内存）；设置 NEXT_PUBLIC_API_MODE=http 后切换为真实 NestJS 后端，
 * 函数签名与返回结构保持一致，上层组件无需改动。
 *
 * 后端接口契约见 docs/api.md；数据模型见 server/prisma/schema.prisma。
 */

const PAGE_SIZE = 8;

/** 分页结果 */
export interface Paged<T> {
  list: T[];
  hasMore: boolean;
}

/** 模拟网络延迟 + 返回数据 */
function mock<T>(data: T, delay = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

/** 解析后端（SQLite）以 JSON 字符串存储的字段 */
function parseJson<T>(v: unknown): T | null {
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

function paginate<T>(list: T[], page: number): Paged<T> {
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return { list: list.slice(start, end), hasMore: end < list.length };
}

function engagement(w: Work): number {
  return (
    w.viewCount + w.likeCount * 3 + w.collectCount * 4 + w.commentCount * 5 + w.resonateCount * 6
  );
}

/** HTTP 模式下统一拉取分页作品列表。 */
async function httpPagedWorks(path: string): Promise<Paged<Work>> {
  const res = await http.get<{ list: unknown[]; hasMore: boolean }>(path);
  return { list: res.list.map(toWork), hasMore: res.hasMore };
}

// ---------- 认证 ----------

export interface AuthResult {
  accessToken: string;
  user: User;
}

export interface RegisterPayload {
  username: string;
  nickname: string;
  password: string;
  email?: string;
}

export async function login(account: string, password: string): Promise<AuthResult> {
  if (isHttpMode()) {
    const res = await http.post<{ accessToken: string; user: unknown }>("/auth/login", {
      account,
      password,
    });
    setAuthToken(res.accessToken);
    return { accessToken: res.accessToken, user: toUser(res.user) };
  }
  return mock({ accessToken: "mock-token", user: mockCurrentUser });
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  if (isHttpMode()) {
    const res = await http.post<{ accessToken: string; user: unknown }>("/auth/register", payload);
    setAuthToken(res.accessToken);
    return { accessToken: res.accessToken, user: toUser(res.user) };
  }
  return mock({ accessToken: "mock-token", user: mockCurrentUser });
}

/** 退出登录：清除会话 token。 */
export function logout(): void {
  setAuthToken(null);
}

// ---------- 首页 / 流 ----------

export async function getRecommendWorks(page = 1): Promise<Paged<Work>> {
  if (isHttpMode()) return httpPagedWorks(`/works?sort=recommend&page=${page}&pageSize=${PAGE_SIZE}`);
  const sorted = [...mockWorks].sort((a, b) => engagement(b) - engagement(a));
  return mock(paginate(sorted, page));
}

export async function getFollowWorks(page = 1): Promise<Paged<Work>> {
  if (isHttpMode()) return httpPagedWorks(`/works/feed/follow?page=${page}&pageSize=${PAGE_SIZE}`);
  return mock(paginate(mockWorks.filter((w) => w.author.followed), page));
}

export async function getLatestWorks(page = 1): Promise<Paged<Work>> {
  if (isHttpMode()) return httpPagedWorks(`/works?sort=latest&page=${page}&pageSize=${PAGE_SIZE}`);
  const sorted = [...mockWorks].sort((a, b) =>
    (b.publishAt ?? "").localeCompare(a.publishAt ?? "")
  );
  return mock(paginate(sorted, page));
}

export async function getHotWorks(page = 1): Promise<Paged<Work>> {
  if (isHttpMode()) return httpPagedWorks(`/works?sort=hot&page=${page}&pageSize=${PAGE_SIZE}`);
  const sorted = [...mockWorks].sort((a, b) => b.viewCount - a.viewCount);
  return mock(paginate(sorted, page));
}

// ---------- 分类 / 发现 ----------

/** 全部作品（供发现 / 筛选等客户端交互使用） */
export async function getAllWorks(): Promise<Work[]> {
  if (isHttpMode()) {
    const res = await httpPagedWorks(`/works?page=1&pageSize=1000`);
    return res.list;
  }
  return mock(mockWorks);
}

export async function getWorksByCategory(categoryId: string, page = 1): Promise<Paged<Work>> {
  if (isHttpMode()) {
    return httpPagedWorks(`/works?category=${categoryId}&page=${page}&pageSize=${PAGE_SIZE}`);
  }
  const filtered = mockWorks.filter((w) => w.categoryL1 === categoryId);
  return mock(paginate(filtered, page));
}

export async function getWorksBySubCategory(
  categoryId: string,
  subCategory: string,
  page = 1
): Promise<Paged<Work>> {
  if (isHttpMode()) {
    return httpPagedWorks(
      `/works?category=${categoryId}&subCategory=${encodeURIComponent(subCategory)}&page=${page}&pageSize=${PAGE_SIZE}`
    );
  }
  const filtered = mockWorks.filter(
    (w) => w.categoryL1 === categoryId && w.categoryL2 === subCategory
  );
  return mock(paginate(filtered, page));
}

// ---------- 作品 / 阅读 ----------

export async function getWorkById(workId: string): Promise<Work | null> {
  if (isHttpMode()) {
    try {
      const w = await http.get<unknown>(`/works/${workId}`);
      return toWork(w);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }
  return mock(mockWorks.find((w) => w.id === workId) ?? null);
}

export async function getChapters(workId: string): Promise<Chapter[]> {
  if (isHttpMode()) {
    const list = await http.get<unknown[]>(`/works/${workId}/chapters`);
    return list.map(toChapter);
  }
  return mock(getChaptersForWork(workId));
}

export async function getComments(workId: string): Promise<CommentItem[]> {
  if (isHttpMode()) {
    const list = await http.get<unknown[]>(`/works/${workId}/comments`);
    return list.map(toComment);
  }
  return mock(mockComments.filter((c) => c.workId === workId), 300);
}

export async function getRelatedWorks(workId: string): Promise<Work[]> {
  if (isHttpMode()) {
    const list = await http.get<unknown[]>(`/works/${workId}/related`);
    return list.map(toWork);
  }
  const current = mockWorks.find((w) => w.id === workId);
  if (!current) return mock([]);
  const related = mockWorks
    .filter((w) => w.id !== workId)
    .sort((a, b) => {
      const score = (w: Work) =>
        (w.categoryL1 === current.categoryL1 ? 2 : 0) +
        w.tags.filter((t) => current.tags.includes(t)).length;
      return score(b) - score(a);
    })
    .slice(0, 3);
  return mock(related);
}

// ---------- AI 特色 ----------

export async function getWorkTimeline(workId: string): Promise<TimelineNode[]> {
  if (isHttpMode()) {
    const insight = await http.get<{ timeline?: unknown } | null>(`/ai/works/${workId}/insight`);
    return parseJson<TimelineNode[]>(insight?.timeline) ?? [];
  }
  return mock([]);
}

export async function getWorkEmotionCurve(workId: string): Promise<EmotionPoint[]> {
  if (isHttpMode()) {
    const insight = await http.get<{ emotionCurve?: unknown } | null>(
      `/ai/works/${workId}/insight`
    );
    return parseJson<EmotionPoint[]>(insight?.emotionCurve) ?? [];
  }
  return mock([]);
}

export async function getWorkCharacterGraph(workId: string): Promise<{
  nodes: CharacterNode[];
  edges: CharacterEdge[];
}> {
  if (isHttpMode()) {
    const insight = await http.get<{ characterGraph?: unknown } | null>(
      `/ai/works/${workId}/insight`
    );
    return parseJson<{ nodes: CharacterNode[]; edges: CharacterEdge[] }>(insight?.characterGraph) ?? {
      nodes: [],
      edges: [],
    };
  }
  return mock({ nodes: [], edges: [] });
}

export async function getWorkLifeMap(workId: string): Promise<LifeMapLocation[]> {
  if (isHttpMode()) {
    const insight = await http.get<{ lifeMap?: unknown } | null>(
      `/ai/works/${workId}/insight`
    );
    return parseJson<LifeMapLocation[]>(insight?.lifeMap) ?? [];
  }
  return mock([]);
}

// ---------- 搜索 ----------

export async function searchWorks(query: string): Promise<SearchResult> {
  if (isHttpMode()) {
    const res = await http.get<{ works: unknown[]; authors: unknown[]; tags: unknown[] }>(
      `/search?q=${encodeURIComponent(query)}`
    );
    return {
      works: res.works.map(toWork),
      authors: res.authors.map(toAuthor),
      tags: res.tags.map(toTag),
    };
  }

  const q = query.trim().toLowerCase();
  if (!q) return mock({ works: [], authors: [], tags: [] });

  const works = mockWorks.filter((w) => {
    const haystack = [
      w.title,
      w.summary,
      w.author.nickname,
      w.categoryL1,
      w.categoryL2,
      w.emotion ?? "",
      w.city ?? "",
      w.country ?? "",
      ...w.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  const matchedAuthors = Object.values(authors).filter((a) =>
    (a.nickname + (a.tags?.join(" ") ?? "") + (a.region ?? "")).toLowerCase().includes(q)
  );

  const matchedTags = Array.from(
    new Set(works.flatMap((w) => w.tags).filter((t) => t.toLowerCase().includes(q)))
  ).map((name, i) => ({ id: `tag-${i}`, name }));

  return mock({ works: works.slice(0, 12), authors: matchedAuthors.slice(0, 8), tags: matchedTags });
}

// ---------- 用户 ----------

export const mockCurrentUser: User = {
  id: "me",
  username: "linxiaoman",
  nickname: "林小满",
  avatar: null,
  coverImage: null,
  bio: "记录生活里那些普通又闪闪发光的瞬间。",
  region: "北京 · 海淀",
  country: "中国",
  interests: ["growth", "city", "mind"],
  tags: ["90后", "北漂", "写作者"],
  createdDays: 1284,
  stats: { works: 12, followers: 32800, following: 186, likes: 156000, reads: 2400000 },
};

export async function getCurrentUser(): Promise<User> {
  if (isHttpMode()) {
    const u = await http.get<unknown>("/auth/me");
    return toUser(u);
  }
  return mock(mockCurrentUser);
}

export async function getAuthorById(authorId: string): Promise<Author | null> {
  if (isHttpMode()) {
    try {
      const u = await http.get<unknown>(`/users/${authorId}`);
      return toAuthor(u);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }
  return mock(authors[authorId] ?? null);
}

// ---------- 通知 / 私信 ----------

export async function getNotifications(): Promise<NotificationItem[]> {
  if (isHttpMode()) {
    const list = await http.get<unknown[]>("/notifications");
    return list.map(toNotification);
  }
  return mock(mockNotifications);
}

/** 标记单条通知已读（持久化到后端）。 */
export async function markNotificationRead(id: string): Promise<void> {
  if (isHttpMode()) await http.patch(`/notifications/${id}/read`);
}

/** 全部通知已读（持久化到后端）。 */
export async function markAllNotificationsRead(): Promise<void> {
  if (isHttpMode()) await http.patch("/notifications/read-all");
}

export async function getConversations(): Promise<Conversation[]> {
  if (isHttpMode()) {
    const me = await getCurrentUser();
    const list = await http.get<unknown[]>("/messages/conversations");
    return list.map((c) => toConversation(c, me.id));
  }
  return mock(mockConversations);
}

export async function getChatMessages(conversationId: string): Promise<ChatMessage[]> {
  if (isHttpMode()) {
    const me = await getCurrentUser();
    const list = await http.get<unknown[]>(`/messages/conversations/${conversationId}`);
    return list.map((m) => toChatMessage(m, me.id));
  }
  return mock(mockChatMessages[conversationId] ?? [], 300);
}

// ---------- 书架 ----------

export async function getShelf(): Promise<ShelfItem[]> {
  if (isHttpMode()) {
    const list = await http.get<unknown[]>("/me/shelf");
    return list.map(toShelfItem);
  }
  return mock(mockShelf);
}

export async function getCollections(): Promise<ShelfItem[]> {
  if (isHttpMode()) {
    const list = await http.get<unknown[]>("/me/collections");
    return list.map(toShelfItem);
  }
  return mock(mockCollections);
}

export interface MyInteractions {
  likedWorkIds: string[];
  collectedWorkIds: string[];
  resonatedWorkIds: string[];
  followedAuthorIds: string[];
  likedCommentIds: string[];
  bookmarkedChapters: string[];
}

/** 当前用户的互动状态（点赞/收藏/共鸣/关注），供前端 store hydrate。 */
export async function getMyInteractions(): Promise<MyInteractions> {
  if (isHttpMode()) return await http.get<MyInteractions>("/me/interactions");
  return mock({ likedWorkIds: [], collectedWorkIds: [], resonatedWorkIds: [], followedAuthorIds: [], likedCommentIds: [], bookmarkedChapters: [] });
}

// ---------- 右侧栏 ----------

export async function getHotTopics(): Promise<HotTopic[]> {
  if (isHttpMode()) {
    const list = await http.get<unknown[]>("/discover/hot-topics");
    return list.map(toHotTopic);
  }
  return mock(mockHotTopics);
}

export async function getRecommendedAuthors(): Promise<Author[]> {
  if (isHttpMode()) {
    const list = await http.get<unknown[]>("/discover/recommended-authors");
    return list.map(toAuthor);
  }
  return mock(mockRecommendedAuthors);
}

export async function getHotTags(): Promise<Tag[]> {
  if (isHttpMode()) {
    const list = await http.get<unknown[]>("/discover/hot-tags");
    return list.map(toTag);
  }
  return mock(mockHotTags);
}

// ---------- 交互写入（Mock 为内存态；HTTP 走真实后端） ----------

let pubSeq = 0;

/** 发表评论（parentId 为回复目标评论） */
export async function postComment(workId: string, content: string, parentId?: string): Promise<CommentItem> {
  if (isHttpMode()) {
    const c = await http.post<unknown>(
      `/works/${workId}/comments`,
      parentId ? { content, parentId } : { content }
    );
    return toComment(c);
  }
  const comment: CommentItem = {
    id: `local-cm-${Date.now()}`,
    workId,
    author: { id: "me", nickname: mockCurrentUser.nickname, avatar: mockCurrentUser.avatar },
    content,
    parentId: parentId ?? null,
    likes: 0,
    createdAt: "刚刚",
  };
  addMockComment(comment);
  return comment;
}

/** 评论点赞（切换，持久化到后端）。 */
export async function likeComment(workId: string, commentId: string): Promise<void> {
  if (isHttpMode()) await http.post(`/works/${workId}/comments/${commentId}/like`);
}

/** 发送私信（toId 为收信人用户 id） */
export async function sendChatMessage(
  toId: string,
  content: string
): Promise<ChatMessage> {
  if (isHttpMode()) {
    const me = await getCurrentUser();
    const m = await http.post<unknown>(`/messages/conversations/${toId}`, { content });
    return toChatMessage(m, me.id);
  }
  const message: ChatMessage = {
    id: `local-msg-${Date.now()}`,
    from: "me",
    type: "text",
    content,
    createdAt: "刚刚",
  };
  addMockMessage(toId, message);
  return message;
}

/** 作者作品列表（用户主页） */
export async function getAuthorWorks(authorId: string): Promise<Work[]> {
  if (isHttpMode()) {
    const res = await httpPagedWorks(`/works?author=${authorId}&page=1&pageSize=1000`);
    return res.list;
  }
  return mock(mockWorks.filter((w) => w.authorId === authorId));
}

/** 按标签 / 情绪查找作品（标签页） */
export async function getWorksByTag(tag: string): Promise<Work[]> {
  if (isHttpMode()) {
    const res = await httpPagedWorks(`/works?tag=${encodeURIComponent(tag)}&page=1&pageSize=1000`);
    return res.list;
  }
  return mock(
    mockWorks.filter((w) => w.tags.includes(tag) || w.emotion === tag || w.city === tag)
  );
}

export interface PublishStoryInput {
  title: string;
  summary: string;
  categoryL1: string;
  categoryL2: string;
  tags: string[];
  emotion?: string;
  city?: string;
  /** 纯文本正文（单章，兼容旧路径） */
  content?: string;
  /** 结构化章节（多章节 + 内容块，含图片），优先于 content */
  chapters?: { title: string; blocks: ContentBlock[] }[];
  visibility?: WorkVisibility;
  format?: StoryFormat;
  excerpt?: string;
  lifeStage?: string;
  occupation?: string;
  year?: string;
  storySource?: StorySource;
  feedKind?: FeedKind;
  momentLabel?: string;
  featuredLine?: string;
}

/** 发布故事：真实写入数据层，返回新作品（首页 / 我的 立即可见） */
export async function publishStory(input: PublishStoryInput): Promise<Work> {
  if (isHttpMode()) {
    const w = await http.post<unknown>("/works", input);
    return toWork(w);
  }
  pubSeq += 1;
  const id = `work-pub-${pubSeq}`;
  const now = new Date().toISOString();
  const contentText =
    input.content ??
    (input.chapters ?? [])
      .map((c) => c.blocks.map((b) => (b as { text?: string }).text ?? "").join(" "))
      .join(" ");
  const chapterCount = input.chapters?.length ?? 1;
  const work: Work = {
    id,
    authorId: "me",
    author: authors.me,
    title: input.title,
    subtitle: null,
    summary: input.summary,
    coverImage: photoFor({
      id,
      categoryL1: input.categoryL1,
      emotion: input.emotion ?? null,
      tags: input.tags,
    }),
    coverColor: "#5B8DEF",
    feedKind: input.feedKind ?? "essay",
    momentLabel: input.momentLabel ?? null,
    featuredLine: input.featuredLine ?? input.excerpt ?? input.summary,
    categoryL1: input.categoryL1,
    categoryL2: input.categoryL2,
    categoryL3: null,
    tags: input.tags,
    emotion: input.emotion ?? null,
    city: input.city ?? null,
    country: "中国",
    totalWords: contentText.length,
    chapterCount,
    status: "ongoing",
    visibility: input.visibility ?? "public",
    viewCount: 0,
    likeCount: 0,
    collectCount: 0,
    commentCount: 0,
    resonateCount: 0,
    readMinutes: Math.max(1, Math.round(contentText.length / 400)),
    coverRatio: "3:4",
    publishAt: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
  };
  addMockWork(work);
  return work;
}

export interface UpdateWorkInput {
  title?: string;
  subtitle?: string;
  summary?: string;
  categoryL1?: string;
  categoryL2?: string;
  tags?: string[];
  emotion?: string;
  city?: string;
  country?: string;
  year?: string;
  lifeStage?: string;
  occupation?: string;
  excerpt?: string;
  visibility?: WorkVisibility;
  status?: WorkStatus;
}

/** 编辑已发布作品：真实落库（PATCH /works/:id），返回更新后的作品。 */
export async function updateWork(id: string, patch: UpdateWorkInput): Promise<Work> {
  if (isHttpMode()) {
    const w = await http.patch<unknown>(`/works/${id}`, patch);
    return toWork(w);
  }
  const updated = updateMockWork(id, patch);
  if (updated) return mock(updated);
  return mock({ id, ...patch } as unknown as Work);
}

// ---------- 互动写入（点赞 / 收藏 / 共鸣 / 关注，真实落库） ----------

export interface InteractionResult {
  active: boolean;
  count: number;
}

export async function likeWork(workId: string): Promise<InteractionResult> {
  if (isHttpMode()) return await http.post<InteractionResult>(`/works/${workId}/like`);
  const { likedWorkIds, likeCounts } = useAppStore.getState();
  const active = !likedWorkIds.includes(workId);
  return { active, count: (likeCounts[workId] ?? 0) + (active ? 1 : -1) };
}

export async function collectWork(workId: string): Promise<InteractionResult> {
  if (isHttpMode()) return await http.post<InteractionResult>(`/works/${workId}/collect`);
  const { collectedWorkIds, collectCounts } = useAppStore.getState();
  const active = !collectedWorkIds.includes(workId);
  return { active, count: (collectCounts[workId] ?? 0) + (active ? 1 : -1) };
}

export async function resonateWork(workId: string): Promise<InteractionResult> {
  if (isHttpMode()) return await http.post<InteractionResult>(`/works/${workId}/resonate`);
  const { resonatedWorkIds, resonateCounts } = useAppStore.getState();
  const active = !resonatedWorkIds.includes(workId);
  return { active, count: (resonateCounts[workId] ?? 0) + (active ? 1 : -1) };
}

export async function setFollow(authorId: string, follow: boolean): Promise<void> {
  if (isHttpMode()) {
    if (follow) await http.post(`/users/${authorId}/follow`);
    else await http.delete(`/users/${authorId}/follow`);
  }
}

// ---------- 个人资料 / 设置（持久化到数据库） ----------

export interface UpdateProfilePayload {
  nickname?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  region?: string;
  country?: string;
  interests?: string[];
  tags?: string[];
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  if (isHttpMode()) {
    const u = await http.patch<unknown>("/me/profile", payload);
    return toUser(u);
  }
  Object.assign(mockCurrentUser, payload);
  return mock(mockCurrentUser);
}

/** 上传图片到存储（multipart），返回可访问的相对 URL（后端已持久化落盘）。 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  if (isHttpMode()) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${getApiBaseUrl()}/storage/upload`, {
      method: "POST",
      headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {},
      body: fd,
    });
    if (!res.ok) {
      let message = `上传失败（${res.status}）`;
      try {
        const data = (await res.json()) as { message?: string };
        message = data.message ?? message;
      } catch {
        // 非 JSON 错误体，保留默认信息
      }
      throw new ApiError(res.status, message);
    }
    return (await res.json()) as { url: string };
  }
  // Mock 模式：无后端存储，退回 data URL 以便演示（不落库）。
  return { url: await fileToDataUrl(file) };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

export async function getSettings(): Promise<Record<string, unknown>> {
  if (isHttpMode()) return await http.get<Record<string, unknown>>("/me/settings");
  return mock({ theme: "system", language: "zh" });
}

export async function updateSettings(
  patch: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (isHttpMode()) return await http.patch<Record<string, unknown>>("/me/settings", patch);
  return mock(patch);
}

// ---------- 阅读进度 / 草稿（持久化） ----------

export async function recordReading(
  workId: string,
  chapterOrder: number,
  chapterCount: number
): Promise<void> {
  if (isHttpMode()) await http.post("/me/history", { workId, chapterOrder, chapterCount });
}

/** 书签切换（加/取消某一章书签）。 */
export async function toggleBookmark(workId: string, chapterOrder: number): Promise<{ active: boolean }> {
  if (isHttpMode()) return await http.post<{ active: boolean }>("/me/bookmarks", { workId, chapterOrder });
  return { active: true };
}

// ---------- 阅读划线（选择文字标记，持久化到数据库） ----------

const mockHighlights: Highlight[] = [];

/** 当前用户的划线列表（可选按作品过滤）。 */
export async function getHighlights(workId?: string): Promise<Highlight[]> {
  if (isHttpMode()) {
    const qs = workId ? `?workId=${encodeURIComponent(workId)}` : "";
    return await http.get<Highlight[]>(`/me/highlights${qs}`);
  }
  return mock(mockHighlights.filter((h) => !workId || h.workId === workId));
}

/** 创建划线（同一作品同一章节的相同文字去重，重复时返回已有记录）。 */
export async function createHighlight(
  workId: string,
  chapterOrder: number,
  text: string
): Promise<Highlight> {
  if (isHttpMode()) {
    return await http.post<Highlight>("/me/highlights", { workId, chapterOrder, text });
  }
  const trimmed = text.trim();
  const existing = mockHighlights.find(
    (h) => h.workId === workId && h.chapterOrder === chapterOrder && h.text === trimmed
  );
  if (existing) return existing;
  const hl: Highlight = { id: `hl-${Date.now()}`, workId, chapterOrder, text: trimmed, createdAt: "刚刚" };
  mockHighlights.push(hl);
  return hl;
}

/** 删除划线（仅本人）。 */
export async function deleteHighlight(id: string): Promise<void> {
  if (isHttpMode()) await http.delete(`/me/highlights/${id}`);
  const i = mockHighlights.findIndex((h) => h.id === id);
  if (i >= 0) mockHighlights.splice(i, 1);
}

export interface DraftDto {
  id: string;
  title: string;
  content?: string | null;
  updatedAt: string;
}

export async function getDrafts(): Promise<DraftDto[]> {
  if (isHttpMode()) return await http.get<DraftDto[]>("/me/drafts");
  return mock([]);
}

export async function createDraft(title: string, content?: string): Promise<DraftDto> {
  if (isHttpMode()) return await http.post<DraftDto>("/me/drafts", { title, content });
  return mock({ id: `draft-${Date.now()}`, title, content, updatedAt: "" });
}

export async function updateDraft(
  id: string,
  patch: { title?: string; content?: string }
): Promise<DraftDto> {
  if (isHttpMode()) return await http.patch<DraftDto>(`/me/drafts/${id}`, patch);
  return mock({ id, title: patch.title ?? "", content: patch.content, updatedAt: "" });
}

export async function deleteDraft(id: string): Promise<void> {
  if (isHttpMode()) await http.delete(`/me/drafts/${id}`);
}

// ---------- AI 采访对话（记忆） ----------

export async function getAiConversations(): Promise<AiConversation[]> {
  if (isHttpMode()) return await http.get<AiConversation[]>("/me/ai/conversations");
  return mock([]);
}

export async function createAiConversation(topic?: string): Promise<AiConversation> {
  if (isHttpMode()) return await http.post<AiConversation>("/me/ai/conversations", { topic });
  return mock({ id: `conv-${Date.now()}`, topic, currentStep: 0, status: "ACTIVE", updatedAt: "" });
}

export async function getAiConversation(id: string): Promise<AiConversationDetail | null> {
  if (isHttpMode()) {
    try {
      return await http.get<AiConversationDetail>(`/me/ai/conversations/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }
  return mock(null);
}

export async function sendAiMessage(
  conversationId: string,
  role: "ai" | "user",
  content: string
): Promise<void> {
  if (isHttpMode()) await http.post(`/me/ai/conversations/${conversationId}/messages`, { role, content });
}

export async function updateAiConversation(
  id: string,
  patch: { currentStep?: number; storyContext?: LifeContext; status?: "ACTIVE" | "COMPLETED" }
): Promise<void> {
  if (isHttpMode()) await http.patch(`/me/ai/conversations/${id}`, patch);
}
