import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AUTHOR_SELECT } from "../prisma/selects";

/** 通知服务：列表 / 已读 / 全部已读。 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { actor: { select: AUTHOR_SELECT }, work: true },
    });
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }
}
