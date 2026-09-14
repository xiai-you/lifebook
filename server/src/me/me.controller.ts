import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { MeService } from "./me.service";
import { UpdateProfileDto, UpdateSettingsDto } from "./dto/me.dto";

@ApiTags("me")
@ApiBearerAuth()
@Controller("me")
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get("shelf")
  shelf(@CurrentUser() user: User) {
    return this.me.shelf(user.id);
  }

  @Get("collections")
  collections(@CurrentUser() user: User) {
    return this.me.collections(user.id);
  }

  /** 当前用户的互动状态（点赞/收藏/共鸣/关注 id 列表），供前端 hydrate。 */
  @Get("interactions")
  getInteractions(@CurrentUser() user: User) {
    return this.me.getInteractions(user.id);
  }

  /** 更新当前用户个人资料（持久化到数据库）。 */
  @Patch("profile")
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.me.updateProfile(user.id, dto);
  }

  /** 读取当前用户设置。 */
  @Get("settings")
  getSettings(@CurrentUser() user: User) {
    return this.me.getSettings(user.id);
  }

  /** 更新当前用户设置（持久化到数据库）。 */
  @Patch("settings")
  updateSettings(@CurrentUser() user: User, @Body() dto: UpdateSettingsDto) {
    return this.me.updateSettings(user.id, dto);
  }

  /** 记录阅读进度（继续阅读）。 */
  @Post("history")
  recordHistory(
    @CurrentUser() user: User,
    @Body() body: { workId: string; chapterOrder: number; chapterCount: number }
  ) {
    return this.me.recordHistory(user.id, body.workId, body.chapterOrder, body.chapterCount);
  }

  /** 书签列表。 */
  @Get("bookmarks")
  listBookmarks(@CurrentUser() user: User) {
    return this.me.listBookmarks(user.id);
  }

  /** 书签切换（加/取消）。 */
  @Post("bookmarks")
  toggleBookmark(
    @CurrentUser() user: User,
    @Body() body: { workId: string; chapterOrder: number }
  ) {
    return this.me.toggleBookmark(user.id, body.workId, body.chapterOrder);
  }

  /** 划线列表（可选按作品过滤）。 */
  @Get("highlights")
  listHighlights(@CurrentUser() user: User, @Query("workId") workId?: string) {
    return this.me.listHighlights(user.id, workId);
  }

  /** 创建划线（选择文字后标记，持久化到数据库）。 */
  @Post("highlights")
  createHighlight(
    @CurrentUser() user: User,
    @Body() body: { workId: string; chapterOrder: number; text: string }
  ) {
    return this.me.createHighlight(user.id, body.workId, body.chapterOrder, body.text);
  }

  /** 删除划线（仅本人）。 */
  @Delete("highlights/:id")
  deleteHighlight(@CurrentUser() user: User, @Param("id") id: string) {
    return this.me.deleteHighlight(user.id, id);
  }

  @Get("drafts")
  listDrafts(@CurrentUser() user: User) {
    return this.me.listDrafts(user.id);
  }

  @Post("drafts")
  createDraft(@CurrentUser() user: User, @Body() body: { title: string; content?: string }) {
    return this.me.createDraft(user.id, body.title, body.content);
  }

  @Patch("drafts/:id")
  updateDraft(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: { title?: string; content?: string }
  ) {
    return this.me.updateDraft(user.id, id, body);
  }

  @Delete("drafts/:id")
  deleteDraft(@CurrentUser() user: User, @Param("id") id: string) {
    return this.me.deleteDraft(user.id, id);
  }

  // ---------- AI 采访对话 ----------

  @Get("ai/conversations")
  listAiConversations(@CurrentUser() user: User) {
    return this.me.listAiConversations(user.id);
  }

  @Post("ai/conversations")
  createAiConversation(@CurrentUser() user: User, @Body() body: { topic?: string }) {
    return this.me.createAiConversation(user.id, body.topic);
  }

  @Get("ai/conversations/:id")
  getAiConversation(@CurrentUser() user: User, @Param("id") id: string) {
    return this.me.getAiConversation(user.id, id);
  }

  @Post("ai/conversations/:id/messages")
  appendAiMessage(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: { role: string; content: string }
  ) {
    return this.me.appendAiMessage(user.id, id, body.role, body.content);
  }

  @Patch("ai/conversations/:id")
  updateAiConversation(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() body: { currentStep?: number; storyContext?: Record<string, unknown>; status?: string }
  ) {
    return this.me.updateAiConversation(user.id, id, body);
  }
}
