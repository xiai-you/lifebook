"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Compass, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 移动端底部 Tab 栏（<1024px）—— Art Direction 2.0：悬浮胶囊。
 * 距底部 16px、左右 16px，圆角胶囊 + 毛玻璃 + 柔和阴影；当前项有浅色药丸高亮。
 */
const tabs = [
  { href: "/", label: "首页", icon: House },
  { href: "/discover", label: "发现", icon: Compass },
  { href: "/shelf", label: "书架", icon: Bookmark },
  { href: "/me", label: "我的", icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="glass-strong fixed inset-x-4 bottom-4 z-40 flex h-14 items-stretch justify-around rounded-full border border-white/50 shadow-lg lg:hidden dark:border-white/10">
      {tabs.map((tab) => {
        const active =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "my-1.5 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] transition-all duration-200",
              active
                ? "bg-primary/12 text-primary"
                : "text-subtle hover:text-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
