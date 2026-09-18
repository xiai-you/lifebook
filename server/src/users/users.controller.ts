import { Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import type { User } from "@prisma/client";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // 作者主页公开：任何访客（含未登录 / SSR 无 token）都能查看资料与公开作品。
  @Public()
  @Get(":id")
  getProfile(@Param("id") id: string) {
    return this.users.getProfile(id);
  }

  @Public()
  @Get(":id/works")
  getWorks(@Param("id") id: string) {
    return this.users.getWorks(id);
  }

  @Post(":id/follow")
  follow(@CurrentUser() me: User, @Param("id") id: string) {
    return this.users.follow(me.id, id);
  }

  @Delete(":id/follow")
  unfollow(@CurrentUser() me: User, @Param("id") id: string) {
    return this.users.unfollow(me.id, id);
  }
}
