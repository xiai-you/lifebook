"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, X, TrendingUp, MapPin } from "lucide-react";
import { cn, formatCount } from "@/lib/utils";
import { searchWorks, getHotTopics } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { WorkMasonry } from "@/components/work/WorkMasonry";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowButton } from "@/components/shared/StoryActions";
import type { Author } from "@/types";

/** 搜索 —— 综合 / 故事 / 作者 / 标签 / 城市 五个维度 + 历史 + 热搜。 */

const RESULT_TABS = [
  { key: "all", label: "综合" },
  { key: "works", label: "故事" },
  { key: "authors", label: "作者" },
  { key: "tags", label: "标签" },
  { key: "cities", label: "城市" },
] as const;

type TabKey = (typeof RESULT_TABS)[number]["key"];

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function SearchClient() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const debounced = useDebouncedValue(query, 300);
  const [tab, setTab] = useState<TabKey>("all");
  const [history, setHistory] = useState<string[]>([]);

  const { data: hotTopics, isLoading: hotLoading } = useQuery({ queryKey: ["hot-topics"], queryFn: getHotTopics });
  const { data: result, isFetching, isError, refetch } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchWorks(debounced),
    enabled: debounced.trim().length > 0,
  });

  const cities = useMemo(() => {
    const set = new Map<string, number>();
    for (const w of result?.works ?? []) {
      if (w.city) set.set(w.city, (set.get(w.city) ?? 0) + 1);
    }
    return Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
  }, [result]);

  const showing = debounced.trim().length > 0;

  function submit(q: string) {
    const v = q.trim();
    if (!v) return;
    setQuery(v);
    setHistory((h) => [v, ...h.filter((x) => x !== v)].slice(0, 8));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); submit(query); }} className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜故事、人物、标签、城市、情绪…"
          className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        {query && (
          <button type="button" aria-label="清空" onClick={() => setQuery("")} className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-subtle hover:bg-hover">
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {!showing && (
        <div className="space-y-6">
          {history.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">搜索历史</h2>
                <button onClick={() => setHistory([])} className="text-xs text-subtle hover:text-primary">清空</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <button key={h} onClick={() => setQuery(h)} className="rounded-full bg-hover px-3 py-1 text-sm text-muted transition-colors hover:bg-primary/10 hover:text-primary">{h}</button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground"><TrendingUp className="h-4 w-4 text-accent" />热搜榜</h2>
            <ol className="flex flex-col gap-1">
              {hotLoading && Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <Skeleton className="h-3 w-4" />
                  <Skeleton className="h-3 flex-1" />
                </li>
              ))}
              {!hotLoading && (hotTopics ?? []).slice(0, 10).map((t, i) => (
                <li key={t.id}>
                  <button onClick={() => setQuery(t.title)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-hover">
                    <span className={cn("w-4 text-center text-sm font-bold", i < 3 ? "text-accent" : "text-subtle")}>{i + 1}</span>
                    <span className="flex-1 truncate text-sm text-foreground">{t.title}</span>
                    <span className="text-xs text-subtle">{formatCount(t.heat)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      {showing && (
        <div>
          <div className="mb-4 flex gap-6 border-b border-divider">
            {RESULT_TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={cn("relative py-2.5 text-sm transition-colors", tab === t.key ? "font-semibold text-foreground" : "text-muted hover:text-foreground")}>
                {t.label}
                {tab === t.key && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>

          {isError ? (
            <ErrorState title="搜索失败" description="搜索服务暂时不可用，请稍后重试" onRetry={() => refetch()} />
          ) : isFetching ? (
            <p className="py-10 text-center text-sm text-subtle">搜索中…</p>
          ) : !result ? (
            <EmptyState title="输入关键词开始搜索" />
          ) : tab === "all" ? (
            <div className="space-y-6">
              {result.authors.length > 0 && (
                <div className="space-y-2">
                  {result.authors.slice(0, 3).map((a) => <AuthorRow key={a.id} author={a} />)}
                </div>
              )}
              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.tags.slice(0, 8).map((t) => (
                    <Link key={t.id} href={`/tag/${encodeURIComponent(t.name)}`} className="rounded-full bg-hover px-3 py-1.5 text-sm text-muted transition-colors hover:bg-primary hover:text-inverse">#{t.name}</Link>
                  ))}
                </div>
              )}
              {result.works.length > 0 && (
                <>
                  <p className="text-xs text-subtle">找到 {result.works.length} 个相关故事</p>
                  <WorkMasonry works={result.works.slice(0, 9)} />
                </>
              )}
              {result.works.length === 0 && result.authors.length === 0 && result.tags.length === 0 && (
                <EmptyState title="没有找到相关内容" description="换个关键词试试吧" />
              )}
            </div>
          ) : tab === "works" ? (
            result.works.length === 0 ? <EmptyState title="没有找到相关故事" description="换个关键词试试吧" /> : <WorkMasonry works={result.works} />
          ) : tab === "authors" ? (
            result.authors.length === 0 ? <EmptyState title="没有找到相关作者" /> : (
              <div className="space-y-2">{result.authors.map((a) => <AuthorRow key={a.id} author={a} />)}</div>
            )
          ) : tab === "tags" ? (
            result.tags.length === 0 ? <EmptyState title="没有找到相关标签" /> : (
              <div className="flex flex-wrap gap-2">
                {result.tags.map((t) => (
                  <Link key={t.id} href={`/tag/${encodeURIComponent(t.name)}`} className="rounded-full bg-hover px-3 py-1.5 text-sm text-muted transition-colors hover:bg-primary hover:text-inverse">#{t.name}</Link>
                ))}
              </div>
            )
          ) : cities.length === 0 ? (
            <EmptyState title="没有找到相关城市" description="试试输入一个城市名" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {cities.map(([city, count]) => (
                <Link key={city} href={`/search?q=${encodeURIComponent(city)}`} className="flex items-center gap-1.5 rounded-full bg-hover px-3 py-1.5 text-sm text-muted transition-colors hover:bg-primary hover:text-inverse">
                  <MapPin className="h-3.5 w-3.5" /> {city} · {count}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AuthorRow({ author }: { author: Author }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-divider">
      <Link href={`/user/${author.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={author.nickname} src={author.avatar} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{author.nickname}</p>
          <p className="truncate text-xs text-subtle">
            {[author.tags?.join(" · "), author.region].filter(Boolean).join(" · ")}
          </p>
        </div>
      </Link>
      <FollowButton authorId={author.id} followedBase={author.followed} size="sm" />
    </div>
  );
}
