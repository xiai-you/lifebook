"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Mail, Feather } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

/**
 * 顶部导航栏（桌面 ≥1024px，固定高 64px）—— Art Direction 2.0：毛玻璃。
 * 背景随滚动不透明度增加（滚后更强玻璃 + 柔和阴影）；搜索框圆角胶囊；右侧创作 / 主题 / 通知 / 消息 / 头像。
 */
export function TopNav() {
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 hidden h-16 border-b backdrop-blur-xl transition-all duration-300 lg:block",
        scrolled
          ? "glass-strong border-white/40 shadow-soft dark:border-white/10"
          : "border-white/30 bg-transparent dark:border-white/5"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-6">
        <Logo />

        {/* 搜索框：占满剩余宽度，圆角胶囊 */}
        <form onSubmit={onSubmit} className="relative max-w-2xl flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜小说、人物、标签、城市、情绪…"
            className="h-10 w-full rounded-full border border-border/60 bg-background/60 pl-10 pr-4 text-sm outline-none backdrop-blur transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
          />
        </form>

        {/* 右侧操作区 */}
        <nav className="flex items-center gap-1">
          <Link
            href="/create"
            className="mr-1 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#5b8def] via-[#7a6cf0] to-[#a06bf0] px-4 py-2 text-sm font-semibold text-inverse shadow-glow-lg ring-1 ring-inset ring-white/25 animate-breathe transition-transform active:scale-[0.98]"
          >
            <Feather className="h-4 w-4" />
            开始写人生
          </Link>

          <ThemeToggle />

          <Link
            href="/notifications"
            aria-label="通知"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
          </Link>

          <Link
            href="/messages"
            aria-label="消息"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-foreground"
          >
            <Mail className="h-5 w-5" />
          </Link>

          <Link
            href="/me"
            className="ml-1 flex items-center rounded-full p-1 transition-colors hover:bg-hover"
          >
            <Avatar name="林小满" size="md" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
