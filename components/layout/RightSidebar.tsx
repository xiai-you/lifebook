"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import {
  getHotTopics,
  getRecommendedAuthors,
  getHotTags,
  getHotWorks,
  getAllWorks,
} from "@/lib/api";
import { HotTopics } from "@/components/shared/HotTopics";
import { RecommendedAuthors } from "@/components/shared/RecommendedAuthors";
import { TagCloud } from "@/components/shared/TagCloud";
import { CoverImage } from "@/components/shared/CoverImage";
import { categories } from "@/lib/constants/categories";
import { formatCount } from "@/lib/utils";
import type { Work } from "@/types";

/**
 * 右侧上下文栏（桌面 ≥1280px）—— Art Direction 2.0：随页面变化。
 * 首页：今日趋势 + 热门故事 + 推荐作者；发现：热门分类 + 趋势标签；其余页面隐藏。
 */
export function RightSidebar() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const onDiscover = pathname === "/discover";

  const { data: topics } = useQuery({
    queryKey: ["hot-topics"],
    queryFn: getHotTopics,
    enabled: onHome,
  });
  const { data: authors } = useQuery({
    queryKey: ["recommended-authors"],
    queryFn: getRecommendedAuthors,
    enabled: onHome,
  });
  const { data: hotWorks } = useQuery({
    queryKey: ["hot-works-side"],
    queryFn: () => getHotWorks(1),
    enabled: onHome,
  });
  const { data: tags } = useQuery({
    queryKey: ["hot-tags"],
    queryFn: getHotTags,
    enabled: onDiscover,
  });
  const { data: allWorks } = useQuery({
    queryKey: ["all-works"],
    queryFn: getAllWorks,
    enabled: onDiscover,
  });

  if (!onHome && !onDiscover) return null;

  return (
    <aside className="thin-scrollbar sticky top-0 hidden h-screen w-[300px] shrink-0 flex-col gap-7 overflow-y-auto py-6 pl-4 xl:flex">
      {onHome && (
        <>
          <HotTopics topics={topics ?? []} />
          <HotStories works={(hotWorks?.list ?? []).slice(0, 5)} />
          <RecommendedAuthors authors={authors ?? []} />
        </>
      )}
      {onDiscover && (
        <>
          <CategoryCloud works={allWorks ?? []} />
          <TagCloud tags={tags ?? []} />
        </>
      )}
    </aside>
  );
}

function HotStories({ works }: { works: Work[] }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Flame className="h-4 w-4 text-accent" /> 热门故事
      </h3>
      <div className="flex flex-col gap-2">
        {works.map((w) => (
          <Link
            key={w.id}
            href={`/story/${w.id}`}
            className="group flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-hover"
          >
            <div className="w-12 shrink-0">
              <CoverImage title={w.title} ratio="3:4" photo={w.coverImage} showTitle={false} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
                {w.title}
              </p>
              <p className="mt-0.5 text-xs text-subtle">
                {formatCount(w.viewCount)} 阅读 · {formatCount(w.resonateCount)} 共鸣
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CategoryCloud({ works }: { works: Work[] }) {
  const counts = new Map<string, number>();
  for (const w of works) counts.set(w.categoryL1, (counts.get(w.categoryL1) ?? 0) + 1);

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-foreground">热门分类</h3>
      <div className="flex flex-col gap-1.5">
        {categories
          .filter((c) => (counts.get(c.id) ?? 0) > 0)
          .slice(0, 8)
          .map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-hover"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${c.color}1A`, color: c.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm text-foreground">{c.name}</span>
                <span className="text-xs text-subtle">{counts.get(c.id)}</span>
              </Link>
            );
          })}
      </div>
    </section>
  );
}
