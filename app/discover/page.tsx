"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getAllWorks } from "@/lib/api";
import { categories, discoverTags } from "@/lib/constants/categories";
import { photoFor } from "@/lib/photos";
import { WorkMasonry } from "@/components/work/WorkMasonry";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

/** 发现页 ——「人生探索地图」：热门标签 + 人生主题（照片/气质文案/故事数）+ 瀑布流。 */

const SPECIAL_TAGS = new Set(["今日热门", "新发布", "编辑推荐", "真人故事"]);

/** 分类气质文案（生活感，而非干巴巴的分类名） */
const CATEGORY_MOODS: Record<string, string> = {
  growth: "后来我终于成为了自己",
  love: "那些没有说出口的话",
  family: "我们这一代人与父母",
  career: "凌晨两点的办公室",
  school: "青春是一场下过的大雨",
  city: "一个人生活在陌生城市",
  mind: "和自己的情绪好好相处",
  health: "身体与心灵的康复之路",
  travel: "在路上，遇见远方和自己",
  hobby: "热爱让生活发光",
  society: "在人间，看见彼此",
  culture: "正在消失的故乡与手艺",
  special: "那些改写人生的瞬间",
};

export default function DiscoverPage() {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: works, isLoading } = useQuery({ queryKey: ["all-works"], queryFn: getAllWorks });

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of works ?? []) m.set(w.categoryL1, (m.get(w.categoryL1) ?? 0) + 1);
    return m;
  }, [works]);

  const filtered = useMemo(() => {
    let list = [...(works ?? [])];
    if (activeTag && !SPECIAL_TAGS.has(activeTag)) {
      list = list.filter((w) => w.tags.includes(activeTag) || w.emotion === activeTag);
    } else if (activeTag === "今日热门") {
      list.sort((a, b) => b.viewCount - a.viewCount);
    } else if (activeTag === "新发布") {
      list.sort((a, b) => (b.publishAt ?? "").localeCompare(a.publishAt ?? ""));
    } else if (activeTag === "编辑推荐") {
      list.sort((a, b) => b.resonateCount - a.resonateCount);
    }
    return list;
  }, [works, activeTag]);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">探索</h1>
        <p className="mt-1 text-sm text-muted">按主题、地点、职业、人生阶段，找到你原本不会主动寻找的人生。</p>
      </div>

      {/* 热门标签 */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {discoverTags.slice(0, 12).map((tag) => {
          const active = activeTag === tag;
          return (
            <button key={tag} onClick={() => setActiveTag((p) => (p === tag ? null : tag))} className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors", active ? "bg-primary font-medium text-inverse" : "bg-hover text-muted hover:text-foreground")}>
              {tag}
            </button>
          );
        })}
      </div>

      {/* 人生主题 */}
      {!activeTag && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">人生主题</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const photo = photoFor({ id: cat.id, categoryL1: cat.id, emotion: null, tags: [] });
              return (
                <Link key={cat.id} href={`/category/${cat.id}`} className="group relative overflow-hidden rounded-2xl">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={cat.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                        <Icon className="h-4 w-4" style={{ color: cat.color }} /> {cat.name}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-white/80">{CATEGORY_MOODS[cat.id] ?? ""}</p>
                      <p className="mt-0.5 text-[11px] text-white/60">{counts.get(cat.id) ?? 0} 个故事</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 筛选结果 */}
      {activeTag && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            {activeTag} <span className="ml-2 text-xs font-normal text-subtle">{filtered.length} 个故事</span>
          </h2>
          {isLoading ? (
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <EmptyState title="该主题下暂无内容" description="换个主题试试吧" />
          ) : (
            <WorkMasonry works={filtered} />
          )}
        </section>
      )}
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
