import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AiService } from "./ai.service";
import type { AiMode } from "./ai-config.service";
import type { User } from "@prisma/client";

@ApiTags("ai")
@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Public()
  @Get("works/:workId/insight")
  getInsight(@Param("workId") workId: string) {
    return this.ai.getInsight(workId);
  }

  @ApiBearerAuth()
  @Post("works/:workId/generate")
  generate(@Param("workId") workId: string) {
    return this.ai.generate(workId);
  }

  /** AI 引擎健康检查（不返回 API Key）。 */
  @Public()
  @Get("health")
  health() {
    return this.ai.health();
  }

  /** 最小真实调用测试（开发阶段临时公开，受每日请求上限保护；正式上线前需加鉴权）。 */
  @Public()
  @Post("test")
  test(@Body() body: { prompt?: string; mode?: AiMode }) {
    return this.ai.testGenerate(body?.prompt ?? "Reply with OK.", body?.mode);
  }

  /** 生成下一个采访问题（真实 AI，基于 conversation 历史）。 */
  @ApiBearerAuth()
  @Post("interview/question")
  generateInterviewQuestion(@CurrentUser() me: User, @Body() body: { conversationId: string }) {
    return this.ai.generateInterviewQuestion(me.id, body.conversationId);
  }
}
