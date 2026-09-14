"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

/**
 * 主题切换 —— 浅色 / 深色 / 跟随系统（循环切换，需求文档第二节）。
 */
const order: Theme[] = ["light", "dark", "system"];
const icon = { light: Sun, dark: Moon, system: Monitor } as const;
const label: Record<Theme, string> = {
  light: "浅色模式",
  dark: "深色模式",
  system: "跟随系统",
};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const Icon = icon[theme];
  const next = order[(order.indexOf(theme) + 1) % order.length];

  return (
    <button
      type="button"
      aria-label={`当前主题：${label[theme]}，点击切换到${label[next]}`}
      title={label[next]}
      onClick={() => setTheme(next)}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-foreground",
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
