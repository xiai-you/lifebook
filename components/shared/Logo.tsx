"use client";

import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * LifeBook 品牌 Logo ——「一本打开的书，书页逐渐变成飞鸟」
 * 寓意：人生化作故事，故事飞向世界。
 * 图形为内联 SVG（可随主题着色），支持深浅色适配。
 */
export function Logo({
  className,
  showText = true,
  size = 28,
}: {
  className?: string;
  showText?: boolean;
  size?: number;
}) {
  // useId 含冒号，无法用于 url(#id)，需去除
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <Link
      href="/"
      className={cn("flex shrink-0 items-center gap-2", className)}
      aria-label="LifeBook 首页"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`g${gid}`} x1="6" y1="46" x2="42" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5B8DEF" />
            <stop offset="1" stopColor="#2F5FD0" />
          </linearGradient>
        </defs>

        {/* 打开的书（两页） */}
        <path
          d="M24 31 C19 25 9 26 5 31 L5 41 C9 36 19 35 24 41 Z"
          fill={`url(#g${gid})`}
        />
        <path
          d="M24 31 C29 25 39 26 43 31 L43 41 C39 36 29 35 24 41 Z"
          fill={`url(#g${gid})`}
          opacity="0.72"
        />

        {/* 书页化作飞鸟（由近及远，向上向右） */}
        <path
          d="M26 26 q3 -3 6 0 q3 3 6 0"
          stroke={`url(#g${gid})`}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M30 18 q4 -4 8 0 q4 4 8 0"
          stroke={`url(#g${gid})`}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <path
          d="M33 10 q5 -5 10 0 q5 5 10 0"
          stroke={`url(#g${gid})`}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </svg>

      {showText && (
        <span className="text-lg font-bold tracking-tight text-foreground">
          LifeBook
        </span>
      )}
    </Link>
  );
}
