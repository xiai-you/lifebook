import { Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { User } from "@prisma/client";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(":id")
  getProfile(@Param("id") id: string) {
    return this.users.getProfile(id);
  }

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
