import { Injectable, Logger } from "@nestjs/common";
import {
  AiGenerateResult,
  AiHealth,
  AiProvider,
  AiStructuredResult,
} from "./ai-provider.interface";
import { OpenRouterProvider } from "./providers/openrouter.provider";
import { AiConfigService, AiFeature, AiMode } from "./ai-config.service";
import { AiUsageLimitReachedError, AiUsageService } from "./ai-usage.service";

/**
 * AI Gateway —— 业务层唯一入口。
 * 职责：解析模式 → 查找 Provider/Model → 调用 → 记录 usage → 错误处理 → fallback。
 * 业务层不直接依赖任何一家 Provider SDK。
 */
@Injectable()
export class AiGateway {
  private readonly logger = new Logger(AiGateway.name);
  private readonly providers: Map<string, AiProvider>;

  constructor(
    private readonly config: AiConfigService,
    private readonly usage: AiUsageService,
    openRouter: OpenRouterProvider,
  ) {
    // 本阶段仅注册 OpenRouter；未来在此注册 Gemini / Groq / OpenAI。
    this.providers = new Map([[openRouter.name, openRouter]]);
  }

  async generateText(
    mode: AiMode,
    prompt: string,
    opts: { system?: string; userId?: string; feature?: AiFeature } = {},
  ): Promise<AiGenerateResult> {
    const feature = opts.feature ?? "INTERVIEW";
    await this.usage.assertWithinDailyLimit();
    const { provider, model } = this.config.resolveMode(mode);
    const impl = this.requireProvider(provider);

    try {
      const result = await impl.generateText({
        model,
        prompt,
        system: opts.system,
        maxTokens: this.config.maxOutputTokens,
      });
      await this.usage.record(opts.userId, feature, result.usage);
      return result;
    } catch (e) {
      if (e instanceof AiUsageLimitReachedError) throw e;
      this.logger.error(`[ai-gateway] ${provider}/${model} 调用失败`, e);
      return this.tryFallback(feature, prompt, opts);
    }
  }

  async generateStructured<T>(
    mode: AiMode,
    prompt: string,
    opts: { system?: string; userId?: string; feature?: AiFeature } = {},
  ): Promise<AiStructuredResult<T>> {
    const feature = opts.feature ?? "MEMORY_EXTRACTION";
    await this.usage.assertWithinDailyLimit();
    const { provider, model } = this.config.resolveMode(mode);
    const impl = this.requireProvider(provider);

    try {
      const result = await impl.generateStructured<T>({
        model,
        prompt,
        system: opts.system,
        maxTokens: this.config.maxOutputTokens,
      });
      await this.usage.record(opts.userId, feature, result.usage);
      return result;
    } catch (e) {
      if (e instanceof AiUsageLimitReachedError) throw e;
      this.logger.error(`[ai-gateway] ${provider}/${model} 结构化调用失败`, e);
      return this.tryFallbackStructured<T>(feature, prompt, opts);
    }
  }

  /** 健康检查：返回当前模式的 provider/model/enabled/reachable（不含 Key）。 */
  async health(mode?: AiMode): Promise<AiHealth> {
    const m = mode ?? this.config.defaultMode;
    const { provider, model } = this.config.resolveMode(m);
    const impl = this.providers.get(provider);
    if (!impl) {
      return { provider, model, enabled: false, reachable: false, error: `未注册的 Provider: ${provider}` };
    }
    return impl.healthCheck(model);
  }

  private requireProvider(provider: string): AiProvider {
    const impl = this.providers.get(provider);
    if (!impl) throw new Error(`未注册的 AI Provider: ${provider}`);
    return impl;
  }

  private async tryFallback(
    feature: AiFeature,
    prompt: string,
    opts: { system?: string; userId?: string },
  ): Promise<AiGenerateResult> {
    const fb = this.config.getFallback();
    if (!fb) throw new Error("AI 调用失败，且未配置 fallback Provider");
    const fbImpl = this.providers.get(fb.provider);
    if (!fbImpl) throw new Error(`fallback Provider 未注册: ${fb.provider}`);
    const result = await fbImpl.generateText({
      model: fb.model,
      prompt,
      system: opts.system,
      maxTokens: this.config.maxOutputTokens,
    });
    await this.usage.record(opts.userId, feature, result.usage);
    return result;
  }

  private async tryFallbackStructured<T>(
    feature: AiFeature,
    prompt: string,
    opts: { system?: string; userId?: string },
  ): Promise<AiStructuredResult<T>> {
    const fb = this.config.getFallback();
    if (!fb) throw new Error("AI 调用失败，且未配置 fallback Provider");
    const fbImpl = this.providers.get(fb.provider);
    if (!fbImpl) throw new Error(`fallback Provider 未注册: ${fb.provider}`);
    const result = await fbImpl.generateStructured<T>({
      model: fb.model,
      prompt,
      system: opts.system,
      maxTokens: this.config.maxOutputTokens,
    });
    await this.usage.record(opts.userId, feature, result.usage);
    return result;
  }
}
