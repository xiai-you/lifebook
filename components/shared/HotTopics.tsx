import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatCount } from "@/lib/utils";
import type { HotTopic } from "@/types";

/** 热门话题 Top 10（右侧栏）—— 点击进入对应话题搜索结果 */
export function HotTopics({ topics }: { topics: HotTopic[] }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-foreground">今日趋势</h3>
      <ol className="flex flex-col gap-0.5">
        {topics.map((t, i) => (
          <li key={t.id}>
            <Link
              href={`/search?q=${encodeURIComponent(t.title)}`}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-hover"
            >
              <span
                className={cn(
                  "w-4 shrink-0 text-center text-sm font-bold",
                  i < 3 ? "text-accent" : "text-subtle"
                )}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {t.title}
              </span>
              {t.trend === "up" && (
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-accent" />
              )}
              {t.trend === "down" && (
                <TrendingDown className="h-3.5 w-3.5 shrink-0 text-success" />
              )}
              {t.trend === "flat" && (
                <Minus className="h-3.5 w-3.5 shrink-0 text-subtle" />
              )}
              <span className="shrink-0 text-xs text-subtle">
                {formatCount(t.heat)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
