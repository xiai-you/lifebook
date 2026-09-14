import Link from "next/link";
import type { Tag } from "@/types";

/** 热门标签云（右侧栏）—— 点击进入对应标签页 */
export function TagCloud({ tags }: { tags: Tag[] }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-foreground">趋势标签</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Link
            key={t.id}
            href={`/tag/${encodeURIComponent(t.name)}`}
            className="rounded-full bg-hover px-3 py-1 text-xs text-muted transition-colors hover:bg-primary hover:text-inverse"
          >
            #{t.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
