/** 卡片骨架屏（loading 状态）—— 文档 5.6：骨架屏 shimmer */
export function WorkCardSkeleton() {
  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-lg bg-card shadow-sm">
      <div className="aspect-[3/4] w-full animate-pulse bg-hover" />
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-full animate-pulse rounded bg-hover" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-hover" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-hover" />
      </div>
    </div>
  );
}
