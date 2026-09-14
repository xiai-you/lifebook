"use client";

import { create } from "zustand";

/**
 * 全局客户端状态 —— 让「点赞 / 收藏 / 共鸣 / 关注 / 阅读进度 / 草稿 / 已读」真实可交互、
 * 并在全站（首页 / 详情 / 书架 / 我的）保持同步。
 * 当前为内存态（Mock 阶段）；接入真实后端后由 API 缓存层接管，组件调用方式不变。
 */

export interface Draft {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  updatedAt: string;
}

export interface ReadingProgress {
  workId: string;
  chapterOrder: number;
  chapterCount: number;
  lastReadAt: string;
}

interface AppState {
  // 我的互动
  likedWorkIds: string[];
  collectedWorkIds: string[];
  resonatedWorkIds: string[];
  followedAuthorIds: string[];
  likedCommentIds: string[];
  bookmarkedChapters: string[];
  // 互动计数缓存（后端返回的权威计数，用于全站即时刷新）
  likeCounts: Record<string, number>;
  collectCounts: Record<string, number>;
  resonateCounts: Record<string, number>;
  // 互动状态是否已从后端回填（登录/刷新后置 true；未回填前，关注按钮可用 props 的 followedBase 兜底）
  interactionsHydrated: boolean;
  // 通知已读
  readNotificationIds: string[];
  // 阅读进度
  readingHistory: ReadingProgress[];
  // 草稿
  drafts: Draft[];

  toggleLike: (id: string) => void;
  toggleCollect: (id: string) => void;
  toggleResonate: (id: string) => void;
  toggleFollow: (id: string) => void;
  toggleCommentLike: (id: string) => void;
  setLiked: (id: string, active: boolean) => void;
  setCollected: (id: string, active: boolean) => void;
  setResonated: (id: string, active: boolean) => void;
  setFollowed: (id: string, active: boolean) => void;
  setLikeCount: (id: string, count: number) => void;
  setCollectCount: (id: string, count: number) => void;
  setResonateCount: (id: string, count: number) => void;
  toggleBookmark: (workId: string, chapterOrder: number) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (ids: string[]) => void;
  recordReading: (workId: string, chapterOrder: number, chapterCount: number) => void;
  upsertDraft: (draft: Draft) => void;
  removeDraft: (id: string) => void;
  hydrate: (s: Partial<Pick<AppState, "likedWorkIds" | "collectedWorkIds" | "resonatedWorkIds" | "followedAuthorIds" | "likedCommentIds" | "bookmarkedChapters">>) => void;
  reset: () => void;
}

