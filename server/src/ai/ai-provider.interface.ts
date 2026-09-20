/** AI 生成参数 */
export interface AiGenerateParams {
  model: string;
  prompt: string;
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

/** Provider 返回的用量（用于成本统计，未来由 Provider 返回真实 usage） */
export interface AiUsageResult {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AiGenerateResult {
  text: string;
  usage: AiUsageResult;
}

export interface AiStructuredResult<T> {
  data: T;
  usage: AiUsageResult;
}

/** Provider 健康状态 */
export interface AiHealth {
  provider: string;
  model: string;
  enabled: boolean;
  reachable: boolean;
  error?: string;
}

/**
 * 统一 AI Provider 接口。
 * 业务层（AiService / AiGateway）只依赖本接口，不依赖任何一家 SDK。
 * 未来新增 Gemini / Groq / OpenAI Provider 时，各自实现本接口即可接入网关。
 */
export interface AiProvider {
  /** Provider 标识，如 "openrouter" / "gemini" / "groq" / "openai" */
  readonly name: string;
  generateText(params: AiGenerateParams): Promise<AiGenerateResult>;
  generateStructured<T>(params: AiGenerateParams): Promise<AiStructuredResult<T>>;
  healthCheck(model: string): Promise<AiHealth>;
}
