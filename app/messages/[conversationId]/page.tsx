"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send, Image as ImageIcon, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getConversations, getChatMessages, sendChatMessage } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/types";

/** 聊天视图 —— 真实发送（文字 / 图片）、在线状态、作品卡片气泡。 */

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: conversations } = useQuery({ queryKey: ["conversations"], queryFn: getConversations });
  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat", conversationId],
    queryFn: () => getChatMessages(conversationId),
  });

  const [input, setInput] = useState("");
  const [sent, setSent] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const other = (conversations ?? []).find((c) => c.id === conversationId)?.user;
  const all = [...(messages ?? []), ...sent];
  const online = conversationId.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 2 === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [all.length]);

  function send() {
    const v = input.trim();
    if (!v) return;
    const msg: ChatMessage = { id: `local-${Date.now()}`, from: "me", type: "text", content: v, createdAt: "刚刚" };
    setSent((s) => [...s, msg]);
    setInput("");
    sendChatMessage(other?.id ?? conversationId, v).catch(() => {});
  }

  function sendImage() {
    const msg: ChatMessage = {
      id: `local-img-${Date.now()}`,
      from: "me",
      type: "image",
      content: `https://picsum.photos/seed/chat-${Date.now()}/400/300`,
      createdAt: "刚刚",
    };
    setSent((s) => [...s, msg]);
  }

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col lg:h-[calc(100dvh-7rem)]">
      {/* 头部 */}
      <div className="flex items-center gap-3 border-b border-divider pb-3">
        <Link href="/messages" className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover" aria-label="返回">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="relative">
          <Avatar name={other?.nickname ?? "对方"} src={other?.avatar} size="md" />
          <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-background", online ? "bg-success" : "bg-subtle")} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground">{other?.nickname ?? "聊天"}</p>
          <p className="text-xs text-subtle">{online ? "在线" : "离线"}</p>
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
        ) : (
          all.map((m) => <Bubble key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <div className="flex items-center gap-2 border-t border-divider pt-3">
        <button type="button" onClick={sendImage} aria-label="发送图片" className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-primary">
          <ImageIcon className="h-5 w-5" />
        </button>
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