function toggleIn(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

/** 按后端权威状态设置集合成员（幂等）。 */
function setIn(arr: string[], id: string, active: boolean): string[] {
  const has = arr.includes(id);
  if (active && !has) return [...arr, id];
  if (!active && has) return arr.filter((x) => x !== id);
  return arr;
}

export const useAppStore = create<AppState>((set) => ({
  likedWorkIds: [],
  collectedWorkIds: [],
  resonatedWorkIds: [],
  followedAuthorIds: [],
  likedCommentIds: [],
  bookmarkedChapters: [],
  likeCounts: {},
  collectCounts: {},
  resonateCounts: {},
  interactionsHydrated: false,
  readNotificationIds: [],
  readingHistory: [],
  drafts: [],

  toggleLike: (id) => set((s) => ({ likedWorkIds: toggleIn(s.likedWorkIds, id) })),
  toggleCollect: (id) => set((s) => ({ collectedWorkIds: toggleIn(s.collectedWorkIds, id) })),
  toggleResonate: (id) => set((s) => ({ resonatedWorkIds: toggleIn(s.resonatedWorkIds, id) })),
  toggleFollow: (id) => set((s) => ({ followedAuthorIds: toggleIn(s.followedAuthorIds, id) })),
  toggleCommentLike: (id) => set((s) => ({ likedCommentIds: toggleIn(s.likedCommentIds, id) })),
  setLiked: (id, active) => set((s) => ({ likedWorkIds: setIn(s.likedWorkIds, id, active) })),
  setCollected: (id, active) => set((s) => ({ collectedWorkIds: setIn(s.collectedWorkIds, id, active) })),
  setResonated: (id, active) => set((s) => ({ resonatedWorkIds: setIn(s.resonatedWorkIds, id, active) })),
  setFollowed: (id, active) => set((s) => ({ followedAuthorIds: setIn(s.followedAuthorIds, id, active) })),
  setLikeCount: (id, count) => set((s) => ({ likeCounts: { ...s.likeCounts, [id]: count } })),
  setCollectCount: (id, count) => set((s) => ({ collectCounts: { ...s.collectCounts, [id]: count } })),
  setResonateCount: (id, count) => set((s) => ({ resonateCounts: { ...s.resonateCounts, [id]: count } })),
  toggleBookmark: (workId, chapterOrder) =>
    set((s) => ({ bookmarkedChapters: toggleIn(s.bookmarkedChapters, `${workId}:${chapterOrder}`) })),
  markNotificationRead: (id) =>
    set((s) =>
      s.readNotificationIds.includes(id)
        ? s
        : { readNotificationIds: [...s.readNotificationIds, id] }
    ),
  markAllNotificationsRead: (ids) =>
    set((s) => ({ readNotificationIds: Array.from(new Set([...s.readNotificationIds, ...ids])) })),
  recordReading: (workId, chapterOrder, chapterCount) =>
    set((s) => {
      const lastReadAt = new Date().toISOString().slice(0, 10);
      const rest = s.readingHistory.filter((h) => h.workId !== workId);
      return {
        readingHistory: [
          { workId, chapterOrder, chapterCount, lastReadAt },
          ...rest,
        ],
      };
    }),
  upsertDraft: (draft) =>
    set((s) => {
      const rest = s.drafts.filter((d) => d.id !== draft.id);
      return { drafts: [draft, ...rest] };
    }),
  removeDraft: (id) => set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) })),

  /** 从后端回填当前用户的互动状态（点赞/收藏/共鸣/关注）。 */
  hydrate: (s) =>
    set((state) => ({
      likedWorkIds: s.likedWorkIds ?? state.likedWorkIds,
      collectedWorkIds: s.collectedWorkIds ?? state.collectedWorkIds,
      resonatedWorkIds: s.resonatedWorkIds ?? state.resonatedWorkIds,
      followedAuthorIds: s.followedAuthorIds ?? state.followedAuthorIds,
      likedCommentIds: s.likedCommentIds ?? state.likedCommentIds,
      bookmarkedChapters: s.bookmarkedChapters ?? state.bookmarkedChapters,
      interactionsHydrated: true,
    })),

  /** 登出时清空，避免跨账号残留。 */
  reset: () =>
    set({
      likedWorkIds: [],
      collectedWorkIds: [],
      resonatedWorkIds: [],
      followedAuthorIds: [],
      likedCommentIds: [],
      bookmarkedChapters: [],
      likeCounts: {},
      collectCounts: {},
      resonateCounts: {},
      interactionsHydrated: false,
      readNotificationIds: [],
      readingHistory: [],
      drafts: [],
    }),
}));

/** 派生选择器（组件内按需取用） */
export const selectIsLiked = (id: string) => (s: AppState) => s.likedWorkIds.includes(id);
export const selectIsCollected = (id: string) => (s: AppState) => s.collectedWorkIds.includes(id);
export const selectIsResonated = (id: string) => (s: AppState) => s.resonatedWorkIds.includes(id);
export const selectIsFollowed = (id: string) => (s: AppState) => s.followedAuthorIds.includes(id);
export const selectInteractionsHydrated = (s: AppState) => s.interactionsHydrated;
export const selectIsCommentLiked = (id: string) => (s: AppState) => s.likedCommentIds.includes(id);
export const selectIsBookmarked = (workId: string, chapterOrder: number) => (s: AppState) =>
  s.bookmarkedChapters.includes(`${workId}:${chapterOrder}`);
