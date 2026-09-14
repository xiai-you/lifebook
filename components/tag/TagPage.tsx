"use client";

import { useQuery } from "@tanstack/react-query";
import { Hash } from "lucide-react";
import { getWorksByTag, getHotTags } from "@/lib/api";
import { WorkMasonry } from "@/components/work/WorkMasonry";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

/** 标签页 —— #标签 下所有相关故事 + 相关标签。 */
export function TagPage({ tag }: { tag: string }) {
  const { data: works, isLoading } = useQuery({
    queryKey: ["tag-works", tag],
    queryFn: () => getWorksByTag(tag),
  });
  const { data: hotTags } = useQuery({ queryKey: ["hot-tags"], queryFn: getHotTags });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Hash className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">#{tag}</h1>
          <p className="mt-0.5 text-sm text-muted">{works?.length ?? 0} 个真实故事</p>
        </div>
      </div>

      {/* 相关标签 */}
      {(hotTags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(hotTags ?? [])
            .filter((t) => t.name !== tag)
            .slice(0, 8)
            .map((t) => (
              <Link
                key={t.id}
                href={`/tag/${encodeURIComponent(t.name)}`}
                className="rounded-full bg-hover px-3 py-1 text-sm text-muted transition-colors hover:bg-primary hover:text-inverse"
              >
                #{t.name}
              </Link>
            ))}
        </div>
      )}

      {isLoading ? (
        <div className="columns-2 gap-4 md:columns-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      ) : (works ?? []).length === 0 ? (
        <EmptyState title={`还没有 #${tag} 的故事`} description="换个标签试试，或成为第一个写下它的人" />
      ) : (
        <WorkMasonry works={works ?? []} />
      )}
    </div>
  );
}
