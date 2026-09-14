import { Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { AiService } from "./ai.service";

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
}
