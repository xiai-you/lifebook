import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AUTHOR_SELECT } from "../prisma/selects";

/** 搜索服务：作品 / 作者 / 标签 三路检索。生产环境可接入 PG 全文检索或 Elasticsearch。 */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string) {
    const keyword = q.trim();
    if (!keyword) return { works: [], authors: [], tags: [] };

    const contains: Prisma.StringFilter = { contains: keyword };

    const [works, authors, tags] = await Promise.all([
      this.prisma.work.findMany({
        where: {
          visibility: "PUBLIC",
          OR: [
            { title: contains },
            { summary: contains },
            { categoryL1: contains },
            { categoryL2: contains },
            { emotion: contains },
            { city: contains },
            { country: contains },
            { author: { nickname: contains } },
            { tags: { some: { name: contains } } },
          ],
        },
        include: { author: { select: AUTHOR_SELECT }, tags: true },
        take: 12,
      }),
      this.prisma.user.findMany({
        where: { OR: [{ nickname: contains }, { tags: { contains: keyword } }, { region: contains }] },
        select: AUTHOR_SELECT,
        take: 8,
      }),
      this.prisma.tag.findMany({ where: { name: contains }, take: 10 }),
    ]);

    return { works, authors, tags };
  }
}
