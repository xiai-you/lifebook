"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import { WorkCard } from "./WorkCard";
import { PhotoCard, EssayCard } from "@/components/home/StoryCards";
import { WorkCardSkeleton } from "./WorkCardSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  getRecommendWorks,
  getFollowWorks,
  getLatestWorks,
  getHotWorks,
} from "@/lib/api";
import type { Work } from "@/types";

/**
 * 首页生活流 —— Art Direction 2.0：像「一个有人生活在这里的数字世界」。
 * 顶部问候 + Tab（推荐/关注/最新/热门）+ 混合内容形态（照片故事 / 长文 / 小说）单列流 + 无限滚动。
 */

const TABS = [
  { key: "recommend", label: "推荐" },
  { key: "follow", label: "关注" },
  { key: "latest", label: "最新" },
  { key: "hot", label: "热门" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const fetcher: Record<
  TabKey,
  (page: number) => Promise<{ list: Work[]; hasMore: boolean }>
> = {
  recommend: getRecommendWorks,
  follow: getFollowWorks,
  latest: getLatestWorks,
  hot: getHotWorks,
};

function StoryCard({ work }: { work: Work }) {
  if (work.feedKind === "photo") return <PhotoCard work={work} />;
  if (work.feedKind === "essay") return <EssayCard work={work} />;
  return <WorkCard work={work} className="mb-0" />;
}

export function WorkFeed() {
  const [activeTab, setActiveTab] = useState<TabKey>("recommend");
  const [works, setWorks] = useState<Work[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error" | "auth">("loading");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loadingMoreRef = useRef(false);

  const { ref, inView } = useInView({ threshold: 0 });

  const load = useCallback(async (tab: TabKey) => {
    setStatus("loading");
    setPage(1);
    // 关注流需要登录：未登录直接给登录引导，不打接口
    if (tab === "follow" && useAuthStore.getState().status === "unauthenticated") {
      setStatus("auth");
      return;
    }
    try {
      const res = await fetcher[tab](1);
      setWorks(res.list);
      setHasMore(res.hasMore);
      setStatus("success");
    } catch (e) {
      // 401（未登录 / token 过期）→ 登录引导；其余才是网络/服务器错误
      setStatus(e instanceof ApiError && e.status === 401 ? "auth" : "error");
    }
  }, []);

  useEffect(() => {
    load(activeTab);
  }, [activeTab, load]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || status !== "success" || !hasMore) return;
    loadingMoreRef.current = true;
    const next = page + 1;
    try {
      const res = await fetcher[activeTab](next);
      setWorks((prev) => [...prev, ...res.list]);
      setHasMore(res.hasMore);
      setPage(next);
    } catch {
      // 加载更多失败：保留已有数据
    } finally {
      loadingMoreRef.current = false;
    }
  }, [activeTab, page, status, hasMore]);

  useEffect(() => {
    if (inView) loadMore();
  }, [inView, loadMore]);

  return (
    <div>
      {/* 问候语（编辑排版） */}
      <div className="mb-5">
        <h1 className="font-serif text-2xl font-bold leading-tight text-foreground sm:text-[28px]">
          今天
        </h1>
        <p className="mt-1 text-sm text-muted">
          看一些人最近在经历什么。
        </p>
      </div>

      {/* Tab 切换（下划线滑动） */}
      <div className="mb-5 flex gap-6 border-b border-divider">
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative py-3 text-sm transition-colors",
                active ? "font-semibold text-foreground" : "text-muted hover:text-foreground"
              )}
            >
              {tab.label}
              {active && (
                <motion.span
                  layoutId="feed-tab-underline"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* loading：骨架屏 */}
      {status === "loading" && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <WorkCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* error */}
      {status === "error" && <ErrorState onRetry={() => load(activeTab)} />}

      {/* auth：关注流未登录 */}
      {status === "auth" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm font-medium text-muted">登录后查看关注内容</p>
          <p className="text-xs text-subtle">关注你喜欢的作者，第一时间看到他们的新故事</p>
          <Link href="/login" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-inverse transition-colors hover:bg-primary-dark">去登录</Link>
        </div>
      )}

      {/* empty */}
      {status === "success" && works.length === 0 && (
        <EmptyState
          title="这里还很安静"
          description="去发现页看看，或者写下你自己的故事"
        />
      )}

      {/* 内容：单列混合生活流 */}
      {status === "success" && works.length > 0 && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {works.map((work, i) => (
            <motion.div
              key={work.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: (i % 5) * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              <StoryCard work={work} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* 无限滚动哨兵 */}
      {status === "success" && works.length > 0 && (
        <div ref={ref} className="flex items-center justify-center py-5 text-xs text-subtle">
          {hasMore ? "正在遇见更多的人生…" : "今天的故事，就先读到这里"}
        </div>
      )}
    </div>
  );
}
