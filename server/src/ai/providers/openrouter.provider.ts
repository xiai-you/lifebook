import { Injectable } from "@nestjs/common";
import {
  AiGenerateParams,
  AiGenerateResult,
  AiHealth,
  AiProvider,
  AiStructuredResult,
} from "../ai-provider.interface";
import { AiConfigService } from "../ai-config.service";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

/**
 * OpenRouter Provider —— 通过官方 REST API 调用（不引入 SDK）。
 * 模型入口 openrouter/free：由 OpenRouter 动态选择当前可用免费模型。
 */
@Injectable()
export class OpenRouterProvider implements AiProvider {
  readonly name = "openrouter";

  constructor(private readonly config: AiConfigService) {}

  private get apiKey(): string | undefined {
    return this.config.openRouterApiKey;
  }

  async generateText(params: AiGenerateParams): Promise<AiGenerateResult> {
    const key = this.apiKey;
    if (!key) throw new Error("AI_PROVIDER_NOT_CONFIGURED: OPENROUTER_API_KEY 未配置");

    const body = {
      model: params.model,
      messages: [
        ...(params.system ? [{ role: "system", content: params.system }] : []),
        { role: "user", content: params.prompt },
      ],
      max_tokens: params.maxTokens ?? this.config.maxOutputTokens,
      temperature: params.temperature ?? 0.7,
    };

    const res = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`OpenRouter 请求失败（${res.status}）：${detail.slice(0, 500)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const content = data?.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) {
      throw new Error("AI 返回内容为空（可能因 reasoning 模型截断，请增大 AI_MAX_OUTPUT_TOKENS）");
    }
    return {
      text: content,
      usage: {
        provider: this.name,
        model: params.model,
        inputTokens: data?.usage?.prompt_tokens ?? 0,
        outputTokens: data?.usage?.completion_tokens ?? 0,
      },
    };
  }

  async generateStructured<T>(params: AiGenerateParams): Promise<AiStructuredResult<T>> {
    const prompt = `${params.prompt}\n\n请只输出合法 JSON，不要包含解释或 Markdown 代码块。`;
    const result = await this.generateText({ ...params, prompt });
    const json = extractJson(result.text);
    let data: T;
    try {
      data = JSON.parse(json) as T;
    } catch {
      throw new Error(`AI 返回的内容不是合法 JSON：${result.text.slice(0, 200)}`);
    }
    return { data, usage: result.usage };
  }

  async healthCheck(model: string): Promise<AiHealth> {
    const key = this.apiKey;
    if (!key) {
      return {
        provider: this.name,
        model,
        enabled: false,
        reachable: false,
        error: "AI_PROVIDER_NOT_CONFIGURED",
      };
    }
    try {
      const res = await fetch(OPENROUTER_MODELS_URL, {
        headers: { Authorization: `Bearer ${key}` },
      });
      return {
        provider: this.name,
        model,
        enabled: true,
        reachable: res.ok,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      };
    } catch (e) {
      return {
        provider: this.name,
        model,
        enabled: true,
        reachable: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}

/** 从模型返回文本中提取 JSON（兼容 ```json 代码块包裹）。 */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text.trim();
}
