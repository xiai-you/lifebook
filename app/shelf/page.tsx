"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllWorks, getCollections, getShelf } from "@/lib/api";
import { useAppStore } from "@/lib/store/useAppStore";
import { CoverImage } from "@/components/shared/CoverImage";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryById } from "@/lib/constants/categories";
import type { Work } from "@/types";

/** 书架 —— 继续阅读（真实进度）/ 收藏 / 阅读历史。 */

const TABS = [
  { key: "reading", label: "继续阅读" },
  { key: "collections", label: "收藏" },
  { key: "history", label: "阅读历史" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ShelfPage() {
  const [tab, setTab] = useState<TabKey>("reading");
  const readingHistory = useAppStore((s) => s.readingHistory);
  const collectedIds = useAppStore((s) => s.collectedWorkIds);

  const { data: shelf, isLoading } = useQuery({ queryKey: ["shelf"], queryFn: getShelf });
  const { data: works } = useQuery({ queryKey: ["all-works"], queryFn: getAllWorks });
  const { data: collections } = useQuery({ queryKey: ["collections"], queryFn: getCollections });

  const workMap = new Map((works ?? []).map((w) => [w.id, w]));

  // 后端持久化的阅读进度
  const shelfReading = (shelf ?? []).map((s) => ({
    work: s.work,
    progress: s.progress,
    chapter: s.lastChapterOrder,
    lastReadAt: s.lastReadAt,
  }));

  // 当前会话的阅读进度（叠加在后端之上）
  const sessionReading = readingHistory
    .map((h) => ({ work: workMap.get(h.workId), progress: h.chapterOrder / Math.max(1, h.chapterCount), chapter: h.chapterOrder, lastReadAt: h.lastReadAt }))
    .filter((x): x is { work: Work; progress: number; chapter: number; lastReadAt: string } => Boolean(x.work));

  const readingWorks = [
    ...sessionReading,
    ...shelfReading.filter((b) => !sessionReading.some((s) => s.work.id === b.work.id)),
  ];

  const unreadHistory = readingWorks.filter((x) => x.progress < 1);
  const baseCollections = (collections ?? []).map((c) => c.work);
  const extraCollected = collectedIds.map((id) => workMap.get(id)).filter((w): w is Work => Boolean(w));
  const collectedWorks = [...extraCollected, ...baseCollections].filter((w, i, arr) => arr.findIndex((x) => x.id === w.id) === i);

  const items =
    tab === "reading" ? unreadHistory : tab === "collections" ? collectedWorks : readingWorks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">书架</h1>
        <p className="mt-0.5 text-sm text-muted">继续你的阅读，收藏心动的人生故事</p>
      </div>

      <div className="flex gap-6 border-b border-divider">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("relative py-2.5 text-sm transition-colors", tab === t.key ? "font-semibold text-foreground" : "text-muted hover:text-foreground")}>
            {t.label}
            {tab === t.key && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-20 w-32 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-2 py-1"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-2 w-full" /></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={tab === "collections" ? "还没有收藏" : "书架空空如也"}
          description={tab === "reading" ? "你的故事还在等你，去发现页开始一段阅读吧" : "去发现页找找打动你的故事吧"}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isReading = tab === "reading" || tab === "history";
            const work = "work" in item ? item.work : item;
            const progress = "progress" in item ? item.progress : 0;
            const chapter = "chapter" in item ? item.chapter : 0;
            const lastReadAt = "lastReadAt" in item ? item.lastReadAt : "";
            return (
              <ShelfCard key={work.id} work={work} showProgress={isReading} progress={progress} chapter={chapter} lastReadAt={lastReadAt} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ShelfCard({
  work,
  showProgress,
  progress,
  chapter,
  lastReadAt,
}: {
  work: Work;
  showProgress: boolean;
  progress: number;
  chapter: number;
  lastReadAt: string;
}) {
  const category = getCategoryById(work.categoryL1);
  return (
    <Link href={`/story/${work.id}`} className="group flex gap-3 rounded-2xl bg-card/80 p-3 ring-1 ring-white/60 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md dark:ring-white/10">
      <div className="w-28 shrink-0 sm:w-32">
        <CoverImage title={work.title} color={work.coverColor ?? category?.color} ratio="16:9" photo={work.coverImage} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">{work.title}</h3>
        <p className="mt-1 truncate text-xs text-muted">{work.author.nickname}</p>

        {showProgress && progress > 0 && (
          <>
            <div className="mt-auto flex items-center gap-2 text-xs text-subtle">
              <span className="tabular-nums">{Math.round(progress * 100)}%</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-hover">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-subtle">
              <Clock className="h-3 w-3" /> 读到第 {chapter} 章 · {lastReadAt}
            </p>
          </>
        )}

        {showProgress && progress >= 1 && <p className="mt-auto text-xs text-success">已读完</p>}

        {!showProgress && (
          <span className="mt-auto flex items-center gap-1 text-xs text-subtle">
            <Play className="h-3 w-3" /> {work.readMinutes} 分钟
          </span>
        )}

        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {progress > 0 && progress < 1 ? "继续阅读" : progress >= 1 ? "再读一遍" : "开始阅读"}
        </span>
      </div>
    </Link>
  );
}
