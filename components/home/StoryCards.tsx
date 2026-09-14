"use client";

import Link from "next/link";
import { MapPin, Clock3, MessageCircle } from "lucide-react";
import { formatCount } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { CoverImage } from "@/components/shared/CoverImage";
import { ResonateButton, LikeButton } from "@/components/shared/StoryActions";
import { getCategoryById } from "@/lib/constants/categories";
import type { Work } from "@/types";

/**
 * 首页生活流卡片 —— 照片故事 / 长文（编辑排版）。
 * 「小说」形态复用 WorkCard（封面卡）。此处为图片主导 / 文字主导两种生活感排版。
 */

function colorOf(work: Work): string {
  return work.coverColor ?? getCategoryById(work.categoryL1)?.color ?? "#5B8DEF";
}

/** 照片故事卡：大图主导，金句叠加，人生印记 chip */
export function PhotoCard({ work }: { work: Work }) {
  const color = colorOf(work);
  return (
    <article className="group overflow-hidden rounded-[24px] bg-card/80 shadow-card ring-1 ring-white/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:bg-card/70 dark:ring-white/10">
      <Link href={`/story/${work.id}`} className="block">
        <div className="relative">
          <CoverImage
            title={work.title}
            color={color}
            ratio="3:4"
            photo={work.coverImage}
            showTitle={false}
            className="rounded-none"
          />
          {/* 人生印记 */}
          {work.momentLabel && (
            <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <MapPin className="h-3 w-3" />
              {work.momentLabel}
            </span>
          )}
          {/* 金句叠加 */}
          <div className="absolute inset-x-4 bottom-4">
            {(work.excerpt || work.featuredLine) && (
              <p className="font-serif text-xl font-semibold leading-snug text-white drop-shadow-md">
                「{work.excerpt ?? work.featuredLine}」
              </p>
            )}
            <p className="mt-1.5 text-sm text-white/85 drop-shadow">{work.title}</p>
          </div>
          {/* 悬停提示 */}
          <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-1 bg-black/45 py-2 text-sm font-medium text-white opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            阅读故事 →
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/user/${work.authorId}`} className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar name={work.author.nickname} src={work.author.avatar} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground hover:text-primary">
              {work.author.nickname}
            </p>
            <p className="truncate text-[11px] text-subtle">
              {[work.city, work.country].filter(Boolean).join(" · ")}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ResonateButton workId={work.id} baseCount={work.resonateCount} size="sm" />
          <LikeButton workId={work.id} baseCount={work.likeCount} size="sm" />
        </div>
      </div>
    </article>
  );
}

/** 长文卡：文字主导，金句为视觉锚点 */
export function EssayCard({ work }: { work: Work }) {
  const color = colorOf(work);
  return (
    <article className="group rounded-[24px] bg-card/80 p-6 shadow-card ring-1 ring-white/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:bg-card/70 dark:ring-white/10 sm:p-7">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`/user/${work.authorId}`} className="flex items-center gap-2">
          <Avatar name={work.author.nickname} src={work.author.avatar} size="sm" />
          <span className="font-medium text-foreground hover:text-primary">
            {work.author.nickname}
          </span>
        </Link>
        <span>·</span>
        {work.city && <span>{work.city}</span>}
        <span>·</span>
        <span className="flex items-center gap-1">
          <Clock3 className="h-3 w-3" /> {work.readMinutes} 分钟
        </span>
      </div>

      <Link href={`/story/${work.id}`} className="mt-3 block">
        <h3 className="font-serif text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-2xl">
          {work.title}
        </h3>
      </Link>

      {(work.excerpt || work.featuredLine) && (
        <blockquote
          className="mt-3 border-l-2 pl-4 font-serif text-base italic leading-relaxed text-muted"
          style={{ borderColor: `${color}66` }}
        >
          {work.excerpt ?? work.featuredLine}
        </blockquote>
      )}

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{work.summary}</p>

      <div className="mt-4 flex items-center justify-between border-t border-divider pt-4">
        <div className="flex items-center gap-4 text-xs text-subtle">
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> {formatCount(work.commentCount)}
          </span>
          {work.momentLabel && <span>{work.momentLabel}</span>}
        </div>
        <div className="flex items-center gap-2">
          <ResonateButton workId={work.id} baseCount={work.resonateCount} size="sm" />
          <LikeButton workId={work.id} baseCount={work.likeCount} size="sm" />
        </div>
      </div>
    </article>
  );
}
