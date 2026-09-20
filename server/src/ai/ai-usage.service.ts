import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiConfigService, AiFeature } from "./ai-config.service";
import type { AiUsageResult } from "./ai-provider.interface";

/** 达到每日请求上限时抛出（不偷偷产生额外费用）。 */
export class AiUsageLimitReachedError extends Error {
  constructor() {
    super("AI_USAGE_LIMIT_REACHED");
    this.name = "AiUsageLimitReachedError";
  }
}

/** AI 用量统计 + 每日请求限制。 */
@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AiConfigService,
  ) {}

  /** 每日请求上限检查：达到上限抛错，禁止继续调用 Provider。 */
  async assertWithinDailyLimit(): Promise<void> {
    const limit = this.config.dailyRequestLimit;
    const today = this.startOfToday();
    const count = await this.prisma.aiUsage.count({ where: { createdAt: { gte: today } } });
    if (count >= limit) throw new AiUsageLimitReachedError();
  }

  /** 记录一次 AI 调用用量（落库失败不阻断主流程）。 */
  async record(userId: string | undefined, feature: AiFeature, usage: AiUsageResult): Promise<void> {
    try {
      await this.prisma.aiUsage.create({
        data: {
          userId: userId ?? null,
          provider: usage.provider,
          model: usage.model,
          feature,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          estimatedCost: this.estimateCost(usage.model, usage.inputTokens, usage.outputTokens),
        },
      });
    } catch (e) {
      this.logger.error("[ai-usage] 记录失败", e);
    }
  }

  /** 估算成本：免费模型为 0；正式计费以后按价格表 + usage 计算。 */
  private estimateCost(_model: string, _inputTokens: number, _outputTokens: number): number {
    return 0;
  }

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
