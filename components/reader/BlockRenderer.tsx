import { Image as ImageIcon, Play, Music2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentBlock, ImageLayout } from "@/types";

/**
 * 富内容块渲染器 —— 将「小说编辑器」的结构化内容渲染为沉浸阅读的图文混排。
 * 文字尺寸使用 em，随阅读器字号整体缩放。
 */

const imageLayoutClass: Record<ImageLayout, string> = {
  center: "mx-auto max-w-[70%]",
  left: "mr-auto max-w-[60%]",
  right: "ml-auto max-w-[60%]",
  full: "w-full",
  inline: "mx-auto max-w-[40%]",
};

/** 对正则元字符转义，用于把划线文字安全地拼进正则。 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 将文本中命中划线的地方用 <mark> 包裹（视觉高亮，颜色不随主题改变）。 */
function HighlightedText({ text, highlights }: { text: string; highlights: string[] }) {
  const matches = Array.from(new Set(highlights.filter((h) => h && text.includes(h)))).sort(
    (a, b) => b.length - a.length
  );
  if (!matches.length) return <>{text}</>;
  const re = new RegExp(`(${matches.map(escapeRegExp).join("|")})`, "g");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        part && matches.includes(part) ? (
          <mark key={i} style={{ background: "rgba(250, 204, 21, 0.35)", color: "inherit" }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function BlockRenderer({
  block,
  lineHeight = 1.8,
  highlights = [],
}: {
  block: ContentBlock;
  lineHeight?: number;
  highlights?: string[];
}) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="my-4 text-[1.05em] tracking-wide text-[var(--reader-fg)]" style={{ lineHeight }}>
          <HighlightedText text={block.text} highlights={highlights} />
        </p>
      );

    case "heading":
      return block.level === 2 ? (
        <h2 className="mb-4 mt-8 text-[1.5em] font-bold leading-snug text-[var(--reader-fg)]">
          <HighlightedText text={block.text} highlights={highlights} />
        </h2>
      ) : (
        <h3 className="mb-3 mt-6 text-[1.25em] font-semibold leading-snug text-[var(--reader-fg)]">
          <HighlightedText text={block.text} highlights={highlights} />
        </h3>
      );

    case "quote":
      return (
        <blockquote className="my-6 border-l-2 border-[var(--reader-secondary)] pl-4 text-[1.05em] italic text-[var(--reader-secondary)]" style={{ lineHeight }}>
          <HighlightedText text={block.text} highlights={highlights} />
        </blockquote>
      );

    case "divider":
      return (
        <div className="my-8 flex items-center gap-3 text-[var(--reader-secondary)]">
          <span className="h-px flex-1 bg-[var(--reader-secondary)] opacity-30" />
          <span className="text-sm">· · ·</span>
          <span className="h-px flex-1 bg-[var(--reader-secondary)] opacity-30" />
        </div>
      );

    case "image":
      return (
        <figure className={cn("my-6", imageLayoutClass[block.layout ?? "center"])}>
          <div
            className={cn(
              "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg",
              block.animated && "shimmer"
            )}
            style={{
              background: `linear-gradient(135deg, ${block.color ?? "#5B8DEF"}, #14161b)`,
            }}
          >
            {block.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.src}
                alt={block.alt ?? block.caption ?? ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-white/50" />
            )}
            {block.animated && (
              <span className="absolute bottom-2 right-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
                GIF
              </span>
            )}
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-center text-[0.8em] text-[var(--reader-secondary)]">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "video":
      return (
        <figure className="my-6">
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-black/90">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <Play className="ml-0.5 h-6 w-6 text-white" />
            </div>
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-center text-[0.8em] text-[var(--reader-secondary)]">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "audio":
      return (
        <figure className="my-6">
          <div className="flex items-center gap-3 rounded-lg border border-[var(--reader-secondary)]/30 px-4 py-3">
            <Music2 className="h-5 w-5 text-[var(--reader-secondary)]" />
            <div className="flex-1">
              <div className="flex h-6 items-end gap-0.5">
                {[4, 8, 6, 12, 7, 9, 5, 11, 6].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-[var(--reader-secondary)] opacity-70"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
              <p className="mt-1 text-[0.8em] text-[var(--reader-secondary)]">{block.caption ?? "语音朗读"}</p>
            </div>
          </div>
        </figure>
      );

    case "map":
      return (
        <figure className="my-6">
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--reader-secondary)]/40 px-4 py-4">
            <MapPin className="h-5 w-5 text-[var(--reader-secondary)]" />
            <span className="text-[0.95em] text-[var(--reader-fg)]">{block.label ?? "故事发生地"}</span>
          </div>
        </figure>
      );
  }
}
