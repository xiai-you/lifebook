/**
 * 枚举常量 —— 因 SQLite 连接器不支持 Prisma enum，改为字符串常量 + 联合类型。
 * 取值保持与前端 types/index.ts 映射一致（数据库存大写，序列化层转小写）。
 */

export const Role = {
  USER: "USER",
  AUTHOR: "AUTHOR",
  EDITOR: "EDITOR",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
  SECRET: "SECRET",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const WorkStatus = {
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
} as const;
export type WorkStatus = (typeof WorkStatus)[keyof typeof WorkStatus];

export const WorkVisibility = {
  PUBLIC: "PUBLIC",
  FOLLOWERS: "FOLLOWERS",
  PRIVATE: "PRIVATE",
} as const;
export type WorkVisibility = (typeof WorkVisibility)[keyof typeof WorkVisibility];

export const CoverRatio = {
  RATIO_16_9: "RATIO_16_9",
  RATIO_3_4: "RATIO_3_4",
  RATIO_1_1: "RATIO_1_1",
} as const;
export type CoverRatio = (typeof CoverRatio)[keyof typeof CoverRatio];

export const NotificationType = {
  LIKE: "LIKE",
  COMMENT: "COMMENT",
  COLLECT: "COLLECT",
  FOLLOW: "FOLLOW",
  AI: "AI",
  OFFICIAL: "OFFICIAL",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const MessageType = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  GIF: "GIF",
  EMOJI: "EMOJI",
  WORK: "WORK",
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];
