"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Minus, Plus, ChevronLeft, ChevronRight, Sun, Moon, Leaf, BookOpen, List, Bookmark, Highlighter } from "lucide-react";
import { cn } from "@/lib/utils";
import { recordReading, toggleBookmark, getHighlights, createHighlight, deleteHighlight } from "@/lib/api";
import { useAppStore, selectIsBookmarked } from "@/lib/store/useAppStore";
import { BlockRenderer } from "./BlockRenderer";
import type { Chapter, Highlight } from "@/types";

/**
 * 沉浸式阅读器 —— 需求文档第十节，参考 Kindle。
 * 主题（纸白 / 护眼绿 / 暖黄 / 暗黑）、字号、行距、字体、章节切换（按钮 / 键盘 / 滑动手势）、
 * 点击屏幕切换菜单、进度。顶 / 底栏自动隐藏，营造沉浸阅读体验。
 */

const THEMES = [
  { key: "paper", label: "纸白", icon: BookOpen, cls: "reader-paper" },
  { key: "green", label: "护眼", icon: Leaf, cls: "reader-green" },
  { key: "sepia", label: "暖黄", icon: Sun, cls: "reader-sepia" },
  { key: "dark", label: "暗黑", icon: Moon, cls: "reader-dark" },
] as const;

const FONT_SIZES = [16, 18, 20, 24];
const LINE_HEIGHTS = [1.6, 1.8, 2.0];

