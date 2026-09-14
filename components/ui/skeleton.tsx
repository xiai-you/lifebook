import { cn } from "@/lib/utils";

/** 骨架屏 —— shimmer 微光动画（需求文档动效规范） */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("shimmer rounded-md bg-hover", className)} />
  );
}
