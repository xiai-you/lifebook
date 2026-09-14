import type {
  CommentItem,
  NotificationItem,
  Conversation,
  ChatMessage,
  ShelfItem,
} from "@/types";
import { authors, mockWorks } from "./works";

/**
 * 互动 / 通知 / 私信 / 书架 Mock 数据。
 */

// ---------- 评论 ----------

export const mockComments: CommentItem[] = [
  {
    id: "cm1",
    workId: "work-6",
    author: authors.a3,
    content: "看哭了。我也是北漂，今年第十年，这段话就像在写我自己。",
    likes: 3200,
    createdAt: "2026-09-10 18:23",
    replies: [
      {
        id: "cm1-1",
        author: authors.a1,
        content: "抱抱你，我们都不是一个人在走。",
        likes: 890,
        createdAt: "2026-09-10 19:01",
      },
    ],
  },
  {
    id: "cm2",
    workId: "work-6",
    author: authors.a10,
    content: "「一间能晒到太阳的房间」这句真的破防了。",
    likes: 2100,
    createdAt: "2026-09-10 20:11",
  },
  {
    id: "cm3",
    workId: "work-13",
    author: authors.a6,
    content: "谢谢你愿意把这段经历写下来。活着本身，就是最大的勇敢。",
    likes: 5400,
    createdAt: "2026-09-11 09:30",
    replies: [
      {
        id: "cm3-1",
        author: authors.a11,
        content: "也谢谢每一个读到这里的你。",
        likes: 1300,
        createdAt: "2026-09-11 10:02",
      },
    ],
  },
  {
    id: "cm4",
    workId: "work-7",
    author: authors.a2,
    content: "「深渊之下，一定有人在等你回来」——把这句话送给所有需要的人。",
    likes: 2800,
    createdAt: "2026-09-09 22:40",
  },
];

// ---------- 通知 ----------

export const mockNotifications: NotificationItem[] = [
  {
    id: "nt1",
    type: "like",
    actor: authors.a3,
    workTitle: "北漂十年，我学会了与自己和解",
    workId: "work-6",
    createdAt: "2026-09-12 08:12",
    read: false,
  },
  {
    id: "nt2",
    type: "comment",
    actor: authors.a10,
    content: "看哭了，写的就是我本人。",
    workTitle: "北漂十年，我学会了与自己和解",
    workId: "work-6",
    createdAt: "2026-09-12 07:45",
    read: false,
  },
  {
    id: "nt3",
    type: "follow",
    actor: authors.a7,
    authorId: "a7",
    createdAt: "2026-09-11 21:20",
    read: false,
  },
  {
    id: "nt4",
    type: "collect",
    actor: authors.a2,
    workTitle: "父亲走后的第一个清明节",
    workId: "work-3",
    createdAt: "2026-09-11 19:03",
    read: true,
  },
  {
    id: "nt5",
    type: "ai",
    content: "你的新章节已经完成 AI 润色，去看看吧。",
    workId: "d1",
    createdAt: "2026-09-11 16:40",
    read: true,
  },
  {
    id: "nt6",
    type: "official",
    content: "「真实故事计划」征稿活动开启，欢迎投稿。",
    createdAt: "2026-09-10 10:00",
    read: true,
  },
];

// ---------- 私信会话 ----------

export const mockConversations: Conversation[] = [
  {
    id: "cv1",
    user: authors.a3,
    lastMessage: "谢谢你的鼓励，我会继续写下去的。",
    lastAt: "2026-09-12 09:02",
    unread: 2,
  },
  {
    id: "cv2",
    user: authors.a6,
    lastMessage: "下次去黔东南，一定要来找我。",
    lastAt: "2026-09-11 20:15",
    unread: 0,
  },
  {
    id: "cv3",
    user: authors.a5,
    lastMessage: "面馆最近生意很好，欢迎来坐坐。",
    lastAt: "2026-09-10 14:30",
    unread: 0,
  },
];

export const mockChatMessages: Record<string, ChatMessage[]> = {
  cv1: [
    {
      id: "m1",
      from: "other",
      type: "text",
      content: "你好，读了你的北漂故事，特别有共鸣。",
      createdAt: "2026-09-12 08:50",
    },
    {
      id: "m2",
      from: "me",
      type: "text",
      content: "谢谢！能被读到就是最大的幸运。",
      createdAt: "2026-09-12 08:52",
    },
    {
      id: "m3",
      from: "other",
      type: "emoji",
      content: "🥹",
      createdAt: "2026-09-12 08:53",
    },
    {
      id: "m4",
      from: "other",
      type: "text",
      content: "我也想把我的故事写下来，但不知道从哪开始。",
      createdAt: "2026-09-12 08:58",
    },
    {
      id: "m5",
      from: "me",
      type: "work",
      content: "你可以试试 AI 引导创作，从一段最想说的经历开始。",
      workId: "work-6",
      createdAt: "2026-09-12 09:01",
    },
    {
      id: "m6",
      from: "other",
      type: "text",
      content: "好，我这就去试试。谢谢你的鼓励，我会继续写下去的。",
      createdAt: "2026-09-12 09:02",
    },
  ],
};

// ---------- 书架 ----------

function shelfItem(workId: string, progress: number, lastChapterOrder: number, lastReadAt: string): ShelfItem {
  const work = mockWorks.find((w) => w.id === workId)!;
  return { work, progress, lastChapterOrder, lastReadAt };
}

export const mockShelf: ShelfItem[] = [
  shelfItem("work-13", 0.42, 2, "2026-09-12"),
  shelfItem("work-6", 1, 3, "2026-09-11"),
  shelfItem("work-7", 0.7, 2, "2026-09-10"),
  shelfItem("work-9", 0.2, 1, "2026-09-09"),
];

/** 收藏（书架收藏夹） */
export const mockCollections: ShelfItem[] = [
  shelfItem("work-3", 0, 0, "2026-09-08"),
  shelfItem("work-12", 0, 0, "2026-09-05"),
  shelfItem("work-19", 0, 0, "2026-09-03"),
];

// ---------- 可变 Mock 存储（用于交互写入，接入后端后可整体替换） ----------

export function addMockComment(comment: CommentItem): void {
  mockComments.unshift(comment);
}

export function addMockMessage(conversationId: string, message: ChatMessage): void {
  if (!mockChatMessages[conversationId]) mockChatMessages[conversationId] = [];
  mockChatMessages[conversationId].push(message);
}
