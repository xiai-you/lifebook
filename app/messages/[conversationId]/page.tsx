"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send, Image as ImageIcon, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getConversations, getChatMessages, sendChatMessage, uploadImage } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import type { ChatMessage } from "@/types";

/** 聊天视图 —— 真实发送（文字 / 图片）、作品卡片气泡。 */

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: conversations } = useQuery({ queryKey: ["conversations"], queryFn: getConversations });
  const { data: messages, isLoading, isError, refetch } = useQuery({
    queryKey: ["chat", conversationId],
    queryFn: () => getChatMessages(conversationId),
  });

  const [input, setInput] = useState("");
  const [sent, setSent] = useState<ChatMessage[]>([]);
  const [sendingImage, setSendingImage] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const other = (conversations ?? []).find((c) => c.id === conversationId)?.user;
  const all = [...(messages ?? []), ...sent];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [all.length]);

  function send() {
    const v = input.trim();
    if (!v) return;
    const msg: ChatMessage = { id: `local-${Date.now()}`, from: "me", type: "text", content: v, createdAt: "刚刚" };
    setSent((s) => [...s, msg]);
    setInput("");
    sendChatMessage(other?.id ?? conversationId, v).catch((e) => console.error("[chat] 发送失败", e));
  }

  function pickImage() {
    fileRef.current?.click();
  }

  async function onImageSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSendingImage(true);
    try {
      // 真实上传到后端存储，再作为图片消息发出（不再使用随机占位图）。
      const { url } = await uploadImage(file);
      await sendChatMessage(other?.id ?? conversationId, url, "image");
      setSent((s) => [...s, { id: `local-img-${Date.now()}`, from: "me", type: "image", content: url, createdAt: "刚刚" }]);
    } catch (err) {
      console.error("[chat] 图片发送失败", err);
    } finally {
      setSendingImage(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col lg:h-[calc(100dvh-7rem)]">
      {/* 头部 */}
      <div className="flex items-center gap-3 border-b border-divider pb-3">
        <Link href="/messages" className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover" aria-label="返回">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar name={other?.nickname ?? "对方"} src={other?.avatar} size="md" />
        <div className="min-w-0">
          <p className="font-medium text-foreground">{other?.nickname ?? "聊天"}</p>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="thin-scrollbar flex-1 space-y-4 overflow-y-auto py-4 pr-1">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                <Skeleton className="h-12 w-2/3 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState title="加载失败" description="消息暂时无法加载，请稍后重试" onRetry={() => refetch()} />
        ) : (
          all.map((m) => <Bubble key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <div className="flex items-center gap-2 border-t border-divider pt-3">
        <button type="button" onClick={pickImage} disabled={sendingImage} aria-label="发送图片" className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-primary disabled:opacity-40">
          <ImageIcon className="h-5 w-5" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onImageSelected} className="hidden" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="说点什么…"
          className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <button onClick={send} disabled={!input.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-inverse transition-colors hover:bg-primary-dark disabled:opacity-40" aria-label="发送">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.from === "me";

  if (message.type === "work" && message.workId) {
    return (
      <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
        <Link href={`/story/${message.workId}`} className="flex w-64 items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-divider transition-colors hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-6 w-6" /></div>
          <div className="min-w-0">
            <p className="text-xs text-subtle">分享的故事</p>
            <p className="truncate text-sm font-medium text-foreground">{message.content}</p>
          </div>
        </Link>
      </div>
    );
  }

  if (message.type === "emoji") {
    return <div className={cn("flex", mine ? "justify-end" : "justify-start")}><span className="text-4xl leading-none">{message.content}</span></div>;
  }

  if (message.type === "image") {
    return (
      <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={message.content} alt="图片消息" className="max-w-[70%] rounded-2xl object-cover" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed", mine ? "rounded-br-md bg-primary text-inverse" : "rounded-bl-md bg-card text-foreground ring-1 ring-divider")}>
        {message.content}
      </div>
      <span className="mt-1 text-[10px] text-subtle">{message.createdAt}</span>
    </div>
  );
}
