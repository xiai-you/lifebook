"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Bookmark, HeartHandshake, UserPlus, Check } from "lucide-react";
import { cn, formatCount } from "@/lib/utils";
import {
  useAppStore,
  selectIsLiked,
  selectIsCollected,
  selectIsResonated,
  selectIsFollowed,
  selectInteractionsHydrated,
} from "@/lib/store/useAppStore";
import { useRequireLogin } from "@/lib/store/useAuthStore";
import { likeWork, collectWork, resonateWork, setFollow } from "@/lib/api";

/**
 * 真实可交互的微交互按钮 —— 点赞（心跳 + 微粒子）/ 收藏（书签弹性）/ 共鸣（光爆 + 粒子）/ 关注。
 * 状态写入全局 store；未登录点击会跳转登录页。
 */

export function LikeButton({
  workId,
  baseCount,
  size = "md",
  className,
  showCount = true,
}: {
  workId: string;
  baseCount: number;
  size?: "sm" | "md";
  className?: string;
  showCount?: boolean;
}) {
  const liked = useAppStore(selectIsLiked(workId));
  const setLiked = useAppStore((s) => s.setLiked);
  const storedCount = useAppStore((s) => s.likeCounts[workId]);
  const setLikeCount = useAppStore((s) => s.setLikeCount);
  const requireLogin = useRequireLogin();
  const [pending, setPending] = useState(false);
  const [bump, setBump] = useState(0);
  const count = storedCount ?? baseCount;
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  async function handleLike() {
    if (!requireLogin() || pending) return;
    setPending(true);
    try {
      const res = await likeWork(workId);
      setLiked(workId, res.active);
      setLikeCount(workId, res.count);
      if (res.active) setBump((b) => b + 1);
    } catch (e) {
      console.error("[like] 点赞失败", e);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "取消赞" : "点赞"}
      className={cn(
        "group/like relative flex items-center gap-1.5 transition-colors",
        liked ? "text-accent" : "text-muted hover:text-accent",
        className
      )}
    >
      <span className="relative flex items-center justify-center">
        <motion.span
          key={liked ? "liked" : "unliked"}
          initial={{ scale: liked ? 0.6 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <Heart className={cn(icon, liked && "fill-current text-accent animate-heartbeat")} />
        </motion.span>
        <AnimatePresence>
          {bump > 0 && (
            <motion.span
              key={bump}
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {Array.from({ length: 6 }).map((_, i) => {
                const a = (i * 60 * Math.PI) / 180;
                return (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-accent"
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: Math.cos(a) * 16, y: Math.sin(a) * 16, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                );
              })}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {showCount && <span className="tabular-nums">{formatCount(count)}</span>}
    </button>
  );
}

export function CollectButton({
  workId,
  baseCount,
  className,
  showCount = true,
}: {
  workId: string;
  baseCount: number;
  className?: string;
  showCount?: boolean;
}) {
  const collected = useAppStore(selectIsCollected(workId));
  const setCollected = useAppStore((s) => s.setCollected);
  const storedCount = useAppStore((s) => s.collectCounts[workId]);
  const setCollectCount = useAppStore((s) => s.setCollectCount);
  const requireLogin = useRequireLogin();
  const [pending, setPending] = useState(false);
  const count = storedCount ?? baseCount;

  async function handleCollect() {
    if (!requireLogin() || pending) return;
    setPending(true);
    try {
      const res = await collectWork(workId);
      setCollected(workId, res.active);
      setCollectCount(workId, res.count);
    } catch (e) {
      console.error("[collect] 收藏失败", e);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleCollect}
      disabled={pending}
      aria-pressed={collected}
      aria-label={collected ? "取消收藏" : "收藏"}
      className={cn(
        "flex items-center gap-1.5 transition-colors",
        collected ? "text-primary" : "text-muted hover:text-primary",
        className
      )}
    >
      <motion.span
        animate={collected ? { y: [0, -3, 0], scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.35 }}
      >
        <Bookmark className={cn("h-5 w-5", collected && "fill-current")} />
      </motion.span>
      {showCount && <span className="tabular-nums">{formatCount(count)}</span>}
    </button>
  );
}

export function ResonateButton({
  workId,
  baseCount,
  className,
  size = "md",
}: {
  workId: string;
  baseCount: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const resonated = useAppStore(selectIsResonated(workId));
  const setResonated = useAppStore((s) => s.setResonated);
  const storedCount = useAppStore((s) => s.resonateCounts[workId]);
  const setResonateCount = useAppStore((s) => s.setResonateCount);
  const requireLogin = useRequireLogin();
  const [pending, setPending] = useState(false);
  const [bump, setBump] = useState(0);
  const count = storedCount ?? baseCount;
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  async function handleResonate() {
    if (!requireLogin() || pending) return;
    setPending(true);
    try {
      const res = await resonateWork(workId);
      setResonated(workId, res.active);
      setResonateCount(workId, res.count);
      if (res.active) setBump((b) => b + 1);
    } catch (e) {
      console.error("[resonate] 共鸣失败", e);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleResonate}
      disabled={pending}
      aria-pressed={resonated}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full font-medium transition-all",
        resonated
          ? "bg-accent text-white shadow-[0_6px_20px_rgba(255,138,101,0.4)]"
          : "bg-accent/10 text-accent hover:bg-accent/20",
        pad,
        className
      )}
    >
      <span className="relative">
        <HeartHandshake className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        <AnimatePresence>
          {bump > 0 && (
            <motion.span
              key={bump}
              className="pointer-events-none absolute -inset-2"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              {Array.from({ length: 8 }).map((_, i) => {
                const a = (i * 45 * Math.PI) / 180;
                return (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-accent"
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: Math.cos(a) * 22, y: Math.sin(a) * 22, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                );
              })}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {resonated ? "经历过" : "我也经历过"}
      <span className="tabular-nums">{formatCount(count)}</span>
    </button>
  );
}

export function FollowButton({
  authorId,
  followedBase = false,
  size = "sm",
  className,
}: {
  authorId: string;
  followedBase?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const followed = useAppStore(selectIsFollowed(authorId));
  const hydrated = useAppStore(selectInteractionsHydrated);
  const setFollowed = useAppStore((s) => s.setFollowed);
  const requireLogin = useRequireLogin();
  const [pending, setPending] = useState(false);
  // hydration 后以 store 为权威来源；之前用 props 的 followedBase 兜底，避免取消关注后
  // 因 react-query 缓存的 author.followed 仍为 true 而卡在「已关注」。
  const isFollowed = hydrated ? followed : followedBase;
  const pad = size === "sm" ? "h-8 px-4 text-sm" : "h-9 px-5 text-sm";

  async function handleFollow() {
    if (!requireLogin() || pending) return;
    const next = !isFollowed;
    setPending(true);
    try {
      await setFollow(authorId, next);
      setFollowed(authorId, next);
    } catch (e) {
      console.error("[follow] 关注失败", e);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleFollow}
      disabled={pending}
      className={cn(
        "flex items-center gap-1 rounded-full font-medium transition-all",
        isFollowed
          ? "bg-hover text-muted ring-1 ring-divider hover:text-foreground"
          : "bg-primary text-inverse hover:bg-primary-dark",
        pad,
        className
      )}
    >
      {isFollowed ? (
        <>
          <Check className="h-4 w-4" /> 已关注
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" /> 关注
        </>
      )}
    </button>
  );
}
