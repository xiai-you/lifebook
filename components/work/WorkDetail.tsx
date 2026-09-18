"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Eye,
  MessageCircle,
  Share2,
  MapPin,
  Clock3,
  Play,
  Sparkles,
  Send,
  Check,
  Users,
  Pencil,
  X,
  Loader2,
} from "lucide-react";
import { cn, formatCount } from "@/lib/utils";
import {
  getWorkById,
  getChapters,
  getComments,
  getRelatedWorks,
  getWorkTimeline,
  getWorkEmotionCurve,
  getWorkCharacterGraph,
  getWorkLifeMap,
  postComment,
  likeComment,
  updateWork,
} from "@/lib/api";
import { categories, getCategoryById } from "@/lib/constants/categories";
import { formatLabel, sourceLabel } from "@/lib/constants/storyFormat";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { CoverImage } from "@/components/shared/CoverImage";
import { WorkMasonry } from "@/components/work/WorkMasonry";
import { Reader } from "@/components/reader/Reader";
import { Timeline, EmotionCurve, CharacterGraph, LifeMap, EmotionLegend, AiPending } from "@/components/work/AiFeatures";
import {
  LikeButton,
  CollectButton,
  ResonateButton,
  FollowButton,
} from "@/components/shared/StoryActions";
import { useAppStore, selectIsCommentLiked } from "@/lib/store/useAppStore";
import { useAuthStore, useRequireLogin } from "@/lib/store/useAuthStore";
import type { CommentItem, WorkVisibility } from "@/types";

type AiTab = "timeline" | "emotion" | "character" | "map";

