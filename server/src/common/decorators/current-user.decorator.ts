import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { User } from "@prisma/client";

/** 从请求上下文取出当前登录用户（由 JwtStrategy 挂载到 req.user）。 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  return ctx.switchToHttp().getRequest().user;
});
