"use client";

import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/shared/StoryActions";
import type { Author } from "@/types";

/** 推荐作者（右侧栏）—— 文档 4.2 页面 A：横向头像列表 + 关注按钮（真实调用关注 API，非本地假状态） */
export function RecommendedAuthors({ authors }: { authors: Author[] }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-foreground">推荐作者</h3>
      <div className="flex flex-col gap-3">
        {authors.map((a) => (
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
            <FollowButton authorId={a.id} followedBase={a.followed} size="sm" />
          </div>
        ))}
      </div>
    </section>
  );
}
