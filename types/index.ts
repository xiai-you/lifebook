// ============================================================
// LifeBook 数据模型 —— 前端契约层
// 对接 NestJS / Prisma 后端时，此文件为唯一数据源（单一事实来源）。
// ============================================================

// ---------- 用户与作者 ----------

export interface UserStats {
  works: number;
  followers: number;
  following: number;
  likes: number;
  reads: number;
}

export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  region?: string | null; // 地区（如 "北京 · 朝阳"）
  country?: string | null; // 国家
  gender?: "male" | "female" | "other" | "secret" | null;
  /** 创作天数 */
  createdDays?: number;
  /** 感兴趣的分类 ID */
  interests: string[];
  /** 人生标签 */
  tags: string[];
  stats?: UserStats;
}

export interface Author {
  id: string;
  nickname: string;
  avatar?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  tags?: string[];
  region?: string | null;
  country?: string | null;
  /** 当前用户是否已关注 */
  followed?: boolean;
  fansCount?: number;
  workCount?: number;
}

// ---------- 作品 ----------

export type WorkVisibility = "public" | "followers" | "private";
export type WorkStatus = "ongoing" | "completed";
export type CoverRatio = "16:9" | "3:4" | "1:1";
/** 首页内容形态（生活流混合排版） */
export type FeedKind = "photo" | "essay" | "novel";
/** 内容形式 */
export type StoryFormat =
  | "MEMOIR"
  | "DIARY"
  | "LETTER"
  | "PHOTO_STORY"
  | "SHORT_STORY"
  | "LONG_STORY"
  | "SERIAL"
  | "LIFE_FRAGMENT"
  | "TRAVEL_LOG"
  | "ORAL_HISTORY";
/** 真实来源 */
export type StorySource = "AUTHOR_WRITTEN" | "ORAL_TRANSCRIPT" | "AI_ASSISTED" | "AUTHOR_PHOTO";

export interface Work {
  id: string;
  authorId: string;
  author: Author;
  title: string;
  subtitle?: string | null;
  summary: string;
  coverImage?: string | null;
  /** 封面主题色（无封面图时的渐变 / 图片加载失败兜底） */
  coverColor?: string;
  /** 内容形态：照片故事 / 长文 / 小说（首页据此选择排版） */
  feedKind?: FeedKind;
  /** 人生印记标签，如「2019 · 第一次离家」 */
  momentLabel?: string | null;
  /** 一句金句（长文卡片 / 照片卡片引用） */
  featuredLine?: string | null;
  categoryL1: string;
  categoryL2: string;
  categoryL3?: string | null;
  tags: string[];
  /** 情绪标签（如 "治愈" "催泪" "温暖"） */
  emotion?: string | null;
  city?: string | null;
  country?: string | null;
  /** 内容形式（日记/书信/图文/连载…） */
  format?: StoryFormat;
  /** 故事摘录（作者原文的一句话） */
  excerpt?: string | null;
  /** 人生阶段 */
  lifeStage?: string | null;
  /** 职业 */
  occupation?: string | null;
  /** 真实来源 */
  storySource?: StorySource;
  /** 故事发生年份 */
  year?: string | null;
  totalWords: number;
  chapterCount: number;
  status: WorkStatus;
  visibility: WorkVisibility;
  viewCount: number;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  /** 共鸣数：点过「我也经历过」的人数 */
  resonateCount: number;
  /** 预估阅读时长（分钟） */
  readMinutes: number;
  coverRatio: CoverRatio;
  publishAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- 章节与富内容 ----------

export type ImageLayout = "center" | "left" | "right" | "full" | "inline";

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string; level: 2 | 3 }
  | { type: "quote"; text: string }
  | { type: "divider" }
  | {
      type: "image";
      /** 图片地址（上传到 Storage 后得到的相对 URL，如 /uploads/...） */
      src?: string;
      alt?: string;
      caption?: string;
      layout?: ImageLayout;
      animated?: boolean;
      color?: string;
    }
  | { type: "video"; caption?: string }
  | { type: "audio"; caption?: string }
  | { type: "map"; label?: string };

export interface Chapter {
  id: string;
  workId: string;
  order: number;
  title: string;
  content: ContentBlock[];
  wordCount: number;
  createdAt: string;
}

// ---------- AI 特色数据 ----------

export interface TimelineNode {
  id: string;
  year: string;
  title: string;
  chapterOrder?: number;
}

export type EmotionKind = "happy" | "sad" | "tense" | "hope";

export interface EmotionPoint {
  chapterOrder: number;
  label: string;
  /** -1（负面）~ 1（正面） */
  value: number;
  emotion: EmotionKind;
}

export interface CharacterNode {
  id: string;
  name: string;
  role?: string;
}

export interface CharacterEdge {
  source: string;
  target: string;
  relation: string;
}

export interface LifeMapLocation {
  id: string;
  /** 地点名称，如 "北京 · 朝阳" */
  name: string;
  /** 地图相对坐标（0–100 百分比） */
  x: number;
  y: number;
  chapterOrder?: number;
}

// ---------- 互动 ----------

export interface CommentItem {
  id: string;
  workId?: string | null;
  chapterId?: string | null;
  author: Author;
  content: string;
  parentId?: string | null;
  likes: number;
  liked?: boolean;
  createdAt: string;
  replies?: CommentItem[];
}

// ---------- 通知 / 私信 ----------

export type NotificationType =
  | "like"
  | "comment"
  | "collect"
  | "follow"
  | "ai"
  | "official";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor?: Author;
  content?: string;
  workTitle?: string;
  /** 关联作品 / 用户，用于点击跳转 */
  workId?: string | null;
  authorId?: string | null;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  user: Author;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export type ChatMessageType = "text" | "image" | "gif" | "emoji" | "work";

export interface ChatMessage {
  id: string;
  from: "me" | "other";
  type: ChatMessageType;
  content: string;
  workId?: string | null;
  createdAt: string;
}

// ---------- 书架 ----------

export interface ShelfItem {
  work: Work;
  /** 阅读进度 0-1 */
  progress: number;
  lastChapterOrder: number;
  lastReadAt: string;
}

/** 阅读划线（用户对章节内具体文字的选择标记，持久化到数据库） */
export interface Highlight {
  id: string;
  workId: string;
  chapterOrder: number;
  text: string;
  createdAt: string;
}

// ---------- 发现 / 搜索 ----------

export interface HotTopic {
  id: string;
  title: string;
  heat: number;
  trend: "up" | "down" | "flat";
}

export interface Tag {
  id: string;
  name: string;
}

export interface SearchResult {
  works: Work[];
  authors: Author[];
  tags: Tag[];
}

// ---------- 草稿 / AI 采访 / 人生事件 ----------

export interface Draft {
  id: string;
  title: string;
  summary?: string;
  /** 编辑器中已保存的正文（纯文本/块序列化） */
  content?: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
}

/** Life Context：AI 采访中实时抽取的人生要素 */
export interface LifeContext {
  people: string[];
  locations: string[];
  times: string[];
  events: string[];
  relationships: string[];
  emotions: string[];
  objects: string[];
}

export interface AiConversation {
  id: string;
  topic?: string | null;
  currentStep: number;
  status: "ACTIVE" | "COMPLETED";
  updatedAt: string;
}

export interface AiConversationDetail extends AiConversation {
  storyContext: LifeContext;
  messages: AiMessage[];
}

export interface LifeEvent {
  id: string;
  year: string;
  title: string;
  description?: string;
  chapterOrder?: number;
}
