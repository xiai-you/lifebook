import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 标签 —— 文档 5.7：圆角 6px、内边距 4px 8px、浅色背景 + 深色文字。
 * 传入分类主题色，自动生成浅色底（10% 透明度）。
 */
export function Badge({
  color = "#E8833A",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm px-2 py-1 text-xs font-medium leading-none",
        className
      )}
      style={{ color, backgroundColor: `${color}1A` }}
      {...props}
    >
      {children}
    </span>
  );
}
