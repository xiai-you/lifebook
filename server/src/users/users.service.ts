import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AUTHOR_SELECT } from "../prisma/selects";

/** 用户服务：个人主页、关注关系、资料更新。 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { works: true, followers: true, following: true, likes: true } },
      },
    });
    if (!user) throw new NotFoundException("用户不存在");
    // 脱敏：不返回密码哈希 / 第三方 ID / 邮箱 / 第三方来源
    const { passwordHash, oauthId, email, oauthProvider, ...safe } = user;
    return safe;
  }

  async getWorks(id: string) {
    return this.prisma.work.findMany({
      where: { authorId: id, visibility: "PUBLIC" },
      orderBy: { createdAt: "desc" },
      include: { author: { select: AUTHOR_SELECT }, tags: true },
    });
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) return { ok: true };
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) return { ok: true };
    await this.prisma.follow.create({ data: { followerId, followingId } });
    // 关注时通知被关注者
    await this.prisma.notification.create({
      data: { userId: followingId, actorId: followerId, type: "FOLLOW" },
    });
    return { ok: true };
  }

  async unfollow(followerId: string, followingId: string) {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
    return { ok: true };
  }
}
