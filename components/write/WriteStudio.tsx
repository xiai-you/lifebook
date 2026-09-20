"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  Pencil,
  BookOpen,
  Check,
  Feather,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  publishStory,
  createDraft,
  updateDraft,
  getAiConversations,
  createAiConversation,
  getAiConversation,
  sendAiMessage,
  updateAiConversation,
  generateInterviewQuestion,
  uploadImage,
} from "@/lib/api";
import { extractLifeContext, emptyLifeContext, contextSummary } from "@/lib/ai/lifeContext";
import { useAppStore } from "@/lib/store/useAppStore";
import type { AiMessage, ContentBlock, WorkVisibility, LifeContext } from "@/types";

const TOPICS = [
  { id: "childhood", label: "童年", hint: "最初的记忆" },
  { id: "school", label: "学生时代", hint: "青春与成长" },
  { id: "firstjob", label: "第一次工作", hint: "踏入社会" },
  { id: "firstlove", label: "第一次恋爱", hint: "心动与告别" },
  { id: "family", label: "家庭", hint: "亲情与羁绊" },
  { id: "low", label: "人生低谷", hint: "至暗时刻" },
  { id: "turn", label: "人生转折", hint: "命运的拐点" },
  { id: "special", label: "某段特殊经历", hint: "独一无二" },
  { id: "recent", label: "从最近开始", hint: "此刻的生活" },
];

const GENERATION_STEPS = [
  "正在整理你的回答……",
  "正在生成章节结构……",
  "正在整理成初稿……",
];

type Step = "start" | "interview" | "generating" | "editor" | "publish" | "done";

