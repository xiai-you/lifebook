import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto, UpdateSettingsDto } from "./dto/me.dto";

const AUTHOR_SELECT = {
  id: true,
  nickname: true,
  avatar: true,
  bio: true,
  tags: true,
  region: true,
  country: true,
  _count: { select: { followers: true, works: true } },
} satisfies Prisma.UserSelect;

const WORK_INCLUDE = { author: { select: AUTHOR_SELECT }, tags: true } satisfies Prisma.WorkInclude;

/** 「我的」个人数据：书架（阅读进度）、收藏夹。 */
@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async shelf(userId: string) {
    return this.prisma.shelfItem.findMany({
      where: { userId },
      orderBy: { lastReadAt: "desc" },
      include: { work: { include: WORK_INCLUDE } },
    });
  }

  async collections(userId: string) {
    const items = await this.prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { work: { include: WORK_INCLUDE } },
    });
    // 统一为书架条目形状（收藏夹无阅读进度）
    return items.map((c) => ({
      work: c.work,
      progress: 0,
      lastChapterOrder: 0,
      lastReadAt: c.createdAt,
    }));
  }

  /** 当前用户的互动状态（点赞/收藏/共鸣/关注），供前端 hydrate。 */
  async getInteractions(userId: string) {
    const [likes, collections, resonates, following, commentLikes, bookmarks] = await Promise.all([
      this.prisma.like.findMany({ where: { userId }, select: { workId: true } }),
      this.prisma.collection.findMany({ where: { userId }, select: { workId: true } }),
      this.prisma.resonate.findMany({ where: { userId }, select: { workId: true } }),
      this.prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
      this.prisma.commentLike.findMany({ where: { userId }, select: { commentId: true } }),
      this.prisma.bookmark.findMany({ where: { userId }, select: { workId: true, chapterOrder: true } }),
    ]);
    return {
      likedWorkIds: likes.map((l) => l.workId),
      collectedWorkIds: collections.map((c) => c.workId),
      resonatedWorkIds: resonates.map((r) => r.workId),
      followedAuthorIds: following.map((f) => f.followingId),
      likedCommentIds: commentLikes.map((c) => c.commentId),
      bookmarkedChapters: bookmarks.map((b) => `${b.workId}:${b.chapterOrder}`),
    };
  }

  /** 更新个人资料（昵称/简介/头像/地区/兴趣/标签），返回脱敏后的用户。 */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.nickname !== undefined) data.nickname = dto.nickname;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
    if (dto.region !== undefined) data.region = dto.region;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.gender !== undefined) data.gender = dto.gender.toUpperCase();
    if (dto.interests !== undefined) data.interests = JSON.stringify(dto.interests);
    if (dto.tags !== undefined) data.tags = JSON.stringify(dto.tags);

    const user = await this.prisma.user.update({ where: { id: userId }, data });
    const { passwordHash, oauthId, email, oauthProvider, ...safe } = user;
    return safe;
  }

  /** 读取当前用户设置（解析 JSON）。 */
  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });
    if (!user) throw new NotFoundException("用户不存在");
    try {
      return JSON.parse(user.settings || "{}");
    } catch {
      return {};
    }
  }

  /** 合并更新用户设置并落库。 */
  async updateSettings(userId: string, patch: UpdateSettingsDto) {
    const current = await this.getSettings(userId);
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    );
    const next = { ...current, ...clean };
    await this.prisma.user.update({
      where: { id: userId },
      data: { settings: JSON.stringify(next) },
    });
    return next;
  }

  /** 记录阅读进度（继续阅读）。 */
  async recordHistory(userId: string, workId: string, chapterOrder: number, chapterCount: number) {
    const progress = chapterCount > 0 ? Math.min(1, chapterOrder / chapterCount) : 0;
    return this.prisma.shelfItem.upsert({
      where: { userId_workId: { userId, workId } },
      create: { userId, workId, progress, lastChapterOrder: chapterOrder },
      update: { progress, lastChapterOrder: chapterOrder, lastReadAt: new Date() },
    });
  }

  /** 书签列表（含作品信息）。 */
  listBookmarks(userId: string) {
    return this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { work: { include: WORK_INCLUDE } },
    });
  }

  /** 书签切换（用户在某作品中对某一章节加/取消书签）。 */
  async toggleBookmark(userId: string, workId: string, chapterOrder: number) {
    const where = { userId_workId_chapterOrder: { userId, workId, chapterOrder } };
    const existing = await this.prisma.bookmark.findUnique({ where });
    if (existing) {
      await this.prisma.bookmark.delete({ where });
      return { active: false };
    }
    await this.prisma.bookmark.create({ data: { userId, workId, chapterOrder } });
    return { active: true };
  }

  /** 划线列表（可选按作品过滤，含作品标题）。 */
  listHighlights(userId: string, workId?: string) {
    return this.prisma.highlight.findMany({
      where: { userId, ...(workId ? { workId } : {}) },
      orderBy: { createdAt: "desc" },
      include: { work: { select: { id: true, title: true } } },
    });
  }

  /** 创建划线（同一作品同一章节的相同文字去重，重复时返回已有记录）。 */
  async createHighlight(userId: string, workId: string, chapterOrder: number, text: string) {
    const trimmed = (text ?? "").trim();
    if (!trimmed) throw new BadRequestException("划线内容不能为空");
    const existing = await this.prisma.highlight.findUnique({
      where: { userId_workId_chapterOrder_text: { userId, workId, chapterOrder, text: trimmed } },
    });
    if (existing) return existing;
    return this.prisma.highlight.create({
      data: { userId, workId, chapterOrder, text: trimmed },
    });
  }

  /** 删除划线（仅本人）。 */
  async deleteHighlight(userId: string, id: string) {
    const highlight = await this.prisma.highlight.findFirst({ where: { id, userId } });
    if (!highlight) throw new NotFoundException("划线不存在");
    await this.prisma.highlight.delete({ where: { id } });
    return { ok: true };
  }

  /** 草稿列表。 */
  listDrafts(userId: string) {
    return this.prisma.draft.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  }

  /** 创建 / 保存草稿。 */
  createDraft(userId: string, title: string, content?: string) {
    return this.prisma.draft.create({ data: { userId, title, content } });
  }

  /** 更新草稿。 */
  async updateDraft(userId: string, id: string, data: { title?: string; content?: string }) {
    const draft = await this.prisma.draft.findFirst({ where: { id, userId } });
    if (!draft) throw new NotFoundException("草稿不存在");
    return this.prisma.draft.update({ where: { id }, data });
  }

  /** 删除草稿。 */
  async deleteDraft(userId: string, id: string) {
    const draft = await this.prisma.draft.findFirst({ where: { id, userId } });
    if (!draft) throw new NotFoundException("草稿不存在");
    await this.prisma.draft.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- AI 采访对话（记忆） ----------

  listAiConversations(userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, topic: true, currentStep: true, status: true, updatedAt: true },
    });
  }

  async getAiConversation(userId: string, id: string) {
    const conv = await this.prisma.aiConversation.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conv) throw new NotFoundException("对话不存在");
    return { ...conv, storyContext: this.parseJson(conv.storyContext) };
  }

  async createAiConversation(userId: string, topic?: string) {
    return this.prisma.aiConversation.create({ data: { userId, topic } });
  }

  async appendAiMessage(userId: string, conversationId: string, role: string, content: string) {
    const conv = await this.prisma.aiConversation.findFirst({ where: { id: conversationId, userId } });
    if (!conv) throw new NotFoundException("对话不存在");
    return this.prisma.aiMessage.create({ data: { conversationId, role, content } });
  }

  async updateAiConversation(
    userId: string,
    id: string,
    patch: { currentStep?: number; storyContext?: Record<string, unknown>; status?: string }
  ) {
    const conv = await this.prisma.aiConversation.findFirst({ where: { id, userId } });
    if (!conv) throw new NotFoundException("对话不存在");
    const data: Prisma.AiConversationUpdateInput = {};
    if (patch.currentStep !== undefined) data.currentStep = patch.currentStep;
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.storyContext !== undefined) data.storyContext = JSON.stringify(patch.storyContext);
    return this.prisma.aiConversation.update({ where: { id }, data });
  }

  private parseJson(v: string) {
    try {
      return JSON.parse(v || "{}");
    } catch {
      return {};
    }
  }
}
