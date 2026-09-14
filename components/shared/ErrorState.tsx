"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** 错误状态 —— 文档执行指令第 6 条：组件需有 loading / empty / error 三种状态 */
export function ErrorState({
  title = "加载失败",
  description = "请检查网络后重试",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-20 text-center",
        className
      )}
    >
      <AlertCircle className="h-10 w-10 text-danger" />
      <p className="text-sm font-medium text-muted">{title}</p>
      <p className="text-xs text-subtle">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-sm font-medium text-primary">
          重试
        </button>
      )}
    </div>
  );
}
