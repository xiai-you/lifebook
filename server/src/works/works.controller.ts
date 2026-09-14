import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { CreateWorkDto, QueryWorksDto, UpdateWorkDto } from "./dto/works.dto";
import { WorksService } from "./works.service";

@ApiTags("works")
@Controller("works")
export class WorksController {
  constructor(private readonly works: WorksService) {}

  @Public()
  @Get()
  list(@Query() query: QueryWorksDto) {
    return this.works.list(query);
  }

  // 关注流需要登录态
  @ApiBearerAuth()
  @Get("feed/follow")
  followFeed(@Query() query: QueryWorksDto, @CurrentUser() me: User) {
    return this.works.list({ ...query, sort: "follow" }, me.id);
  }

  @Public()
  @Get(":id")
  getById(@Param("id") id: string) {
    return this.works.getById(id);
  }

  @Public()
  @Get(":id/chapters")
  getChapters(@Param("id") id: string) {
    return this.works.getChapters(id);
  }

  @Public()
  @Get(":id/comments")
  getComments(@Param("id") id: string) {
    return this.works.getComments(id);
  }

  @Public()
  @Get(":id/related")
  getRelated(@Param("id") id: string) {
    return this.works.getRelated(id);
  }

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() me: User, @Body() dto: CreateWorkDto) {
    return this.works.create(me.id, dto);
  }

  @ApiBearerAuth()
  @Patch(":id")
  update(@CurrentUser() me: User, @Param("id") id: string, @Body() dto: UpdateWorkDto) {
    return this.works.update(id, me.id, dto);
  }

  @ApiBearerAuth()
  @Delete(":id")
  remove(@CurrentUser() me: User, @Param("id") id: string) {
    return this.works.remove(id, me.id);
  }

  @ApiBearerAuth()
  @Post(":id/like")
  like(@CurrentUser() me: User, @Param("id") id: string) {
    return this.works.toggleLike(id, me.id);
  }

  @ApiBearerAuth()
  @Post(":id/collect")
  collect(@CurrentUser() me: User, @Param("id") id: string) {
    return this.works.toggleCollect(id, me.id);
  }

  @ApiBearerAuth()
  @Post(":id/resonate")
  resonate(@CurrentUser() me: User, @Param("id") id: string) {
    return this.works.toggleResonate(id, me.id);
  }

  @ApiBearerAuth()
  @Post(":id/comments")
  comment(
    @CurrentUser() me: User,
    @Param("id") id: string,
    @Body() body: { content: string; parentId?: string },
  ) {
    return this.works.addComment(id, me.id, body.content, body.parentId);
  }

  @ApiBearerAuth()
  @Post(":id/comments/:commentId/like")
  likeComment(@CurrentUser() me: User, @Param("commentId") commentId: string) {
    return this.works.toggleCommentLike(commentId, me.id);
  }
}
