import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * AI 特色服务：人生时间轴 / 情绪曲线 / 人物关系图 / 人生地图。
 *
 * 诚实原则：没有接入真实 AI Provider（LLM）前，绝不伪造分析结果。
 * - 时间轴：由真实章节结构推导（章节顺序 + 标题 + 作品年份），这是可真实得到的数据。
 * - 情绪曲线 / 人物关系：需要真实 NLP/LLM，未接入 → 返回空，前端展示「即将上线」。
 * - 人生地图：需要地点数据模型 + 地理编码，未接入 → 返回空，前端展示「即将上线」。
 */
@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

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

  /** 触发 AI 生成：未接入 AI Provider，明确告知尚未上线（不写入伪数据）。 */
  async generate(workId: string) {
    const work = await this.prisma.work.findUnique({ where: { id: workId } });
    if (!work) throw new NotFoundException("作品不存在");
    throw new ServiceUnavailableException("AI 生成能力即将上线");
  }
}
