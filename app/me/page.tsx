"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MapPin, CalendarDays, Settings, Feather, FileText, Trash2 } from "lucide-react";
import { cn, formatCount } from "@/lib/utils";
import { getCurrentUser, getAllWorks, getCollections, getDrafts, deleteDraft } from "@/lib/api";
import { useAppStore } from "@/lib/store/useAppStore";
import { Avatar } from "@/components/ui/avatar";
import { WorkMasonry } from "@/components/work/WorkMasonry";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

/** 个人主页（我的）—— 真实用户主页：头像 / 签名 / 数据 / 作品·草稿·收藏·人生时间轴。 */

const TABS = [
  { key: "works", label: "作品" },
  { key: "drafts", label: "草稿" },
  { key: "collections", label: "收藏" },
  { key: "timeline", label: "人生时间轴" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function MePage() {
  const [tab, setTab] = useState<TabKey>("works");
  const storeDrafts = useAppStore((s) => s.drafts);
  const removeDraft = useAppStore((s) => s.removeDraft);
  const { data: backendDrafts, isLoading: draftsLoading, isError: draftsError, refetch: refetchDrafts } = useQuery({ queryKey: ["drafts"], queryFn: getDrafts });

  // 合并：当前会话草稿 + 后端持久化草稿
  const drafts = [
    ...storeDrafts,
    ...(backendDrafts ?? []).map((d) => ({ id: d.id, title: d.title, summary: undefined, content: d.content ?? undefined, updatedAt: d.updatedAt })),
  ].filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i);

  const { data: user, isLoading: userLoading, isError: userError, refetch: refetchUser } = useQuery({ queryKey: ["me"], queryFn: getCurrentUser });
  const { data: works, isLoading: worksLoading, isError: worksError, refetch: refetchWorks } = useQuery({ queryKey: ["all-works"], queryFn: getAllWorks });
  const { data: collections, isLoading: collectionsLoading, isError: collectionsError, refetch: refetchCollections } = useQuery({ queryKey: ["collections"], queryFn: getCollections });

  const isError = userError || worksError || draftsError || collectionsError;
  const refetchAll = () => { refetchUser(); refetchWorks(); refetchDrafts(); refetchCollections(); };

  const myWorks = (works ?? []).filter((w) => w.authorId === user?.id);
  // 人生时间轴：以真实作品按「故事发生年份」升序排列（无年份的靠后）
  const lifeTimeline = [...myWorks].sort((a, b) => {
    const ay = a.year ?? a.publishAt?.slice(0, 4) ?? "9999";
    const by = b.year ?? b.publishAt?.slice(0, 4) ?? "9999";
    return ay.localeCompare(by);
  });
  const stats = user?.stats;
  const statItems = stats
    ? [
        { label: "粉丝", value: stats.followers },
        { label: "关注", value: stats.following },
        { label: "获赞", value: stats.likes },
        { label: "阅读量", value: stats.reads },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* 顶部横幅（真实背景图，无则渐变兜底） */}
      <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#6a8cf5] via-[#8a7bf0] to-[#b48be0] sm:h-44">
        {user?.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.coverImage} alt="主页背景" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 70% 20%, #fff 0%, transparent 55%)" }} />
        <div className="grain absolute inset-0 opacity-30" />
      </div>

      <div className="-mt-12 px-2">
        <div className="flex items-end justify-between">
          <Avatar name={user?.nickname ?? "我"} src={user?.avatar} size="xl" className="h-24 w-24 text-3xl ring-4 ring-background" />
          <div className="flex gap-2 pb-1">
            <Link
              href="/write"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#5b8def] via-[#7a6cf0] to-[#a06bf0] px-4 py-2 text-sm font-medium text-inverse shadow-glow-lg ring-1 ring-inset ring-white/25 transition-transform active:scale-[0.98]"
            >
              <Feather className="h-4 w-4" /> 开始写人生
            </Link>
            <Link href="/settings" aria-label="设置" className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-muted ring-1 ring-divider transition-colors hover:bg-hover hover:text-foreground">
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <h1 className="mt-3 font-serif text-2xl font-bold text-foreground">{user?.nickname ?? "我"}</h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">{user?.bio}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
          {user?.region && (
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.region}</span>
          )}
          {user?.createdDays && (
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />已创作 {user.createdDays} 天</span>
          )}
          {user?.tags?.map((t) => (
            <Link key={t} href={`/tag/${encodeURIComponent(t)}`} className="rounded-full bg-hover px-2.5 py-0.5 text-subtle transition-colors hover:text-primary">{t}</Link>
          ))}
        </div>

        {/* 数据条 */}
        <div className="mt-4 grid grid-cols-4 border-y border-divider py-3 text-center">
          {userLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-3 w-6" />
                </div>
              ))
            : statItems.map((s) => (
                <div key={s.label}>
                  <p className="text-base font-semibold tabular-nums text-foreground">{formatCount(s.value)}</p>
                  <p className="mt-0.5 text-xs text-subtle">{s.label}</p>
                </div>
              ))}
        </div>

        {/* Tab */}
        <div className="mt-5 flex gap-6 border-b border-divider">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={cn("relative py-2.5 text-sm transition-colors", active ? "font-semibold text-foreground" : "text-muted hover:text-foreground")}>
                {t.label}
                {active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>

        <div className="py-4">
          {isError ? (
            <ErrorState title="加载失败" description="个人主页数据暂时无法加载，请稍后重试" onRetry={refetchAll} />
          ) : (
            <>
              {tab === "works" && (worksLoading ? <SkeletonGrid /> : myWorks.length === 0 ? <EmptyState title="还没有作品" description="点击「开始写人生」，写下你的第一个故事" /> : <WorkMasonry works={myWorks} />)}

              {tab === "drafts" && (draftsLoading ? <SkeletonGrid /> : drafts.length === 0 ? (
                <EmptyState title="草稿箱是空的" description="去「人生故事工作室」开始你的第一篇" />
              ) : (
                <div className="space-y-2">
                  {drafts.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-divider transition-colors hover:bg-hover">
                      <FileText className="h-5 w-5 shrink-0 text-subtle" />
                      <Link href="/write" className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                        <p className="truncate text-xs text-subtle">{d.summary ?? "最后编辑于 " + d.updatedAt}</p>
                      </Link>
                      <button onClick={() => { removeDraft(d.id); deleteDraft(d.id).catch(() => {}); }} aria-label="删除草稿" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-subtle transition-colors hover:bg-danger/10 hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ))}

              {tab === "collections" && (collectionsLoading ? <SkeletonGrid /> : (collections ?? []).length === 0 ? <EmptyState title="还没有收藏" description="读到自己喜欢的作品就收藏起来吧" /> : <WorkMasonry works={(collections ?? []).map((c) => c.work)} />)}

              {tab === "timeline" && (
                lifeTimeline.length === 0 ? (
                  <EmptyState title="暂无人生事件" description="写下你的故事，它们会按时间排列在这里" />
                ) : (
                  <div>
                    {lifeTimeline.map((w, i) => (
                      <div key={w.id} className="relative flex gap-4 pb-6">
                        <div className="flex flex-col items-center">
                          <span className="z-10 h-3 w-3 shrink-0 rounded-full bg-primary ring-4 ring-background" />
                          {i < lifeTimeline.length - 1 && <span className="w-px flex-1 bg-divider" />}
                        </div>
                        <Link href={`/story/${w.id}`} className="group min-w-0 flex-1 pb-1">
                          <p className="text-xs font-medium tabular-nums text-primary">
                            {w.momentLabel ?? w.year ?? w.publishAt?.slice(0, 4) ?? "—"}
                          </p>
                          <p className="mt-0.5 font-serif text-base font-semibold text-foreground transition-colors group-hover:text-primary">{w.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{w.summary}</p>
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="columns-2 gap-4 md:columns-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="mb-4 aspect-[3/4] w-full rounded-2xl" />
      ))}
    </div>
  );
}
