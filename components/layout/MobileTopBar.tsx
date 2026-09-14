import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

/** 移动端顶部栏（<1024px）—— Logo + 搜索图标 + 主题切换 */
export function MobileTopBar() {
  return (
    <header className="glass-strong fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b border-white/40 px-4 lg:hidden dark:border-white/10">
      <Logo />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Link
          href="/search"
          aria-label="搜索"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover"
        >
          <Search className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