export function WorkDetail({ workId, initialChapter }: { workId: string; initialChapter?: number }) {
  const queryClient = useQueryClient();
  const [readerOpen, setReaderOpen] = useState(initialChapter != null);
  const [readerIdx, setReaderIdx] = useState(initialChapter ?? 0);
  const [aiTab, setAiTab] = useState<AiTab>("timeline");
  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editVisibility, setEditVisibility] = useState<WorkVisibility>("public");
  const [saving, setSaving] = useState(false);

  const resonateStored = useAppStore((s) => s.resonateCounts[workId]);
  const authUser = useAuthStore((s) => s.user);
  const requireLogin = useRequireLogin();

  const { data: work, isLoading, isError, refetch } = useQuery({ queryKey: ["work", workId], queryFn: () => getWorkById(workId) });
  const { data: chapters, isError: chaptersError, refetch: refetchChapters } = useQuery({ queryKey: ["chapters", workId], queryFn: () => getChapters(workId) });
  const { data: comments, isError: commentsError, refetch: refetchComments } = useQuery({ queryKey: ["comments", workId], queryFn: () => getComments(workId) });
  const { data: timeline } = useQuery({ queryKey: ["timeline", workId], queryFn: () => getWorkTimeline(workId) });
  const { data: emotion } = useQuery({ queryKey: ["emotion", workId], queryFn: () => getWorkEmotionCurve(workId) });
  const { data: graph } = useQuery({ queryKey: ["graph", workId], queryFn: () => getWorkCharacterGraph(workId) });
  const { data: lifeMap } = useQuery({ queryKey: ["lifeMap", workId], queryFn: () => getWorkLifeMap(workId) });
  const { data: related } = useQuery({ queryKey: ["related", workId], queryFn: () => getRelatedWorks(workId) });

  useEffect(() => {
    if (initialChapter != null) setReaderIdx(initialChapter);
  }, [initialChapter]);

  if (isLoading) return <DetailSkeleton />;
  if (isError) return <ErrorState title="加载失败" description="故事加载失败，请稍后重试" onRetry={() => refetch()} />;
  if (!work) return <EmptyState title="故事不存在" description="可能已被删除或链接有误" />;

  const category = getCategoryById(work.categoryL1);
  const color = work.coverColor ?? category?.color;
  const allComments = comments ?? [];
  const resonateCount = resonateStored ?? work.resonateCount;

  function openReader(idx: number) {
    setReaderIdx(idx);
    setReaderOpen(true);
  }

  function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function submitComment() {
    const v = commentText.trim();
    if (!v || posting) return;
    if (!requireLogin()) return;
    setPosting(true);
    try {
      await postComment(workId, v);
      queryClient.invalidateQueries({ queryKey: ["comments", workId] });
      queryClient.invalidateQueries({ queryKey: ["work", workId] });
      setCommentText("");
    } catch (e) {
      console.error("[comment] 评论失败", e);
    } finally {
      setPosting(false);
    }
  }

  const similarAuthors = (related ?? [])
    .map((w) => w.author)
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .slice(0, 4);

  const isAuthor = authUser?.id === work.authorId;

  const openEdit = () => {
    setEditTitle(work.title);
    setEditSummary(work.summary);
    setEditCategory(work.categoryL1);
    setEditTags((work.tags ?? []).join("，"));
    setEditVisibility(work.visibility);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateWork(workId, {
        title: editTitle.trim(),
        summary: editSummary.trim(),
        categoryL1: editCategory,
        tags: editTags.split(/[，,、\s]+/).filter(Boolean).slice(0, 6),
        visibility: editVisibility,
      });
      queryClient.invalidateQueries({ queryKey: ["work", workId] });
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> 返回
      </Link>

      {/* 作品信息 */}
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="w-full shrink-0 sm:w-44">
          <CoverImage title={work.title} color={color} ratio="3:4" photo={work.coverImage} className="rounded-2xl" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {category && <Badge color={category.color}>{category.name}</Badge>}
            {work.emotion && <Badge color={color}>{work.emotion}</Badge>}
            <span className="text-xs text-subtle">
              {work.status === "completed" ? "已完结" : "连载中"} · {formatCount(work.totalWords)} 字
            </span>
          </div>

          <h1 className="mt-2 font-serif text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {work.title}
          </h1>
          {work.subtitle && <p className="mt-1 text-sm text-muted">{work.subtitle}</p>}
          <p className="mt-2 text-sm leading-relaxed text-muted">{work.summary}</p>

          {/* 元数据：年份 · 人生阶段 · 职业 · 形式 */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
            {work.year && <span>{work.year} 年</span>}
            {work.lifeStage && <span>{work.lifeStage}</span>}
            {work.occupation && <span>{work.occupation}</span>}
            <span className="text-primary">{formatLabel(work.format)}</span>
          </div>
          <p className="mt-1 text-[11px] text-subtle">来源：{sourceLabel(work.storySource)}</p>

          {/* 作者 + 地点 */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link href={`/user/${work.authorId}`} className="flex items-center gap-2 rounded-full pr-1 transition-colors hover:bg-hover">
              <Avatar name={work.author.nickname} src={work.author.avatar} size="md" />
              <div>
                <p className="font-medium text-foreground">{work.author.nickname}</p>
                {work.author.region && <p className="text-xs text-subtle">{work.author.region}</p>}
              </div>
            </Link>
            <FollowButton authorId={work.authorId} followedBase={work.author.followed} size="sm" />
            {(work.city || work.country) && (
              <span className="flex items-center gap-1 text-xs text-subtle">
                <MapPin className="h-3.5 w-3.5" />
                {[work.city, work.country].filter(Boolean).join(" · ")}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-subtle">
              <Clock3 className="h-3.5 w-3.5" /> 约 {work.readMinutes} 分钟读完
            </span>
          </div>

          {/* 数据 */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-subtle">
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatCount(work.viewCount)} 阅读</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{formatCount(work.commentCount)} 评论</span>
          </div>

          {/* 操作按钮 */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={() => openReader(0)} className="gap-1.5">
              <Play className="h-4 w-4" /> 开始阅读
            </Button>
            <ResonateButton workId={workId} baseCount={work.resonateCount} />
            <LikeButton workId={workId} baseCount={work.likeCount} className="rounded-full border border-border px-4 py-2" />
            <CollectButton workId={workId} baseCount={work.collectCount} className="rounded-full border border-border px-4 py-2" />
            <Button variant="secondary" onClick={share} className="gap-1.5">
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {copied ? "已复制" : "分享"}
            </Button>
            {isAuthor && (
              <Button variant="secondary" onClick={openEdit} className="gap-1.5">
                <Pencil className="h-4 w-4" /> 编辑
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 共鸣条 —— 品牌级社交功能 */}
      <div className="rounded-2xl bg-accent/5 px-4 py-4 ring-1 ring-accent/20">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Users className="h-5 w-5" />
          </span>
          <p className="flex-1 text-sm text-muted">
            已经有 <span className="font-semibold text-foreground">{formatCount(resonateCount)}</span> 个人经历过类似的人生
          </p>
          <button
            onClick={() => setShowSimilar((s) => !s)}
            className="text-sm font-medium text-accent hover:underline"
          >
            {showSimilar ? "收起" : "查看相似人生"}
          </button>
        </div>

        {showSimilar && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {similarAuthors.length === 0 ? (
              <p className="text-sm text-subtle">暂时还没有找到相似的人生，也许你就是第一个。</p>
            ) : (
              similarAuthors.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-divider">
                  <Link href={`/user/${a.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                    <Avatar name={a.nickname} src={a.avatar} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{a.nickname}</p>
                      <p className="truncate text-xs text-subtle">
                        {[a.region, ...(a.tags ?? [])].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </Link>
                  <FollowButton authorId={a.id} followedBase={a.followed} size="sm" />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* AI 特色 */}
      <section>
        <h2 className="mb-3 flex items-center gap-1.5 text-base font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> AI 人生分析
        </h2>
        <div className="mb-4 flex gap-2">
          {([
            ["timeline", "章节脉络"],
            ["emotion", "情绪曲线"],
            ["character", "人物关系"],
            ["map", "人生地图"],
          ] as [AiTab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setAiTab(key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                aiTab === key ? "bg-primary font-medium text-inverse" : "bg-hover text-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-card p-4 ring-1 ring-divider sm:p-5">
          {aiTab === "timeline" &&
            (timeline && timeline.length > 0 ? (
              <Timeline nodes={timeline} onJump={(o) => openReader((o ?? 1) - 1)} />
            ) : (
              <AiPending label="章节脉络将从已发布的章节自动生成。" />
            ))}
          {aiTab === "emotion" &&
            (emotion && emotion.length > 0 ? (
              <div>
                <EmotionCurve points={emotion} />
                <div className="mt-2"><EmotionLegend /></div>
              </div>
            ) : (
              <AiPending label="情绪曲线需要 AI 情感分析，敬请期待。" />
            ))}
          {aiTab === "character" &&
            (graph && graph.nodes.length > 0 ? (
              <CharacterGraph nodes={graph.nodes} edges={graph.edges} />
            ) : (
              <AiPending label="人物关系图需要 AI 人物抽取，敬请期待。" />
            ))}
          {aiTab === "map" &&
            (lifeMap && lifeMap.length > 0 ? (
              <LifeMap locations={lifeMap} onJump={(o) => openReader((o ?? 1) - 1)} />
            ) : (
              <AiPending label="人生地图（地点标注）即将上线。" />
            ))}
        </div>
      </section>

      {/* 目录 */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-foreground">
          目录 <span className="ml-1 text-sm font-normal text-subtle">共 {chapters?.length ?? 0} 章</span>
        </h2>
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-divider">
          {chaptersError ? (
            <div className="p-4"><ErrorState title="目录加载失败" description="章节暂时无法加载，请稍后重试" onRetry={() => refetchChapters()} /></div>
          ) : (chapters ?? []).map((ch, i) => (
            <button
              key={ch.id}
              onClick={() => openReader(i)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover",
                i > 0 && "border-t border-divider"
              )}
            >
              <span className="w-6 shrink-0 text-center text-sm tabular-nums text-subtle">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{ch.title}</span>
              <span className="shrink-0 text-xs text-subtle">{ch.wordCount} 字</span>
            </button>
          ))}
        </div>
      </section>

      {/* 评论 */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-foreground">
          评论 <span className="ml-1 text-sm font-normal text-subtle">{allComments.length}</span>
        </h2>

        <div className="mb-4 flex items-center gap-2">
          <Avatar name={authUser?.nickname ?? "我"} src={authUser?.avatar} size="md" />
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            placeholder="写下你的共鸣…"
            className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <button
            onClick={submitComment}
            disabled={!commentText.trim() || posting}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-inverse transition-colors hover:bg-primary-dark disabled:opacity-40"
            aria-label="发送评论"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {commentsError ? (
          <ErrorState title="评论加载失败" description="评论暂时无法加载，请稍后重试" onRetry={() => refetchComments()} />
        ) : allComments.length === 0 ? (
          <EmptyState title="还没有评论" description="成为第一个留下共鸣的人吧" />
        ) : (
          <div className="space-y-3">
            {allComments.map((c) => (
              <CommentRow key={c.id} comment={c} workId={workId} />
            ))}
          </div>
        )}
      </section>

      {/* 相关推荐 */}
      {related && related.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">和你相似的人生</h2>
          <WorkMasonry works={related} />
        </section>
      )}

      {/* 编辑弹窗（仅作者可见） */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-card p-5 ring-1 ring-divider"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-foreground">编辑作品</h3>
              <button
                onClick={() => setEditOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-hover"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-muted">书名</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted">简介</label>
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted">分类</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted">标签（逗号分隔）</label>
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="如：北漂，成长"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted">可见范围</label>
                <div className="flex gap-2">
                  {(["public", "followers", "private"] as WorkVisibility[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setEditVisibility(v)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm ring-1 transition-colors",
                        editVisibility === v
                          ? "bg-primary text-inverse ring-primary"
                          : "bg-card text-muted ring-divider hover:text-foreground"
                      )}
                    >
                      {v === "public" ? "公开" : v === "followers" ? "仅关注者" : "仅自己"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(false)}>取消</Button>
              <Button onClick={saveEdit} disabled={!editTitle.trim() || saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "保存中…" : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 阅读器 */}
      {readerOpen && chapters && chapters.length > 0 && (
        <Reader
          chapters={chapters}
          initialIndex={readerIdx}
          title={work.title}
          workId={work.id}
          onClose={() => setReaderOpen(false)}
        />
      )}
    </div>
  );
}

function CommentRow({ comment, workId }: { comment: CommentItem; workId: string }) {
  const queryClient = useQueryClient();
  const requireLogin = useRequireLogin();
  const liked = useAppStore(selectIsCommentLiked(comment.id));
  const toggleCommentLike = useAppStore((s) => s.toggleCommentLike);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const replies = comment.replies ?? [];

  async function submitReply() {
    const v = replyText.trim();
    if (!v || replying) return;
    if (!requireLogin()) return;
    setReplying(true);
    try {
      await postComment(workId, v, comment.id);
      queryClient.invalidateQueries({ queryKey: ["comments", workId] });
      setReplyText("");
      setReplyOpen(false);
    } catch (e) {
      console.error("[comment] 回复失败", e);
    } finally {
      setReplying(false);
    }
  }

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-divider">
      <div className="flex items-center gap-2">
        <Link href={`/user/${comment.author.id}`}>
          <Avatar name={comment.author.nickname} src={comment.author.avatar} size="sm" />
        </Link>
        <span className="text-sm font-medium text-foreground">{comment.author.nickname}</span>
        <span className="text-xs text-subtle">{comment.createdAt}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{comment.content}</p>
      <div className="mt-2 flex items-center gap-4 text-xs text-subtle">
        <button
          onClick={() => {
            if (!requireLogin()) return;
            toggleCommentLike(comment.id);
            likeComment(workId, comment.id)
              .catch((e) => console.error("[comment] 评论点赞失败", e))
              .finally(() => queryClient.invalidateQueries({ queryKey: ["comments", workId] }));
          }}
          className="flex items-center gap-1 transition-colors hover:text-accent"
        >
          <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", liked && "fill-accent text-accent")} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 14c1.5-1.5 3-3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.5 1.5 4 3 5.5l7 7Z" />
          </svg>
          {formatCount(comment.likes)}
        </button>
        <button onClick={() => setReplyOpen((s) => !s)} className="transition-colors hover:text-primary">回复</button>
      </div>

      {replyOpen && (
        <div className="mt-2 flex items-center gap-2">
          <input
            autoFocus
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitReply()}
            placeholder={`回复 ${comment.author.nickname}…`}
            className="h-8 flex-1 rounded-full border border-border bg-background px-3 text-xs outline-none focus:border-primary"
          />
          <button onClick={submitReply} disabled={!replyText.trim() || replying} className="text-xs font-medium text-primary disabled:opacity-40">
            发送
          </button>
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-3 space-y-3 rounded-xl bg-hover p-3">
          {replies.map((r) => (
            <div key={r.id}>
              <div className="flex items-center gap-1.5">
                <Avatar name={r.author.nickname} src={r.author.avatar} size="xs" />
                <span className="text-xs font-medium text-foreground">{r.author.nickname}</span>
                <span className="text-[10px] text-subtle">{r.createdAt}</span>
              </div>
              <p className="mt-1 pl-5 text-sm text-muted">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        <Skeleton className="h-64 w-full rounded-2xl sm:w-44" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
