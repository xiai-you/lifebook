import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { MessagesService } from "./messages.service";

@ApiTags("messages")
@ApiBearerAuth()
@Controller("messages")
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get("conversations")
  conversations(@CurrentUser() me: User) {
    return this.messages.conversations(me.id);
  }

  @Get("conversations/:id")
  getMessages(@CurrentUser() me: User, @Param("id") id: string) {
    return this.messages.messages(me.id, id);
  }

  @Post("conversations/:toId")
  send(
    @CurrentUser() me: User,
    @Param("toId") toId: string,
    @Body() body: { content: string; type?: "TEXT" | "IMAGE" | "GIF" | "EMOJI" | "WORK"; workId?: string },
  ) {
    return this.messages.send(me.id, toId, body.content, body.type ?? "TEXT", body.workId);
  }
}
