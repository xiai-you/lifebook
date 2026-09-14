import Link from "next/link";

/** 底部信息栏（桌面端）—— 版权、备案、规范链接（全部真实路由）。 */
export function Footer() {
  return (
    <footer className="mt-12 border-t border-divider py-8 text-center">
      <p className="font-serif text-sm text-muted">
        每个人都是自己人生的主角
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-subtle">
        <Link href="/about" className="transition-colors hover:text-primary">关于我们</Link>
        <Link href="/terms" className="transition-colors hover:text-primary">用户协议</Link>
        <Link href="/privacy" className="transition-colors hover:text-primary">隐私政策</Link>
        <Link href="/about" className="transition-colors hover:text-primary">内容规范</Link>
        <Link href="/about" className="transition-colors hover:text-primary">联系我们</Link>
      </div>
      <p className="mt-2 text-xs text-disabled">© 2026 LifeBook · 无障碍 WCAG 2.2</p>
    </footer>
  );
}
