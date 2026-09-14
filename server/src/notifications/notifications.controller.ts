import { Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() me: User) {
    return this.notifications.list(me.id);
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() me: User) {
    return this.notifications.markAllRead(me.id);
  }

  @Patch(":id/read")
  markRead(@CurrentUser() me: User, @Param("id") id: string) {
    return this.notifications.markRead(me.id, id);
  }
}
