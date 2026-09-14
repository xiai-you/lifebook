"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getAllWorks } from "@/lib/api";
import { getCategoryById } from "@/lib/constants/categories";
import { WorkMasonry } from "@/components/work/WorkMasonry";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

/** 分类页 —— 分类主题图 / 一句话气质描述 / 故事数量 / 二级筛选 / 瀑布流。 */
export function CategoryPage({ categoryId }: { categoryId: string }) {
  const category = getCategoryById(categoryId);
  const [sub, setSub] = useState<string | null>(null);

  const { data: works, isLoading } = useQuery({ queryKey: ["all-works"], queryFn: getAllWorks });

  const list = useMemo(() => {
    let l = (works ?? []).filter((w) => w.categoryL1 === categoryId);
    if (sub) l = l.filter((w) => w.categoryL2 === sub);
    return l;
  }, [works, categoryId, sub]);

  if (!category) {
    return <EmptyState title="分类不存在" description="这个分类可能已被移除" />;
  }
  const Icon = category.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${category.color}1A`, color: category.color }}
        >
          <Icon className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">{category.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {category.children.length} 个子主题 · {list.length} 个真实故事
          </p>
        </div>
      </div>

      {/* 二级分类 */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <button
          onClick={() => setSub(null)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors",
            sub === null ? "bg-primary font-medium text-inverse" : "bg-hover text-muted hover:text-foreground"
          )}
        >
          全部
        </button>
        {category.children.map((c) => (
          <button
            key={c.name}
            onClick={() => setSub((p) => (p === c.name ? null : c.name))}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors",
              sub === c.name ? "bg-primary font-medium text-inverse" : "bg-hover text-muted hover:text-foreground"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="columns-2 gap-4 md:columns-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState title="这个主题下还没有故事" description="去写下第一个吧" />
      ) : (
        <WorkMasonry works={list} />
      )}
    </div>
  );
}
