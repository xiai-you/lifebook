"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Author } from "@/types";

/** 推荐作者（右侧栏）—— 文档 4.2 页面 A：横向头像列表 + 关注按钮 */
export function RecommendedAuthors({ authors }: { authors: Author[] }) {
  // 关注状态（本地 Mock 交互，后续接入关注 API）
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-foreground">推荐作者</h3>
      <div className="flex flex-col gap-3">
        {authors.map((a) => {
          const isFollowed = followed[a.id] ?? a.followed ?? false;
          return (
            <div key={a.id} className="flex items-center gap-2.5">
              <Avatar name={a.nickname} src={a.avatar} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {a.nickname}
                </p>
                <p className="truncate text-xs text-subtle">
                  {a.tags?.join(" · ")}
                </p>
              </div>
              <Button
                size="sm"
                variant={isFollowed ? "ghost" : "secondary"}
                onClick={() =>
                  setFollowed((s) => ({ ...s, [a.id]: !isFollowed }))
                }
              >
                {isFollowed ? "已关注" : "关注"}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
