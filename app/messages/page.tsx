"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 消息 / 私信列表 —— 需求文档第十六节，参考微信会话列表。
 */

export default function MessagesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["conversations"], queryFn: getConversations });

  const totalUnread = (data ?? []).reduce((s, c) => s + c.unread, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">消息</h1>
        <p className="mt-0.5 text-sm text-muted">
          {totalUnread > 0 ? `${totalUnread} 条未读私信` : "和读者保持联系"}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-card p-3 ring-1 ring-divider">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2 py-1">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="还没有私信" description="当读者联系你时会显示在这里" />
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 rounded-lg bg-card p-3 ring-1 ring-divider transition-colors hover:bg-hover"
            >
              <Avatar name={c.user.nickname} src={c.user.avatar} size="xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{c.user.nickname}</p>
                  <span className="shrink-0 text-xs text-subtle">{c.lastAt}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-muted">{c.lastMessage}</p>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
