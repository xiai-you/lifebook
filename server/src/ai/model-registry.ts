/** 成本档位（仅作展示，不参与计费） */
export type AiCostTier = "FREE" | "LOW_COST" | "STANDARD" | "PREMIUM";

export interface AiModelEntry {
  provider: string;
  model: string;
  displayName: string;
  costTier: AiCostTier;
  enabled: boolean;
  isFreeTier?: boolean;
  /** 价格仅作后台展示，真正计费以后由 Provider 返回 usage 计算。 */
  pricing?: { inputPer1M?: number; outputPer1M?: number };
}

/**
 * 统一模型注册表。key = 模型标识（与 AI_*_MODEL 环境变量一致）。
 * 本阶段仅启用 openrouter/free；其余为预留注册（Provider 实现后续接入）。
 * openrouter/free 会由 OpenRouter 动态选择当前可用免费模型，故不写死具体名单。
 */
export const AI_MODEL_REGISTRY: Record<string, AiModelEntry> = {
  "openrouter/free": {
    provider: "openrouter",
    model: "openrouter/free",
    displayName: "OpenRouter Free",
    costTier: "FREE",
    enabled: true,
    isFreeTier: true,
  },

  // —— 预留（本阶段未启用 Provider 实现）——
  "gemini-3.8-flash": {
    provider: "gemini",
    model: "gemini-3.8-flash",
    displayName: "Gemini 3.8 Flash",
    costTier: "FREE",
    enabled: false,
    isFreeTier: true,
  },
  "openai/gpt-oss-20b": {
    provider: "groq",
    model: "openai/gpt-oss-20b",
    displayName: "Groq GPT-OSS 20B",
    costTier: "LOW_COST",
    enabled: false,
    pricing: { inputPer1M: 0.075, outputPer1M: 0.3 },
  },
  "gpt-5.6-luna": {
    provider: "openai",
    model: "gpt-5.6-luna",
    displayName: "OpenAI GPT-5.6 Luna",
    costTier: "LOW_COST",
    enabled: false,
  },
};

export function getModelEntry(model: string): AiModelEntry | undefined {
  return AI_MODEL_REGISTRY[model];
}
