"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MapPin, MessageCircle, Share2, Check, CalendarDays } from "lucide-react";
import { cn, formatCount } from "@/lib/utils";
import { getAuthorById, getAuthorWorks } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { WorkMasonry } from "@/components/work/WorkMasonry";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowButton } from "@/components/shared/StoryActions";

/**
 * 用户主页 —— 社交平台式真实主页：头像 / 简介 / 数据 / 关注·私信 / 作品 / 人生时间轴。
 */
export function UserProfile({ authorId }: { authorId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"works" | "timeline">("works");
  const [copied, setCopied] = useState(false);

  const { data: author, isLoading } = useQuery({
    queryKey: ["author", authorId],
    queryFn: () => getAuthorById(authorId),
  });
  const { data: works } = useQuery({
    queryKey: ["author-works", authorId],
    queryFn: () => getAuthorWorks(authorId),
  });

  if (isLoading) return <ProfileSkeleton />;
  if (!author) return <EmptyState title="用户不存在" description="这个账号可能已经离开，或链接有误" />;

  const totalLikes = (works ?? []).reduce((s, w) => s + w.likeCount, 0);
  const timeline = [...(works ?? [])].sort((a, b) =>
    (b.publishAt ?? "").localeCompare(a.publishAt ?? "")
  );

  function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      {/* 顶部横幅（真实背景图，无则渐变兜底） */}
      <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#6a8cf5] via-[#8a7bf0] to-[#b48be0] sm:h-44">
        {author.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.coverImage} alt="主页背景" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 70% 20%, #fff 0%, transparent 55%)" }} />
        <div className="grain absolute inset-0 opacity-30" />
      </div>

      <div className="-mt-12 px-2">
        <div className="flex items-end justify-between">
          <Avatar name={author.nickname} src={author.avatar} size="xl" className="h-24 w-24 text-3xl ring-4 ring-background" />
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => router.push("/messages")}
              className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground ring-1 ring-divider transition-colors hover:bg-hover"
            >
              <MessageCircle className="h-4 w-4" /> 私信
            </button>
            <FollowButton authorId={authorId} followedBase={author.followed} />
            <button
              onClick={share}
              aria-label="分享"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-muted ring-1 ring-divider transition-colors hover:bg-hover"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <h1 className="mt-3 font-serif text-2xl font-bold text-foreground">{author.nickname}</h1>
        {author.bio && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">{author.bio}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
          {(author.region || author.country) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {[author.region, author.country].filter(Boolean).join(" · ")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> 已写下 {author.workCount ?? works?.length ?? 0} 篇故事
          </span>
          {author.tags?.map((t) => (
            <Link key={t} href={`/tag/${encodeURIComponent(t)}`} className="rounded-full bg-hover px-2.5 py-0.5 text-subtle transition-colors hover:text-primary">
              {t}
            </Link>
          ))}
        </div>

        {/* 数据条 */}
        <div className="mt-4 flex items-center gap-6 border-y border-divider py-3 text-sm">
          <button className="transition-colors hover:text-primary">
            <span className="font-semibold text-foreground tabular-nums">{formatCount(author.fansCount ?? 0)}</span>{" "}
            <span className="text-muted">粉丝</span>
          </button>
          <button className="transition-colors hover:text-primary">
            <span className="font-semibold text-foreground tabular-nums">{formatCount(author.workCount ?? 0)}</span>{" "}
            <span className="text-muted">作品</span>
          </button>
          <button className="transition-colors hover:text-primary">
            <span className="font-semibold text-foreground tabular-nums">{formatCount(totalLikes)}</span>{" "}
            <span className="text-muted">获赞</span>
          </button>
        </div>

        {/* Tab */}
        <div className="mt-5 flex gap-6 border-b border-divider">
          {([["works", "作品"], ["timeline", "人生时间轴"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "relative py-2.5 text-sm transition-colors",
                tab === key ? "font-semibold text-foreground" : "text-muted hover:text-foreground"
              )}
            >
              {label}
              {tab === key && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        {/* 内容 */}
        <div className="py-4">
          {tab === "works" ? (
            (works ?? []).length === 0 ? (
              <EmptyState title="还没有作品" description="TA 的故事正在路上" />
            ) : (
              <WorkMasonry works={works ?? []} />
            )
          ) : (
            <div className="space-y-0">
              {timeline.map((w, i) => (
                <div key={w.id} className="relative flex gap-4 pb-6">
                  {/* 时间轴竖线 */}
                  <div className="flex flex-col items-center">
                    <span className="z-10 h-3 w-3 shrink-0 rounded-full bg-primary ring-4 ring-background" />
                    {i < timeline.length - 1 && <span className="w-px flex-1 bg-divider" />}
                  </div>
                  <Link href={`/story/${w.id}`} className="group min-w-0 flex-1 pb-1">
                    <p className="text-xs font-medium tabular-nums text-primary">
                      {w.publishAt?.slice(0, 4) ?? "—"}
                      {w.momentLabel ? ` · ${w.momentLabel}` : ""}
                    </p>
                    <p className="mt-0.5 font-serif text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                      {w.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{w.summary}</p>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="flex items-end gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
