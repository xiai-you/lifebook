import { Injectable, NotFoundException } from "@nestjs/common";
import { MessageType } from "../common/enums";
import { PrismaService } from "../prisma/prisma.service";
import { AUTHOR_SELECT } from "../prisma/selects";

/** 私信服务：会话列表 / 消息记录 / 发送消息。 */
@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async conversations(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      orderBy: { lastAt: "desc" },
      include: { userA: { select: AUTHOR_SELECT }, userB: { select: AUTHOR_SELECT } },
    });

    // 未读数：对方发来且未读的消息数
    const unread = await this.prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: convs.map((c) => c.id) },
        fromId: { not: userId },
        read: false,
      },
      _count: { _all: true },
    });
    const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));

    return convs.map((c) => ({ ...c, unread: unreadMap.get(c.id) ?? 0 }));
  }

  async messages(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv || (conv.userAId !== userId && conv.userBId !== userId)) {
      throw new NotFoundException("会话不存在");
    }
    // 打开会话即把对方发来的消息标记为已读
    await this.prisma.message.updateMany({
      where: { conversationId, fromId: { not: userId }, read: false },
      data: { read: true },
    });
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  }

  async send(fromId: string, toId: string, content: string, type: MessageType = "TEXT", workId?: string) {
    // 幂等地查找或创建会话（双方 ID 有序）
    const [a, b] = [fromId, toId].sort();
    const conv = await this.prisma.conversation.upsert({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      create: { userAId: a, userBId: b, lastMessage: content },
      update: { lastMessage: content, lastAt: new Date() },
    });

    const message = await this.prisma.message.create({
      data: { conversationId: conv.id, fromId, type, content, workId },
    });
    return message;
  }
}
