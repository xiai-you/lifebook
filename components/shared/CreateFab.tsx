"use client";

import Link from "next/link";
import { Feather } from "lucide-react";

/**
 * 「开始写人生」悬浮按钮（移动端）—— 需求文档第八节 AI 写作系统入口。
 * 固定在底部 Tab 栏上方右下角。
 */
export function CreateFab() {
  return (
    <Link
      href="/write"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#5b8def] via-[#7a6cf0] to-[#a06bf0] px-4 py-3 text-sm font-semibold text-inverse shadow-glow-lg ring-1 ring-inset ring-white/25 transition-transform active:scale-95 lg:hidden"
    >
      <Feather className="h-4 w-4" />
      开始写人生
    </Link>
  );
}
