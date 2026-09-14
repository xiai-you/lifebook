import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";

/** 健康检查 —— 供 Railway / 网关探活。返回 { status: "ok" }。 */
@ApiTags("health")
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: "ok" };
  }
}
