import type { StoryFormat, StorySource } from "@/types";

/** 内容形式 → 中文标签 */
export const FORMAT_LABELS: Record<StoryFormat, string> = {
  MEMOIR: "人生故事",
  DIARY: "日记",
  LETTER: "书信",
  PHOTO_STORY: "图文故事",
  SHORT_STORY: "短篇",
  LONG_STORY: "长篇",
  SERIAL: "连载",
  LIFE_FRAGMENT: "人生片段",
  TRAVEL_LOG: "旅行记录",
  ORAL_HISTORY: "口述人生",
};

/** 真实来源 → 中文标签（说明 AI 与真实人生的边界） */
export const SOURCE_LABELS: Record<StorySource, string> = {
  AUTHOR_WRITTEN: "作者本人撰写",
  ORAL_TRANSCRIPT: "根据作者口述整理",
  AI_ASSISTED: "AI 辅助整理",
  AUTHOR_PHOTO: "作者提供的照片",
};

export function formatLabel(format?: StoryFormat): string {
  return format ? FORMAT_LABELS[format] ?? format : "人生故事";
}

export function sourceLabel(source?: StorySource): string {
  return source ? SOURCE_LABELS[source] ?? source : "作者本人撰写";
}
