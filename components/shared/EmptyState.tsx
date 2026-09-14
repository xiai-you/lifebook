import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/** 空状态 —— 文档执行指令第 6 条：组件需有 loading / empty / error 三种状态 */
export function EmptyState({
  title = "这里还没有内容",
  description = "换个分类，或稍后再来看看。",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-20 text-center",
        className
      )}
    >
      <Inbox className="h-10 w-10 text-subtle" />
      <p className="text-sm font-medium text-muted">{title}</p>
      <p className="text-xs text-subtle">{description}</p>
    </div>
  );
}
