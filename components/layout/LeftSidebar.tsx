"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  House,
  Compass,
  Bookmark,
  Sparkles,
  Bell,
  MessageCircle,
  User,
  Settings,
  Feather,
  Search,
  LogOut,
  ShieldCheck,
  FileText,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { getNotifications, getConversations } from "@/lib/api";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAuthStore } from "@/lib/store/useAuthStore";

const PRIMARY = [
  { href: "/", label: "首页", icon: House },
  { href: "/discover", label: "发现", icon: Compass },
  { href: "/shelf", label: "书架", icon: Bookmark },
  { href: "/write", label: "AI 故事助手", icon: Sparkles },
] as const;

const SECONDARY = [
  { href: "/notifications", label: "通知", icon: Bell },
  { href: "/messages", label: "消息", icon: MessageCircle },
] as const;

const BOTTOM = [
  { href: "/me", label: "我的", icon: User },
  { href: "/settings", label: "设置", icon: Settings },
] as const;

export function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: notifs } = useQuery({ queryKey: ["notifications"], queryFn: getNotifications });
  const { data: convs } = useQuery({ queryKey: ["conversations"], queryFn: getConversations });
  const readIds = useAppStore((s) => s.readNotificationIds);
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const unreadNotifs = (notifs ?? []).filter((n) => !n.read && !readIds.includes(n.id)).length;
  const unreadMsgs = (convs ?? []).reduce((s, c) => s + c.unread, 0);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    router.push("/login");
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-1 border-r border-divider/60 px-4 py-5 lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <form onSubmit={onSubmit} className="relative mt-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索故事、人物、标签…"
          className="h-9 w-full rounded-full border border-border/60 bg-background/50 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
        />
      </form>

      <Link
        href="/write"
        className="mt-3 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#5b8def] via-[#7a6cf0] to-[#a06bf0] py-2.5 text-sm font-semibold text-inverse shadow-glow-lg ring-1 ring-inset ring-white/25 animate-breathe transition-transform active:scale-[0.98]"
      >
        <Feather className="h-4 w-4" />
        开始写人生
      </Link>

      <nav className="mt-3 flex flex-col gap-0.5">
        {PRIMARY.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors",
                active ? "bg-primary/10 font-semibold text-primary" : "text-muted hover:bg-hover hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="my-2 h-px bg-divider" />

      <nav className="flex flex-col gap-0.5">
        {SECONDARY.map((item) => {
          const active = isActive(item.href);
          const badge = item.href === "/notifications" ? unreadNotifs : item.href === "/messages" ? unreadMsgs : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors",
                active ? "bg-primary/10 font-semibold text-primary" : "text-muted hover:bg-hover hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 底部：我的 / 设置 + 用户菜单 */}
      <nav className="mt-auto flex flex-col gap-0.5">
        {BOTTOM.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors",
                active ? "bg-primary/10 font-semibold text-primary" : "text-muted hover:bg-hover hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        {/* 当前用户 + 软件菜单 */}
        <div className="relative mt-1">
          {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />}
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="relative z-20 flex w-full items-center gap-3 rounded-full px-2 py-2 text-left transition-colors hover:bg-hover"
          >
            <Avatar name={authUser?.nickname ?? "访客"} src={authUser?.avatar} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{authUser?.nickname ?? "未登录"}</p>
              <p className="truncate text-xs text-subtle">{authUser ? `@${authUser.username}` : "登录后拥有自己的数据"}</p>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-subtle transition-transform", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 z-30 mb-2 w-60 rounded-2xl bg-card p-1.5 shadow-card ring-1 ring-white/60 dark:ring-white/10">
              <MenuLink href="/me" icon={User} label="我的主页" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/me" icon={BookOpen} label="我的故事" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/me" icon={FileText} label="我的草稿" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/shelf" icon={Bookmark} label="我的书架" onClick={() => setMenuOpen(false)} />
              <div className="my-1 h-px bg-divider" />
              <MenuLink href="/notifications" icon={Bell} label={`通知${unreadNotifs ? `（${unreadNotifs}）` : ""}`} onClick={() => setMenuOpen(false)} />
              <MenuLink href="/messages" icon={MessageCircle} label={`消息${unreadMsgs ? `（${unreadMsgs}）` : ""}`} onClick={() => setMenuOpen(false)} />
              <div className="my-1 h-px bg-divider" />
              <MenuLink href="/write" icon={Sparkles} label="AI 人生助手" onClick={() => setMenuOpen(false)} />
              <div className="my-1 h-px bg-divider" />
              <MenuLink href="/settings" icon={Settings} label="设置" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/settings" icon={ShieldCheck} label="账号与安全" onClick={() => setMenuOpen(false)} />
              <div className="my-1 h-px bg-divider" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" /> 退出登录
              </button>
            </div>
          )}
        </div>

        <div className="mt-1 flex justify-end px-2">
          <ThemeToggle />
        </div>
      </nav>
    </aside>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof User;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-hover">
      <Icon className="h-4 w-4 text-muted" />
      {label}
    </Link>
  );
}
