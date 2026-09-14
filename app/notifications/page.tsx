"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Bookmark, UserPlus, Sparkles, Megaphone, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import { useAppStore } from "@/lib/store/useAppStore";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationItem, NotificationType } from "@/types";

/** 通知中心 —— 真实状态（未读/已读/全部已读），点击进入对应内容。 */

const TABS: { key: NotificationType | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "like", label: "赞" },
  { key: "comment", label: "评论" },
  { key: "collect", label: "收藏" },
  { key: "follow", label: "关注" },
  { key: "ai", label: "AI 助手" },
  { key: "official", label: "官方" },
];

const TYPE_META: Record<NotificationType, { icon: typeof Heart; className: string }> = {
  like: { icon: Heart, className: "bg-rose-50 text-rose-500 dark:bg-rose-500/15" },
  comment: { icon: MessageCircle, className: "bg-primary/10 text-primary" },
  collect: { icon: Bookmark, className: "bg-amber-50 text-amber-500 dark:bg-amber-500/15" },
  follow: { icon: UserPlus, className: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15" },
  ai: { icon: Sparkles, className: "bg-violet-50 text-violet-500 dark:bg-violet-500/15" },
  official: { icon: Megaphone, className: "bg-sky-50 text-sky-500 dark:bg-sky-500/15" },
};

/** 通知点击跳转目标 */
function targetOf(item: NotificationItem): string | null {
  if (item.workId) {
    if (item.type === "ai") return "/write";
    return `/story/${item.workId}`;
  }
  if (item.authorId) return `/user/${item.authorId}`;
  return null;
}

export default function NotificationsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: getNotifications });
  const [tab, setTab] = useState<NotificationType | "all">("all");
  const queryClient = useQueryClient();
  const readIds = useAppStore((s) => s.readNotificationIds);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAllRead = useAppStore((s) => s.markAllNotificationsRead);

  // 已读状态：本地即时更新 + 后端持久化 + 重取列表
  const handleRead = (id: string) => {
    markRead(id);
    markNotificationRead(id).finally(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }));
  };
  const handleMarkAll = (ids: string[]) => {
    markAllRead(ids);
    markAllNotificationsRead().finally(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }));
  };

  const items = useMemo(() => {
    const list = data ?? [];
    return tab === "all" ? list : list.filter((n) => n.type === tab);
  }, [data, tab]);

  const unreadCount = (data ?? []).filter((n) => !n.read && !readIds.includes(n.id)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">通知</h1>
          <p className="mt-0.5 text-sm text-muted">{unreadCount > 0 ? `${unreadCount} 条未读消息` : "没有未读消息"}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => data && handleMarkAll(data.map((n) => n.id))} className="flex items-center gap-1 rounded-full bg-hover px-3 py-1.5 text-xs text-muted transition-colors hover:text-primary">
            <CheckCheck className="h-3.5 w-3.5" /> 全部已读
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("rounded-full px-3.5 py-1.5 text-sm transition-colors", tab === t.key ? "bg-primary font-medium text-inverse" : "bg-hover text-muted hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-divider">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2 py-0.5"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="暂无此类通知" description="互动发生时会第一时间提醒你" />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <NotificationRow key={n.id} item={n} isRead={n.read || readIds.includes(n.id)} onRead={() => handleRead(n.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ item, isRead, onRead }: { item: NotificationItem; isRead: boolean; onRead: () => void }) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const { actor, content, workTitle } = item;
  const target = targetOf(item);

  const text = (() => {
    switch (item.type) {
      case "like": return (<><Actor name={actor?.nickname} /> 赞了你的作品 {workTitle && <WorkTitle title={workTitle} />}</>);
      case "comment": return (<><Actor name={actor?.nickname} /> 评论了你的作品 {workTitle && <WorkTitle title={workTitle} />}：{content}</>);
      case "collect": return (<><Actor name={actor?.nickname} /> 收藏了你的作品 {workTitle && <WorkTitle title={workTitle} />}</>);
      case "follow": return (<><Actor name={actor?.nickname} /> 关注了你</>);
      default: return <span>{content}</span>;
    }
  })();

  const inner = (
    <div className={cn("flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-divider transition-colors hover:bg-hover", !isRead && "bg-primary/[0.03] ring-primary/20")}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", meta.className)}>
        {actor ? <Avatar name={actor.nickname} src={actor.avatar} size="lg" className="h-10 w-10" /> : <Icon className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed text-foreground">{text}</p>
        <p className="mt-1 text-xs text-subtle">{item.createdAt}</p>
      </div>
      {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
    </div>
  );

  if (target) {
    return (
      <Link href={target} onClick={onRead} className="block">{inner}</Link>
    );
  }
  return <button onClick={onRead} className="block w-full text-left">{inner}</button>;
}

function Actor({ name }: { name?: string }) {
  return <span className="font-medium text-foreground">{name ?? "有人"}</span>;
}

function WorkTitle({ title }: { title: string }) {
  return <span className="text-primary">《{title}》</span>;
}
