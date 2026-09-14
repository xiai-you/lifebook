"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoverRatio } from "@/types";

const aspectClass: Record<CoverRatio, string> = {
  "16:9": "aspect-video",
  "3:4": "aspect-[3/4]",
  "1:1": "aspect-square",
};

/**
 * 故事封面 —— 真实生活摄影（自然光 / 胶片质感）+ 电影感叠加。
 * 传入 `photo` 渲染真实图片；加载失败自动回退到主题色电影渐变（绝不显示破图）。
 * 圆角 16px，带暗角 + 颗粒 + 标题字幕排版。
 */
export function CoverImage({
  title,
  color = "#5B8DEF",
  ratio = "16:9",
  photo,
  animated = false,
  showTitle = true,
  className,
}: {
  title: string;
  color?: string;
  ratio?: CoverRatio;
  photo?: string | null;
  animated?: boolean;
  showTitle?: boolean;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const src = photo && !errored ? photo : null;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-[#23222b]",
        aspectClass[ratio],
        className
      )}
    >
      {/* 真实摄影图层 */}
      {src ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        /* 兜底：电影感渐变 */
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(158deg, ${color} 0%, #3a3a52 58%, #1a1714 100%)`,
          }}
        />
      )}

      {/* 黄金时刻暖光（叠加在照片上也成立，营造胶片感） */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-soft-light"
        style={{
          backgroundImage:
            "radial-gradient(circle at 28% 18%, rgba(255,206,150,0.7) 0%, transparent 46%)",
        }}
      />
      {/* 暗角（提升文字可读性 + 电影感） */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.12) 34%, transparent 58%)",
        }}
      />
      {/* 胶片颗粒 */}
      <div className="grain absolute inset-0 opacity-[0.07]" />

      {/* 图片加载失败标识（仅当有 photo 且失败） */}
      {photo && errored && (
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[10px] text-white/85 backdrop-blur">
          <ImageOff className="h-3 w-3" />
          图片离线
        </div>
      )}

      {/* 标题字幕（编辑排版：细竖线 + 衬线标题） */}
      {showTitle && title && (
        <div className="absolute inset-x-4 bottom-3.5">
          <div className="flex items-start gap-2.5">
            <span className="mt-1 h-7 w-0.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="line-clamp-2 font-serif text-sm font-semibold leading-snug text-white/95 drop-shadow-md">
              {title}
            </span>
          </div>
        </div>
      )}

      {/* 动图标识 */}
      {animated && (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          GIF
        </span>
      )}
    </div>
  );
}