export function WriteStudio() {
  const router = useRouter();
  const upsertDraft = useAppStore((s) => s.upsertDraft);

  const [step, setStep] = useState<Step>("start");
  const [topic, setTopic] = useState<string>("childhood");
  const [customTopic, setCustomTopic] = useState("");

  // 采访
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const convIdRef = useRef<string | null>(null);
  const draftIdRef = useRef<string | null>(null);
  const [storyContext, setStoryContext] = useState<LifeContext>(emptyLifeContext());

  // 生成
  const [genStep, setGenStep] = useState(0);

  // 结果 / 编辑
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [chapters, setChapters] = useState<{ title: string; blocks: ContentBlock[] }[]>([]);
  const imageRef = useRef<HTMLInputElement>(null);
  const [imageTarget, setImageTarget] = useState<number | null>(null);

  // 发布
  const [category, setCategory] = useState("growth");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<WorkVisibility>("public");
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [publishError, setPublishError] = useState(false);

  const topicLabel = customTopic.trim() || TOPICS.find((t) => t.id === topic)?.label || topic;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, aiThinking]);

  // 恢复最近一次未完成的采访（AI 记忆）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const convs = await getAiConversations();
        const active = convs.find((c) => c.status === "ACTIVE");
        if (!active || cancelled) return;
        const detail = await getAiConversation(active.id);
        if (!detail || cancelled) return;
        convIdRef.current = detail.id;
        setStoryContext(detail.storyContext ?? emptyLifeContext());
        setMessages(
          detail.messages.map((m) => ({
            id: m.id,
            role: m.role as "assistant" | "user",
            content: m.content,
            createdAt: "",
          }))
        );
        setReady(false);
        setStep("interview");
      } catch {
        // 无后端 / 未登录：忽略
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** 让 AI 生成下一个采访问题并展示 + 持久化。 */
  async function askQuestion() {
    if (!convIdRef.current) {
      setAiError("AI 暂时无法回应，请稍后再试。");
      return;
    }
    setAiThinking(true);
    setAiError(null);
    try {
      const { question } = await generateInterviewQuestion(convIdRef.current);
      const q = question.trim();
      setMessages((m) => [...m, { id: `ai-${Date.now()}`, role: "assistant", content: q, createdAt: "刚刚" }]);
      sendAiMessage(convIdRef.current, "assistant", q).catch((e) => console.error("[interview] 保存 AI 消息失败", e));
    } catch (e) {
      console.error("[interview] AI 生成问题失败", e);
      setAiError(
        e instanceof Error && e.message.includes("AI_USAGE_LIMIT_REACHED")
          ? "今日 AI 使用次数已达上限，请明天再试。"
          : "AI 暂时无法回应，请稍后再试。"
      );
    } finally {
      setAiThinking(false);
    }
  }

  async function startInterview() {
    const topicName = topicLabel;
    setStep("interview");
    setMessages([]);
    setAnswers([]);
    setReady(false);
    setStoryContext(emptyLifeContext());
    setAiError(null);
    const conv = await createAiConversation(topicName).catch(() => null);
    convIdRef.current = conv?.id ?? null;
    await askQuestion();
  }

  async function sendAnswer() {
    const v = input.trim();
    if (!v || aiThinking) return;
    setInput("");
    // 用户原话独立保存（role=user），绝不被 AI 覆盖。
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: v, createdAt: "刚刚" }]);
    setAnswers((a) => [...a, v]);

    if (convIdRef.current) sendAiMessage(convIdRef.current, "user", v).catch(() => {});
    // 规则版人生档案抽取（保留现有能力，非完整 Memory Extraction）
    const ctx = extractLifeContext(v, storyContext);
    setStoryContext(ctx);
    if (convIdRef.current) updateAiConversation(convIdRef.current, { storyContext: ctx }).catch(() => {});

    await askQuestion();
  }

  /** 结束采访，进入「整理成初稿」流程。 */
  function endInterview() {
    if (aiThinking) return;
    setReady(true);
  }

  function restart() {
    setMessages([]);
    setAnswers([]);
    setAiThinking(false);
    setAiError(null);
    setReady(false);
    setInput("");
  }

  function generate() {
    if (convIdRef.current) updateAiConversation(convIdRef.current, { status: "COMPLETED" }).catch(() => {});
    setStep("generating");
    setGenStep(0);
    const t = `关于「${topicLabel}」的故事`;
    const first = answers[0] ?? `关于「${topicLabel}」的一段记忆`;
    const second = answers[1] ?? "那时我还不懂，有些东西会一去不回。";
    const third = answers[2] ?? "直到很多年后，我才真正明白那个瞬间的分量。";
    const last = answers[3] ?? "谢谢你，过去的自己。";

    setTitle(t);
    setSummary(`${first} 这是关于「${topicLabel}」的一段真实人生。`);
    setChapters([
      { title: "第一章 · 开始", blocks: textToBlocks(first) },
      { title: "第二章 · 那时", blocks: textToBlocks(second) },
      { title: "第三章 · 回望", blocks: textToBlocks(`${third}\n\n${last}`) },
    ]);

    const stepDuration = 620;
    GENERATION_STEPS.forEach((_, i) => {
      setTimeout(() => setGenStep(i), i * stepDuration);
    });
    setTimeout(() => setStep("editor"), GENERATION_STEPS.length * stepDuration);
  }

  function updateBlock(i: number, bi: number, patch: Partial<ContentBlock>) {
    setChapters((cs) =>
      cs.map((c, j) =>
        j === i
          ? { ...c, blocks: c.blocks.map((b, k) => (k === bi ? ({ ...b, ...patch } as ContentBlock) : b)) }
          : c
      )
    );
  }

  function removeBlock(i: number, bi: number) {
    setChapters((cs) =>
      cs.map((c, j) => (j === i ? { ...c, blocks: c.blocks.filter((_, k) => k !== bi) } : c))
    );
  }

  function pickImage(i: number) {
    setImageTarget(i);
    imageRef.current?.click();
  }

  async function onImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const idx = imageTarget;
    setImageTarget(null);
    if (!file || idx == null) return;
    if (!file.type.startsWith("image/")) return;
    try {
      const { url } = await uploadImage(file);
      setChapters((cs) =>
        cs.map((c, j) => (j === idx ? { ...c, blocks: [...c.blocks, { type: "image", src: url } as ContentBlock] } : c))
      );
    } catch {
      // 上传失败：保留现有内容，不破坏草稿
    }
  }

  async function saveDraft() {
    const draftTitle = title || "未命名故事";
    const content = chapters
      .map((c) => `${c.title}\n${c.blocks.map(blockToText).join("\n")}`)
      .join("\n\n");
    setSaveStatus("saving");
    // 已有草稿则走 PATCH 更新，否则首次创建；复用同一个 id 避免重复草稿。
    let draftId = draftIdRef.current;
    try {
      if (draftId) {
        const updated = await updateDraft(draftId, { title: draftTitle, content });
        draftId = updated.id;
      } else {
        const created = await createDraft(draftTitle, content);
        draftId = created.id;
      }
      draftIdRef.current = draftId;
      // 服务端保存成功后才更新本地缓存并提示「已保存」
      upsertDraft({
        id: draftId,
        title: draftTitle,
        summary,
        content,
        updatedAt: new Date().toISOString().slice(0, 10),
      });
      setSaveStatus("saved");
      setStep("done");
      setPublishedId(null);
    } catch (e) {
      // 保存失败：明确提示，不冒充「已保存」
      console.error("[draft] 保存草稿失败", e);
      setSaveStatus("error");
    }
  }

  async function publish() {
    if (!title.trim() || publishing) return;
    setPublishing(true);
    setPublishError(false);
    try {
      const w = await publishStory({
        title: title.trim(),
        summary: summary.trim() || `关于「${topicLabel}」的一段真实人生。`,
        categoryL1: category,
        categoryL2: topicLabel,
        tags: tags.split(/[，,、\s]+/).filter(Boolean).slice(0, 6),
        chapters: chapters.map((c) => ({ title: c.title, blocks: c.blocks })),
        visibility,
      });
      setPublishedId(w.id);
      setStep("done");
    } catch (e) {
      // 发布失败：明确提示，可重试；不误报成功
      console.error("[publish] 发布失败", e);
      setPublishError(true);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      {/* 头部 */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">人生故事工作室</h1>
          <p className="mt-1 text-sm text-muted">不用想怎么写，先告诉我发生过什么。</p>
        </div>
        {step !== "start" && step !== "done" && (
          <button onClick={() => setStep("start")} className="flex items-center gap-1 text-sm text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> 重新开始
          </button>
        )}
      </div>

      {/* 步骤 1：选择起点 */}
      {step === "start" && (
        <div className="space-y-6">
          <h2 className="text-base font-semibold text-foreground">你想从人生的哪个阶段开始？</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TOPICS.map((t) => {
              const active = topic === t.id && !customTopic.trim();
              return (
                <button
                  key={t.id}
                  onClick={() => { setTopic(t.id); setCustomTopic(""); }}
                  className={cn(
                    "rounded-2xl p-4 text-left ring-1 transition-all",
                    active ? "bg-primary/10 ring-primary" : "bg-card ring-divider hover:ring-primary/40"
                  )}
                >
                  <p className={cn("text-sm font-semibold", active ? "text-primary" : "text-foreground")}>{t.label}</p>
                  <p className="mt-1 text-xs text-subtle">{t.hint}</p>
                </button>
              );
            })}
          </div>

          <div>
            <input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="或自己输入，比如：第一次离开家…"
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <Button onClick={startInterview} size="lg" className="gap-2">
            <Feather className="h-4 w-4" /> 开始讲述
          </Button>
        </div>
      )}

      {/* 步骤 2：AI 采访对话 */}
      {step === "interview" && (
        <div className="flex flex-1 flex-col">
          {/* 人生档案（AI 记忆：实时抽取） */}
          {Object.values(storyContext).some((arr) => arr.length > 0) && (
            <div className="mb-3 rounded-xl bg-primary/5 px-4 py-2.5 ring-1 ring-primary/15">
              <p className="text-xs font-medium text-primary">人生档案</p>
              {contextSummary(storyContext) && (
                <p className="mt-0.5 text-xs text-muted">{contextSummary(storyContext)}</p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {[...storyContext.people, ...storyContext.locations, ...storyContext.times, ...storyContext.events, ...storyContext.objects]
                  .slice(0, 8)
                  .map((t, i) => (
                    <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">{t}</span>
                  ))}
              </div>
            </div>
          )}

          <div ref={scrollRef} className="thin-scrollbar flex-1 space-y-4 overflow-y-auto pb-4 pr-1">
            {messages.map((m) => (
              <Bubble key={m.id} message={m} />
            ))}
            {aiThinking && <ThinkingBubble />}
            {aiError && (
              <p className="rounded-2xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{aiError}</p>
            )}

            {ready && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                <Button onClick={generate} className="gap-2">
                  <Sparkles className="h-4 w-4" /> 整理成初稿
                </Button>
              </motion.div>
            )}
          </div>

          {/* 输入区 */}
          <div className="mt-3 space-y-2 border-t border-divider pt-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAnswer()}
                placeholder={aiThinking ? "AI 正在思考…" : "说点什么，越具体越好…"}
                disabled={aiThinking || ready}
                className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
              />
              <button
                onClick={sendAnswer}
                disabled={!input.trim() || aiThinking}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-inverse transition-colors hover:bg-primary-dark disabled:opacity-40"
                aria-label="发送"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-subtle">
              {!ready && (
                <>
                  <button onClick={restart} className="flex items-center gap-1 hover:text-foreground">
                    <RefreshCw className="h-3 w-3" /> 重新采访
                  </button>
                  <button onClick={endInterview} disabled={aiThinking} className="flex items-center gap-1 hover:text-foreground disabled:opacity-40">
                    <Check className="h-3 w-3" /> 结束采访
                  </button>
                </>
              )}
              <span className="ml-auto">已回答 {answers.length} 个问题</span>
            </div>
          </div>
        </div>
      )}

      {/* 步骤 3：生成中 */}
      {step === "generating" && (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <div className="relative">
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              <Feather className="h-9 w-9" />
            </motion.div>
          </div>
          <div className="mt-6 h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={genStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm font-medium text-foreground"
              >
                {GENERATION_STEPS[genStep]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="mt-4 h-1 w-56 overflow-hidden rounded-full bg-hover">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${((genStep + 1) / GENERATION_STEPS.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* 步骤 4：编辑 */}
      {step === "editor" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
              <Pencil className="h-4 w-4 text-primary" /> 你的故事初稿
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">根据你的回答整理 · 你可以任意修改</span>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-serif text-2xl font-bold text-foreground outline-none"
            placeholder="书名"
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary"
            placeholder="简介"
          />

          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={onImageFile} />
          <div className="space-y-4">
            {chapters.map((ch, i) => (
              <div key={i} className="rounded-2xl bg-card p-4 ring-1 ring-divider">
                <input
                  value={ch.title}
                  onChange={(e) => setChapters((cs) => cs.map((c, j) => (j === i ? { ...c, title: e.target.value } : c)))}
                  className="mb-2 w-full text-base font-semibold text-foreground outline-none"
                />
                <div className="space-y-2">
                  {ch.blocks.map((b, bi) =>
                    b.type === "image" ? (
                      <div key={bi} className="relative overflow-hidden rounded-lg">
                        {b.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.src} alt={b.alt ?? ""} className="h-40 w-full object-cover" />
                        ) : (
                          <div className="flex h-40 w-full items-center justify-center bg-hover text-xs text-subtle">图片</div>
                        )}
                        <button
                          onClick={() => removeBlock(i, bi)}
                          className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white transition-colors hover:bg-black/80"
                        >
                          移除
                        </button>
                      </div>
                    ) : b.type === "paragraph" ? (
                      <textarea
                        key={bi}
                        value={b.text}
                        onChange={(e) => updateBlock(i, bi, { text: e.target.value })}
                        rows={3}
                        className="w-full resize-none rounded-lg bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    ) : (
                      <div key={bi} className="rounded-lg bg-hover px-3 py-2 text-xs text-subtle">{b.type}</div>
                    )
                  )}
                </div>
                <button onClick={() => pickImage(i)} className="mt-2 flex items-center gap-1 text-xs text-muted transition-colors hover:text-primary">
                  <ImageIcon className="h-3.5 w-3.5" /> 插入图片
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} variant="secondary" className="gap-1.5">
              <RefreshCw className="h-4 w-4" /> 重新生成
            </Button>
            <Button onClick={saveDraft} variant="secondary" disabled={saveStatus === "saving"} className="gap-1.5">
              {saveStatus === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saveStatus === "saving" ? "保存中…" : saveStatus === "saved" ? "已保存" : saveStatus === "error" ? "保存失败，重试" : "保存草稿"}
            </Button>
            <Button onClick={() => setStep("publish")} className="gap-1.5">
              下一步：发布 <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
          {saveStatus === "error" && (
            <p className="mt-2 text-xs text-danger">草稿保存失败，请检查网络后重试</p>
          )}
        </div>
      )}

      {/* 步骤 5：发布 */}
      {step === "publish" && (
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-foreground">发布你的故事</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="分类">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                {[
                  ["growth", "人生成长"], ["love", "情感"], ["family", "家庭"], ["career", "职场"],
                  ["school", "校园"], ["city", "城市生活"], ["mind", "心理"], ["health", "健康"],
                  ["travel", "旅行"], ["culture", "文化"], ["special", "特殊经历"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="标签（用逗号分隔）">
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="如：北漂，成长，治愈" className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
            </Field>
          </div>

          <Field label="可见范围">
            <div className="flex gap-2">
              {([
                ["public", "公开"], ["followers", "仅关注者"], ["private", "仅自己"],
              ] as [WorkVisibility, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setVisibility(v)} className={cn(
                  "rounded-full px-4 py-2 text-sm ring-1 transition-colors",
                  visibility === v ? "bg-primary text-inverse ring-primary" : "bg-card text-muted ring-divider hover:text-foreground"
                )}>
                  {l}
                </button>
              ))}
            </div>
          </Field>

          <div className="flex gap-2">
            <Button onClick={() => setStep("editor")} variant="secondary">返回编辑</Button>
            <Button onClick={publish} disabled={!title.trim() || publishing} className="gap-1.5">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {publishing ? "发布中…" : "发布故事"}
            </Button>
          </div>
          {publishError && (
            <p className="mt-2 text-xs text-danger">发布失败，请检查网络后重试</p>
          )}
        </div>
      )}

      {/* 完成 */}
      {step === "done" && (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </motion.div>
          <h2 className="mt-4 font-serif text-xl font-bold text-foreground">
            {publishedId ? "你的故事，已经来到这个世界。" : "草稿已保存。"}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {publishedId ? "《" + title + "》现在可以被读到了。谢谢你把人生写下来。" : "你随时可以回到这里继续书写。"}
          </p>
          <div className="mt-6 flex gap-3">
            {publishedId && (
              <Button onClick={() => router.push(`/story/${publishedId}`)} className="gap-1.5">
                <BookOpen className="h-4 w-4" /> 查看作品
              </Button>
            )}
            <Button variant="secondary" onClick={() => router.push("/me")}>回到个人主页</Button>
            <Button variant="ghost" onClick={() => setStep("start")}>再写一篇</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 纯文本 → 段落块（空行分段）。 */
function textToBlocks(text: string): ContentBlock[] {
  return text
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t): ContentBlock => ({ type: "paragraph", text: t }));
}

/** 内容块 → 纯文本（用于草稿序列化）。 */
function blockToText(b: ContentBlock): string {
  switch (b.type) {
    case "paragraph":
    case "heading":
    case "quote":
      return b.text;
    case "image":
      return "[图片]";
    default:
      return "";
  }
}

function Bubble({ message }: { message: AiMessage }) {
  const ai = message.role !== "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-2.5", ai ? "justify-start" : "justify-end")}>
      {ai && <Avatar name="采访" size="sm" className="bg-gradient-to-br from-[#5b8def] to-[#a06bf0]" />}
      <div className={cn(
        "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
        ai ? "rounded-tl-md bg-card text-foreground ring-1 ring-divider" : "rounded-tr-md bg-primary text-inverse"
      )}>
        {message.content}
      </div>
    </motion.div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-2.5">
      <Avatar name="采访" size="sm" className="bg-gradient-to-br from-[#5b8def] to-[#a06bf0]" />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-card px-4 py-3 text-sm text-subtle ring-1 ring-divider">
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.15s]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.3s]" />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-muted">{label}</label>
      {children}
    </div>
  );
}
