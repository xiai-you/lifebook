import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/** 发现页 / 右侧栏数据源：热门话题 / 推荐作者 / 热门标签。 */
@Injectable()
export class DiscoverService {
  constructor(private readonly prisma: PrismaService) {}

  /** 热门话题：以标签聚合度近似（接入话题系统后替换）。 */
  async hotTopics() {
    const tags = await this.prisma.tag.findMany({
      include: { _count: { select: { works: true } } },
      orderBy: { works: { _count: "desc" } },
      take: 10,
    });
    return tags.map((t, i) => ({
      id: t.id,
      title: t.name,
      heat: t._count.works * 10000,
      trend: (i < 3 ? "up" : i > 7 ? "down" : "flat") as "up" | "down" | "flat",
    }));
  }

  /** 推荐作者：按粉丝数 / 作品数排序。 */
  async recommendedAuthors() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        avatar: true,
        bio: true,
        tags: true,
        region: true,
        country: true,
        _count: { select: { followers: true, works: true } },
      },
      orderBy: { followers: { _count: "desc" } },
      take: 5,
    });
  }

  /** 热门标签。 */
  async hotTags() {
    const tags = await this.prisma.tag.findMany({
      include: { _count: { select: { works: true } } },
      orderBy: { works: { _count: "desc" } },
      take: 12,
    });
    return tags.map((t) => ({ id: t.id, name: t.name }));
  }
}
