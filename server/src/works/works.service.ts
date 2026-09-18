import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AUTHOR_SELECT, WORK_INCLUDE } from "../prisma/selects";
import { ChapterInputDto, CreateWorkDto, QueryWorksDto, UpdateWorkDto } from "./dto/works.dto";

/** 作品服务：信息流 / 分类 / 详情 / 章节 / 互动 / 评论 / 相关推荐。 */
@Injectable()
export class WorksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryWorksDto, viewerId?: string) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 8;

    const where: Prisma.WorkWhereInput = {
      visibility: "PUBLIC",
      ...(query.category ? { categoryL1: query.category } : {}),
      ...(query.subCategory ? { categoryL2: query.subCategory } : {}),
      ...(query.author ? { authorId: query.author } : {}),
      ...(query.tag ? { tags: { some: { name: query.tag } } } : {}),
    };

    // 关注流：仅显示当前用户关注作者的公开作品
    if (query.sort === "follow" && viewerId) {
      const following = await this.prisma.follow.findMany({ where: { followerId: viewerId } });
      where.authorId = { in: following.map((f) => f.followingId) };
    }

    // 推荐：按加权互动热度排序（真实互动数据，非伪随机）。权重需在内存中计算。
    if (query.sort === "recommend") {
      const all = await this.prisma.work.findMany({ where, include: WORK_INCLUDE });
      const sorted = all.sort((a, b) => this.engagementScore(b) - this.engagementScore(a));
      const list = sorted.slice((page - 1) * pageSize, page * pageSize);
      const total = sorted.length;
      return { list, total, page, pageSize, hasMore: page * pageSize < total };
    }

    const orderBy = this.orderBy(query.sort);

    const [list, total] = await this.prisma.$transaction([
      this.prisma.work.findMany({
        where,
        include: WORK_INCLUDE,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.work.count({ where }),
    ]);

    return { list, total, page, pageSize, hasMore: page * pageSize < total };
  }

  /** 加权互动热度：共鸣 > 评论 > 收藏 > 点赞 > 阅读（真实互动数据）。 */
  private engagementScore(w: {
    viewCount: number;
    likeCount: number;
    collectCount: number;
    commentCount: number;
    resonateCount: number;
  }): number {
    return (
      w.viewCount +
      w.likeCount * 3 +
      w.collectCount * 4 +
      w.commentCount * 5 +
      w.resonateCount * 6
    );
  }

  private orderBy(sort?: string): Prisma.WorkOrderByWithRelationInput[] {
    switch (sort) {
      case "latest":
        return [{ publishAt: "desc" }];
      case "hot":
        return [{ viewCount: "desc" }, { createdAt: "desc" }];
      default:
        return [{ createdAt: "desc" }];
    }
  }

  async getById(id: string) {
    // 先校验存在，避免 Prisma update 对不存在的 id 抛 P2025（500）而非 404。
    const exists = await this.prisma.work.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("作品不存在");
    return this.prisma.work.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: { ...WORK_INCLUDE, insight: true },
    });
  }

  async getChapters(id: string) {
    return this.prisma.chapter.findMany({ where: { workId: id }, orderBy: { order: "asc" } });
  }

  async create(authorId: string, dto: CreateWorkDto) {
    const { content, chapters, ...rest } = dto;
    const text = content?.trim() ?? "";
    const normalized = this.normalizeChapters(chapters);
    const totalWords = normalized.reduce((s, c) => s + c.wordCount, text ? text.length : 0);
    const chapterCount = normalized.length || (text ? 1 : 0);

    const work = await this.prisma.work.create({
      data: {
        ...rest,
        authorId,
        publishAt: new Date(),
        chapterCount,
        totalWords,
        readMinutes: totalWords ? Math.max(1, Math.round(totalWords / 400)) : 5,
        tags: dto.tags?.length
          ? { connectOrCreate: dto.tags.map((name) => ({ where: { name }, create: { name } })) }
          : undefined,
      },
      include: WORK_INCLUDE,
    });

    // 结构化章节：一章节一条记录（含图片块）；否则退回纯文本单章。
    if (normalized.length) {
      for (let i = 0; i < normalized.length; i++) {
        const ch = normalized[i];
        await this.prisma.chapter.create({
          data: {
            workId: work.id,
            order: i + 1,
            title: ch.title,
            content: JSON.stringify(ch.blocks),
            wordCount: ch.wordCount,
          },
        });
      }
    } else if (text) {
      await this.prisma.chapter.create({
        data: {
          workId: work.id,
          order: 1,
          title: "正文",
          content: JSON.stringify([{ type: "paragraph", text }]),
          wordCount: text.length,
        },
      });
    }
    return work;
  }

  /** 校验并清洗章节内容块为合法 ContentBlock[]，统计字数。 */
  private normalizeChapters(
    chapters?: ChapterInputDto[]
  ): { title: string; blocks: unknown[]; wordCount: number }[] {
    if (!chapters?.length) return [];
    return chapters.map((ch) => {
      const blocks = this.sanitizeBlocks(ch.blocks);
      const wordCount = blocks.reduce<number>((s, b) => {
        const t = (b as { text?: unknown }).text;
        return s + (typeof t === "string" ? t.length : 0);
      }, 0);
      return { title: (ch.title ?? "").trim() || "正文", blocks, wordCount };
    });
  }

  /** 白名单清洗内容块，丢弃未知类型与非法字段，防止任意 JSON 写入正文。 */
  private sanitizeBlocks(blocks: unknown[]): unknown[] {
    const ALLOWED = new Set(["paragraph", "heading", "quote", "divider", "image", "video", "audio", "map"]);
    const src = (v: unknown) =>
      typeof v === "string" && /^(\/uploads\/|https?:\/\/|data:image\/)/.test(v) ? v.slice(0, 2000) : undefined;
    return (Array.isArray(blocks) ? blocks : [])
      .filter(
        (b): b is Record<string, unknown> =>
          !!b && typeof b === "object" && ALLOWED.has((b as { type?: unknown }).type as string)
      )
      .map((b) => {
        const type = b.type as string;
        switch (type) {
          case "paragraph":
          case "quote":
            return { type, text: String(b.text ?? "").slice(0, 10000) };
          case "heading":
            return { type, text: String(b.text ?? "").slice(0, 500), level: b.level === 3 ? 3 : 2 };
          case "image":
            return { type, src: src(b.src), alt: b.alt, caption: b.caption, layout: b.layout };
          case "divider":
            return { type };
          case "video":
          case "audio":
            return { type, caption: b.caption };
          case "map":
            return { type, label: b.label };
          default:
            return { type };
        }
      });
  }

  async update(id: string, authorId: string, dto: UpdateWorkDto) {
    const work = await this.prisma.work.findUnique({ where: { id } });
    if (!work) throw new NotFoundException("作品不存在");
    if (work.authorId !== authorId) throw new ForbiddenException("无权修改该作品");

    const { tags, chapters, content, ...rest } = dto;
    // 标签为多对多：先清空旧关联，再按名连接或创建（保证可新增/移除）。
    if (tags) {
      await this.prisma.work.update({ where: { id }, data: { tags: { set: [] } } });
    }
    return this.prisma.work.update({
      where: { id },
      data: {
        ...rest,
        tags: tags?.length
          ? { connectOrCreate: tags.map((name) => ({ where: { name }, create: { name } })) }
          : undefined,
      },
      include: WORK_INCLUDE,
    });
  }

  async remove(id: string, authorId: string) {
    const work = await this.prisma.work.findUnique({ where: { id } });
    if (!work) throw new NotFoundException("作品不存在");
    if (work.authorId !== authorId) throw new ForbiddenException("无权删除该作品");
    await this.prisma.work.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- 互动 ----------

  private async toggle(
    table: "like" | "collection" | "resonate",
    workId: string,
    userId: string,
  ) {
    const key = `${table}Id_workId` as const;
    // 简化：以存在判断 + 计数。生产环境建议用 Redis 计数 + 异步落库。
    const record = await (this.prisma[table] as Prisma.LikeDelegate).findUnique({
      where: { userId_workId: { userId, workId } } as never,
    });

    const active = !record;
    const delta = active ? 1 : -1;
    if (active) {
      await (this.prisma[table] as Prisma.LikeDelegate).create({
        data: { userId, workId } as never,
      });
    } else {
      await (this.prisma[table] as Prisma.LikeDelegate).delete({
        where: { userId_workId: { userId, workId } } as never,
      });
    }
    const countField = { like: "likeCount", collection: "collectCount", resonate: "resonateCount" }[table] as
      | "likeCount"
      | "collectCount"
      | "resonateCount";
    await this.prisma.work.update({ where: { id: workId }, data: { [countField]: { increment: delta } } });
    const refreshed = await this.prisma.work.findUnique({
      where: { id: workId },
      select: { likeCount: true, collectCount: true, resonateCount: true },
    });
    const count = refreshed ? refreshed[countField] : 0;

    // 点赞 / 收藏时通知作品作者（共鸣与本人操作不通知）
    if (active && table !== "resonate") {
      const work = await this.prisma.work.findUnique({
        where: { id: workId },
        select: { authorId: true, title: true },
      });
      if (work && work.authorId !== userId) {
        await this.prisma.notification.create({
          data: {
            userId: work.authorId,
            actorId: userId,
            workId,
            type: table === "like" ? "LIKE" : "COLLECT",
            content: work.title,
          },
        });
      }
    }
    return { active, key, count };
  }

  toggleLike(workId: string, userId: string) {
    return this.toggle("like", workId, userId);
  }
  toggleCollect(workId: string, userId: string) {
    return this.toggle("collection", workId, userId);
  }
  toggleResonate(workId: string, userId: string) {
    return this.toggle("resonate", workId, userId);
  }

  // ---------- 评论 ----------

  async getComments(workId: string) {
    return this.prisma.comment.findMany({
      where: { workId, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: AUTHOR_SELECT },
        replies: { include: { author: { select: AUTHOR_SELECT } } },
      },
    });
  }

  async addComment(workId: string, authorId: string, content: string, parentId?: string) {
    const comment = await this.prisma.comment.create({
      data: { workId, authorId, content, parentId },
      include: { author: { select: AUTHOR_SELECT } },
    });
    await this.prisma.work.update({
      where: { id: workId },
      data: { commentCount: { increment: 1 } },
    });

    // 通知作品作者（本人评论不通知）
    const work = await this.prisma.work.findUnique({ where: { id: workId }, select: { authorId: true } });
    if (work && work.authorId !== authorId) {
      await this.prisma.notification.create({
        data: {
          userId: work.authorId,
          actorId: authorId,
          workId,
          type: "COMMENT",
          content: content.slice(0, 60),
        },
      });
    }
    return comment;
  }

  /** 评论点赞（切换，用户维度去重）。 */
  async toggleCommentLike(commentId: string, userId: string) {
    const existing = await this.prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });
    const active = !existing;
    const delta = active ? 1 : -1;
    if (active) {
      await this.prisma.commentLike.create({ data: { commentId, userId } });
    } else {
      await this.prisma.commentLike.delete({ where: { commentId_userId: { commentId, userId } } });
    }
    await this.prisma.comment.update({ where: { id: commentId }, data: { likes: { increment: delta } } });
    return { active };
  }

  // ---------- 相关推荐 ----------

  async getRelated(workId: string) {
    const current = await this.prisma.work.findUnique({
      where: { id: workId },
      include: { tags: true },
    });
    if (!current) return [];

    // 内容关系：同一分类 / 城市 / 人生阶段 / 职业 / 标签
    const or: Prisma.WorkWhereInput[] = [{ categoryL1: current.categoryL1 }];
    if (current.city) or.push({ city: current.city });
    if (current.lifeStage) or.push({ lifeStage: current.lifeStage });
    if (current.occupation) or.push({ occupation: current.occupation });
    const tagNames = current.tags?.map((t) => t.name) ?? [];
    if (tagNames.length) or.push({ tags: { some: { name: { in: tagNames } } } });

    return this.prisma.work.findMany({
      where: { id: { not: workId }, visibility: "PUBLIC", OR: or },
      include: WORK_INCLUDE,
      take: 6,
    });
  }
}
