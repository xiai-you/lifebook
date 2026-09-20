import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiGateway } from "./ai.gateway";
import { AiMode } from "./ai-config.service";
import type { AiHealth } from "./ai-provider.interface";

/** 人生采访系统提示词（真实性原则：AI 只追问、不编造，FACT SOURCE = 用户原话）。 */
const INTERVIEW_SYSTEM_PROMPT = `你是 LifeBook 的人生采访助手。
你的任务不是替用户编造人生，而是帮助用户回忆真实经历。
规则：
1. 只基于用户提供的信息进行追问。
2. 不可以凭空创造人物、地点、事件。
3. 不可以擅自修改用户提供的时间。
4. 不可以把猜测说成事实。
5. 遇到信息不足，优先提问。
6. 问题应该自然、温和、具体。
7. 每次尽量只问一个核心问题。
8. 不要像问卷一样连续罗列很多问题。
9. 鼓励用户讲故事，而不是只回答"是/否"。
10. 不要急着写小说。
11. 当前阶段主要任务是采访和理解用户人生经历。`;

/** 采访上下文最多携带的历史消息条数（控制 token）。 */
const INTERVIEW_MAX_HISTORY_MESSAGES = 20;

/** 把对话历史拼成纯文本（只取最近 N 条，控制上下文长度）。 */
function buildInterviewHistory(messages: { role: string; content: string }[]): string {
  return messages
    .slice(-INTERVIEW_MAX_HISTORY_MESSAGES)
    .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
    .join("\n");
}

function buildInterviewPrompt(topic: string | null, history: string): string {
  const topicLine = `【当前人生主题/阶段】${topic ?? "（未指定）"}`;
  if (!history) {
    return `${topicLine}\n\n这是采访的开始。请提出第一个自然、温和、具体的采访问题，帮助用户开始回忆这段人生经历。只输出问题本身，不要加解释或序号。`;
  }
  return `${topicLine}\n\n【采访历史】\n${history}\n\n请基于以上历史，提出下一个自然、温和、具体的采访问题。只输出问题本身，不要加解释或序号。`;
}

/**
 * LifeBook AI Service —— 业务层门面。
 * 业务层（WriteStudio 等）只调用本服务，不直接依赖任何 Provider SDK。
 */
@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: AiGateway,
  ) {}

  async getInsight(workId: string) {
    const work = await this.prisma.work.findUnique({
      where: { id: workId },
      include: {
        chapters: { orderBy: { order: "asc" }, select: { id: true, order: true, title: true } },
      },
    });
    if (!work) throw new NotFoundException("作品不存在");

    // 章节脉络：真实数据，非 AI 生成。
    const timeline = work.chapters.map((c) => ({
      id: c.id,
      year: work.year ?? "",
      title: c.title,
      chapterOrder: c.order,
    }));

    return {
      timeline,
      emotionCurve: null,
      characterGraph: null,
      lifeMap: [],
    };
  }

  /** 触发 AI 生成（作品级）：暂未接入 WriteStudio 链路，保留「即将上线」。 */
  async generate(workId: string) {
    const work = await this.prisma.work.findUnique({ where: { id: workId } });
    if (!work) throw new NotFoundException("作品不存在");
    throw new ServiceUnavailableException("AI 生成能力即将上线");
  }

  // ---------- AI Engine v1 基础设施 ----------

  /** Provider 健康检查（不返回 API Key）。 */
  health(mode?: AiMode): Promise<AiHealth> {
    return this.gateway.health(mode);
  }

  /** 最小真实调用：Gateway → Provider → Model 生成文本（用于验证链路打通）。 */
  async testGenerate(prompt: string, mode?: AiMode) {
    const result = await this.gateway.generateText(mode ?? "STANDARD", prompt, { feature: "INTERVIEW" });
    return { text: result.text, usage: result.usage };
  }

  // ---------- AI 人生采访 ----------

  /** 生成下一个采访问题（读取该 conversation 的历史，调用真实 AI）。 */
  async generateInterviewQuestion(userId: string, conversationId: string) {
    const conv = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conv) throw new NotFoundException("对话不存在");

    const history = buildInterviewHistory(conv.messages);
    const prompt = buildInterviewPrompt(conv.topic, history);

    const result = await this.gateway.generateText("STANDARD", prompt, {
      system: INTERVIEW_SYSTEM_PROMPT,
      userId,
      feature: "INTERVIEW",
    });
    return { question: result.text.trim(), usage: result.usage };
  }
}
