import { Injectable } from "@nestjs/common";
import { Role } from "../common/enums";
import { PrismaService } from "../prisma/prisma.service";

/** 管理后台服务（RBAC：仅 ADMIN / EDITOR 可访问）。 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [users, works, comments, notifications] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.work.count(),
      this.prisma.comment.count(),
      this.prisma.notification.count(),
    ]);
    return { users, works, comments, notifications };
  }

  listUsers(page = 1, pageSize = 20) {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, username: true, nickname: true, role: true, createdAt: true },
    });
  }

  updateRole(id: string, role: Role) {
    // 脱敏：仅返回管理所需字段，避免泄露 passwordHash / oauthId / email。
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, nickname: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  listWorks(page = 1, pageSize = 20) {
    return this.prisma.work.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { author: { select: { id: true, nickname: true } } },
    });
  }
}