export function Reader({
  chapters,
  initialIndex = 0,
  title,
  workId,
  onClose,
}: {
  chapters: Chapter[];
  initialIndex?: number;
  title: string;
  workId?: string;
  onClose: () => void;
}) {
  const [theme, setTheme] = useState<(typeof THEMES)[number]["key"]>("paper");
  const [fontIdx, setFontIdx] = useState(1);
  const [lineIdx, setLineIdx] = useState(1);
  const [serif, setSerif] = useState(true);
  const [idx, setIdx] = useState(initialIndex);
  const [menuVisible, setMenuVisible] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const didSwipe = useRef(false);

  const bookmarked = useAppStore(selectIsBookmarked(workId ?? "", idx + 1));
  const toggleBookmarkStore = useAppStore((s) => s.toggleBookmark);
  const bookmarkedChapters = useAppStore((s) => s.bookmarkedChapters);

  const chapter = chapters[idx];
  const themeCls = THEMES.find((t) => t.key === theme)!.cls;
  const fontSize = FONT_SIZES[fontIdx];
  const lineHeight = LINE_HEIGHTS[lineIdx];
  const chapterHighlights = highlights
    .filter((h) => h.chapterOrder === idx + 1)
    .map((h) => h.text);

  function goNext() {
    if (idx < chapters.length - 1) setIdx((i) => i + 1);
  }
  function goPrev() {
    if (idx > 0) setIdx((i) => i - 1);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i < chapters.length - 1 ? i + 1 : i));
      if (e.key === "ArrowLeft") setIdx((i) => (i > 0 ? i - 1 : i));
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, chapters.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [idx]);

  // 记录阅读进度（继续阅读）
  useEffect(() => {
    if (workId) {
      useAppStore.getState().recordReading(workId, idx + 1, chapters.length);
      recordReading(workId, idx + 1, chapters.length).catch(() => {});
    }
  }, [workId, idx, chapters.length]);

  // 加载当前作品的划线（持久化到数据库）
  useEffect(() => {
    if (!workId) return;
    let alive = true;
    getHighlights(workId)
      .then((list) => { if (alive) setHighlights(list); })
      .catch(() => {});
    return () => { alive = false; };
  }, [workId]);

  // 监听文字选择：选中正文文字时显示「划线」按钮
  useEffect(() => {
    function onSelectionChange() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      const text = sel.toString().trim();
      if (!text || !scrollRef.current) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!scrollRef.current.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      setSelection({ text, x: rect.left + rect.width / 2, y: rect.top });
    }
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  async function doHighlight() {
    if (!workId || !selection) return;
    const text = selection.text;
    setSelection(null);
    window.getSelection()?.removeAllRanges();
    try {
      const hl = await createHighlight(workId, idx + 1, text);
      setHighlights((prev) =>
        prev.some((h) => h.workId === workId && h.chapterOrder === idx + 1 && h.text === text)
          ? prev
          : [...prev, hl]
      );
      setConfirm("已划线");
    } catch {
      setConfirm("划线失败，请稍后重试");
    } finally {
      setTimeout(() => setConfirm(null), 1500);
    }
  }

  async function removeHighlight(id: string) {
    await deleteHighlight(id).catch(() => {});
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40 backdrop-blur-sm">
      <div
        className={cn("relative flex h-full flex-col", themeCls)}
        style={{ background: "var(--reader-bg)", color: "var(--reader-fg)" }}
      >
        {/* 电影暗角（背景层，不遮挡文字） */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 40%, transparent 58%, rgba(0,0,0,0.07) 100%)",
          }}
        />

        {/* 顶部栏（点击屏幕自动隐藏 / 显示） */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-[var(--reader-secondary)]/20 bg-[var(--reader-bg)]/90 px-4 py-2.5 backdrop-blur transition-all duration-300",
            menuVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
          )}
        >
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--reader-fg)] transition-colors hover:bg-[var(--reader-secondary)]/15"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 px-4 text-center">
            <p className="truncate text-sm font-medium text-[var(--reader-fg)]">{title}</p>
            <p className="truncate text-xs text-[var(--reader-secondary)]">{chapter?.title}</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (!workId) return;
                toggleBookmarkStore(workId, idx + 1);
                toggleBookmark(workId, idx + 1).catch(() => {});
              }}
              aria-label={bookmarked ? "取消书签" : "加书签"}
              title={bookmarked ? "取消书签" : "加书签"}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--reader-secondary)]/15",
                bookmarked ? "text-[var(--reader-fg)]" : "text-[var(--reader-secondary)]"
              )}
            >
              <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
            </button>
            <button
              onClick={() => setTocOpen(true)}
              aria-label="目录"
              title="目录"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--reader-secondary)] transition-colors hover:bg-[var(--reader-secondary)]/15"
            >
              <List className="h-4 w-4" />
            </button>
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = t.key === theme;
              return (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  aria-label={t.label}
                  title={t.label}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    active
                      ? "bg-[var(--reader-fg)] text-[var(--reader-bg)]"
                      : "text-[var(--reader-secondary)] hover:bg-[var(--reader-secondary)]/15"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* 正文（点击切换菜单；左右滑动切换章节） */}
        <div
          ref={scrollRef}
          onClick={() => {
            // 选中文字时点击不切换菜单（避免划线时误触）
            if (!didSwipe.current && !(window.getSelection()?.toString().trim())) {
              setMenuVisible((v) => !v);
            }
          }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            touchStart.current = { x: t.clientX, y: t.clientY };
            didSwipe.current = false;
          }}
          onTouchEnd={(e) => {
            const start = touchStart.current;
            if (!start) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - start.x;
            const dy = t.clientY - start.y;
            touchStart.current = null;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
              didSwipe.current = true;
              if (dx < 0) goNext();
              else goPrev();
            }
          }}
          className="thin-scrollbar relative z-[1] mx-auto w-full max-w-2xl flex-1 cursor-pointer overflow-y-auto px-6 py-16"
          style={{ fontFamily: serif ? "var(--font-serif)" : "var(--font-sans)" }}
        >
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* 章节标题（电影字幕式：细竖线 + 衬线 + 宽字距） */}
            <div className="mb-10 flex items-stretch gap-3.5">
              <span className="w-0.5 shrink-0 rounded-full bg-[var(--reader-fg)]/35" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--reader-secondary)]">
                  第 {idx + 1} 章
                </p>
                <h2 className="mt-1.5 font-serif text-2xl font-semibold leading-tight text-[var(--reader-fg)]">
                  {chapter?.title}
                </h2>
              </div>
            </div>

            <div style={{ fontSize }}>
              {chapter?.content.map((block, i) => (
                <BlockRenderer key={i} block={block} lineHeight={lineHeight} highlights={chapterHighlights} />
              ))}
            </div>

            <p className="mt-10 text-center text-[0.8em] text-[var(--reader-secondary)]">
              —— 第 {idx + 1} / {chapters.length} 章 ——
            </p>
          </motion.div>
        </div>

        {/* 底部栏（自动隐藏） */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 border-t border-[var(--reader-secondary)]/20 bg-[var(--reader-bg)]/90 px-4 py-3 backdrop-blur transition-all duration-300",
            menuVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
          )}
        >
          <button
            onClick={goPrev}
            disabled={idx === 0}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-[var(--reader-fg)] transition-colors hover:bg-[var(--reader-secondary)]/15 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            上一章
          </button>

          <div className="flex items-center gap-3 text-[var(--reader-secondary)]">
            <button
              onClick={() => setFontIdx((i) => Math.max(0, i - 1))}
              disabled={fontIdx === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--reader-secondary)]/15 disabled:opacity-30"
              aria-label="减小字号"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-xs">字号</span>
            <button
              onClick={() => setFontIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
              disabled={fontIdx === FONT_SIZES.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--reader-secondary)]/15 disabled:opacity-30"
              aria-label="增大字号"
            >
              <Plus className="h-4 w-4" />
            </button>

            <span className="mx-1 h-4 w-px bg-[var(--reader-secondary)]/30" />

            <button
              onClick={() => setLineIdx((i) => (i + 1) % LINE_HEIGHTS.length)}
              className="rounded-full px-2.5 py-1 text-xs transition-colors hover:bg-[var(--reader-secondary)]/15"
              title="切换行距"
            >
              行距·{lineHeight}
            </button>
            <button
              onClick={() => setSerif((s) => !s)}
              className="rounded-full px-2.5 py-1 text-xs transition-colors hover:bg-[var(--reader-secondary)]/15"
              title="切换字体"
            >
              {serif ? "衬线" : "黑体"}
            </button>
          </div>

          <button
            onClick={goNext}
            disabled={idx === chapters.length - 1}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-[var(--reader-fg)] transition-colors hover:bg-[var(--reader-secondary)]/15 disabled:opacity-30"
          >
            下一章
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 目录抽屉 */}
        {tocOpen && (
          <div className="absolute inset-0 z-20 bg-black/30" onClick={() => setTocOpen(false)}>
            <div
              className="absolute right-0 top-0 flex h-full w-72 flex-col bg-[var(--reader-bg)] shadow-2xl"
              style={{ color: "var(--reader-fg)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--reader-secondary)]/20 px-4 py-3">
                <span className="font-medium">目录</span>
                <button
                  onClick={() => setTocOpen(false)}
                  aria-label="关闭目录"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--reader-secondary)] hover:bg-[var(--reader-secondary)]/15"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="thin-scrollbar flex-1 overflow-y-auto p-2">
                {chapters.map((ch, i) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setIdx(i);
                      setTocOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--reader-secondary)]/10",
                      i === idx && "bg-[var(--reader-secondary)]/15"
                    )}
                  >
                    <span className="w-5 shrink-0 text-center text-xs tabular-nums text-[var(--reader-secondary)]">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{ch.title}</span>
                    {workId && bookmarkedChapters.includes(`${workId}:${i + 1}`) && (
                      <Bookmark className="h-3.5 w-3.5 shrink-0 fill-current text-[var(--reader-secondary)]" />
                    )}
                  </button>
                ))}

                {workId && highlights.length > 0 && (
                  <div className="mt-3 border-t border-[var(--reader-secondary)]/20 pt-2">
                    <div className="flex items-center justify-between px-3 pb-1">
                      <span className="text-xs font-medium text-[var(--reader-secondary)]">我的划线</span>
                      <span className="text-[11px] text-[var(--reader-secondary)]">{highlights.length}</span>
                    </div>
                    {highlights.map((h) => (
                      <div
                        key={h.id}
                        className="group flex items-start gap-1 rounded-lg px-2 py-1.5 hover:bg-[var(--reader-secondary)]/10"
                      >
                        <button
                          onClick={() => {
                            setIdx(h.chapterOrder - 1);
                            setTocOpen(false);
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="mb-0.5 block text-[11px] text-[var(--reader-secondary)]">
                            第 {h.chapterOrder} 章
                          </span>
                          <span className="line-clamp-2 text-sm leading-snug text-[var(--reader-fg)]">
                            {h.text}
                          </span>
                        </button>
                        <button
                          onClick={() => removeHighlight(h.id)}
                          aria-label="删除划线"
                          className="mt-0.5 shrink-0 rounded-full p-1 text-[var(--reader-secondary)] opacity-0 transition-opacity hover:bg-[var(--reader-secondary)]/15 group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 划线操作气泡 */}
        {selection && workId && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              doHighlight();
            }}
            className="fixed z-30 -translate-x-1/2 rounded-full bg-[var(--reader-fg)] px-3 py-1.5 text-xs font-medium text-[var(--reader-bg)] shadow-lg"
            style={{ left: selection.x, top: Math.max(selection.y - 44, 8) }}
          >
            <Highlighter className="mr-1 inline h-3.5 w-3.5" />
            划线
          </button>
        )}

        {/* 划线结果提示 */}
        {confirm && (
          <div className="pointer-events-none fixed left-1/2 top-16 z-40 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs text-white">
            {confirm}
          </div>
        )}
      </div>
    </div>
  );
}
