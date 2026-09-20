import { Injectable } from "@nestjs/common";

export type AiMode = "FAST" | "STANDARD" | "DEEP";
export type AiFeature = "INTERVIEW" | "MEMORY_EXTRACTION" | "CHAPTER_GENERATION" | "POLISH";

const AI_MODES: AiMode[] = ["FAST", "STANDARD", "DEEP"];

/**
 * AI 配置服务：从服务器环境变量读取模型映射与限制。
 * API Key 只从环境变量读取，绝不进入前端 / 数据库 / 代码。
 */
@Injectable()
export class AiConfigService {
  get openRouterApiKey(): string | undefined {
    return process.env.OPENROUTER_API_KEY?.trim() || undefined;
  }

  get defaultMode(): AiMode {
    return this.parseMode(process.env.AI_DEFAULT_MODE) ?? "STANDARD";
  }

  get dailyRequestLimit(): number {
    return this.positiveInt(process.env.AI_DAILY_REQUEST_LIMIT, 50);
  }

  get maxOutputTokens(): number {
    // 默认给足 token：openrouter/free 可能路由到 reasoning 模型，思考链会占用输出 token。
    return this.positiveInt(process.env.AI_MAX_OUTPUT_TOKENS, 2048);
  }

  /** 三种用户体验模式 → provider/model 映射（默认都指向 openrouter/free）。 */
  resolveMode(mode: AiMode): { provider: string; model: string } {
    switch (mode) {
      case "FAST":
        return {
          provider: this.env("AI_FAST_PROVIDER", "openrouter"),
          model: this.env("AI_FAST_MODEL", "openrouter/free"),
        };
      case "STANDARD":
        return {
          provider: this.env("AI_STANDARD_PROVIDER", "openrouter"),
          model: this.env("AI_STANDARD_MODEL", "openrouter/free"),
        };
      case "DEEP":
        return {
          provider: this.env("AI_DEEP_PROVIDER", "openrouter"),
          model: this.env("AI_DEEP_MODEL", "openrouter/free"),
        };
    }
  }

  /** fallback provider/model（可选，未配置返回 null）。 */
  getFallback(): { provider: string; model: string } | null {
    const provider = process.env.AI_FALLBACK_PROVIDER?.trim();
    const model = process.env.AI_FALLBACK_MODEL?.trim();
    return provider && model ? { provider, model } : null;
  }

  parseMode(v: string | undefined): AiMode | undefined {
    return v && (AI_MODES as string[]).includes(v) ? (v as AiMode) : undefined;
  }

  private env(key: string, fallback: string): string {
    return process.env[key]?.trim() || fallback;
  }

  private positiveInt(v: string | undefined, fallback: number): number {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  }
}
