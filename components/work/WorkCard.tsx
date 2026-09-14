import Link from "next/link";
import { Eye, Heart, Bookmark, MessageCircle, HeartHandshake, MapPin } from "lucide-react";
import { cn, formatCount } from "@/lib/utils";
import { CoverImage } from "@/components/shared/CoverImage";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCategoryById } from "@/lib/constants/categories";
import { formatLabel } from "@/lib/constants/storyFormat";
import type { Work } from "@/types";

/**
 * 作品卡片（瀑布流）—— Art Direction 2.0：杂志 / 编辑排版。
 * 24px 圆角 + 玻璃边框 + 浅色柔光阴影；悬停上浮 4px + 阴影扩散（不缩放）；点击轻微下沉。
 * 封面带 8px 相框留白、16px 图片圆角，营造「剧照相框」质感。
 */
export function WorkCard({
  work,
  className,
}: {
  work: Work;
  className?: string;
}) {
  const category = getCategoryById(work.categoryL1);
  const color = work.coverColor ?? category?.color;

  return (
    <Link
      href={`/story/${work.id}`}
      className={cn(
        "group mb-4 block break-inside-avoid overflow-hidden rounded-[24px] bg-card/80 p-2 shadow-card ring-1 ring-white/60 backdrop-blur transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover hover:ring-primary/20 active:translate-y-0 active:shadow-card dark:bg-card/70 dark:ring-white/10",
        className
      )}
    >
      {/* 封面（16px 圆角 + 相框留白 + 人生印记） */}
      <div className="relative">
        <CoverImage title={work.title} color={color} ratio={work.coverRatio} photo={work.coverImage} />
        {work.momentLabel && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            {work.momentLabel}
          </span>
        )}
      </div>

      <div className="px-3 pb-3 pt-2.5">
        {/* 标题：最多 2 行 */}
        <h3 className="line-clamp-2 font-serif text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {work.title}
        </h3>

        {/* 摘录：作者原文的一句话 */}
        {work.excerpt && (
          <p className="mt-1.5 line-clamp-2 font-serif text-[13px] leading-relaxed text-foreground/75">
            {work.excerpt}
          </p>
        )}

        {/* 元数据：年份 · 地点 · 人生阶段 */}
        <p className="mt-1.5 text-[11px] text-subtle">
          {[work.year, work.city, work.lifeStage].filter(Boolean).join(" · ")}
        </p>

        {/* 形式 + 情绪 + 标签 */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {formatLabel(work.format)}
          </span>
          {work.emotion && <Badge color={color}>{work.emotion}</Badge>}
          {work.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-full bg-hover/70 px-2 py-0.5 text-[11px] text-subtle"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* 作者 + 城市 */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Avatar name={work.author.nickname} src={work.author.avatar} size="sm" />
            <span className="truncate text-xs text-muted">{work.author.nickname}</span>
          </div>
          {work.city && (
            <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-subtle">
              <MapPin className="h-3 w-3" />
              {work.city}
            </span>
          )}
        </div>

        {/* 互动数据 */}
        <div className="mt-2.5 flex items-center gap-3 border-t border-divider pt-2.5 text-xs text-subtle">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatCount(work.viewCount)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {formatCount(work.likeCount)}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark className="h-3.5 w-3.5" />
            {formatCount(work.collectCount)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {formatCount(work.commentCount)}
          </span>
          {work.resonateCount > 0 && (
            <span className="ml-auto flex items-center gap-1 font-medium text-accent">
              <HeartHandshake className="h-3.5 w-3.5" />
              {formatCount(work.resonateCount)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
