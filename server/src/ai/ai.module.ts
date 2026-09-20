import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiGateway } from "./ai.gateway";
import { AiConfigService } from "./ai-config.service";
import { AiUsageService } from "./ai-usage.service";
import { OpenRouterProvider } from "./providers/openrouter.provider";

@Module({
  controllers: [AiController],
  providers: [AiService, AiGateway, AiConfigService, AiUsageService, OpenRouterProvider],
  exports: [AiService, AiGateway],
})
export class AiModule {}
