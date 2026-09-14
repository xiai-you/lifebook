import type {
  Chapter,
  ContentBlock,
  TimelineNode,
  EmotionPoint,
  CharacterNode,
  CharacterEdge,
  LifeMapLocation,
} from "@/types";
import { authors } from "./works";

/**
 * 章节富内容 / AI 特色数据（人生时间轴 / 情绪曲线 / 人物关系图）。
 * 内容块为「小说编辑器」产物的结构化表示，阅读器据此渲染图文混排。
 */

function chapter(
  workId: string,
  order: number,
  title: string,
  content: ContentBlock[]
): Chapter {
  const wordCount = content.reduce((sum, b) => {
    const t =
      b.type === "paragraph" || b.type === "heading" || b.type === "quote"
        ? b.text.length
        : 0;
    return sum + t;
  }, 0);
  return { id: `${workId}-ch${order}`, workId, order, title, content, wordCount, createdAt: "2026-09-10" };
}

// ---------- 旗舰作品完整章节 ----------

/** 《北漂十年，我学会了与自己和解》 */
const beipiaoChapters: Chapter[] = [
  chapter("work-6", 1, "第一章 · 2014，初到北京", [
    { type: "paragraph", text: "2014 年夏天，我拖着一只 24 寸的行李箱，从南方的县城坐了一整夜的硬座，到了北京西站。那是我第一次离开家超过两百公里。" },
    { type: "paragraph", text: "出站的那一刻，我被这座城市的热浪和人群推着往前走。我抬头看了一眼天空，灰蒙蒙的，可我心里却亮堂堂的——我以为，我的人生要从这里开始了。" },
    { type: "image", alt: "北京西站的人潮", caption: "2014 · 北京西站出站口，人群像潮水一样涌来", layout: "full", color: "#6366F1" },
    { type: "paragraph", text: "第一晚，我借住在老乡的出租屋里。那是一间地下二层的小屋，天花板低得伸手就能摸到。我睡在客厅的行军床上，听着隔壁传来的咳嗽声，第一次觉得，北京和我一样，也会喘不过气。" },
    { type: "quote", text: "那时候我总觉得，只要熬过了今天，明天就会好起来。" },
  ]),
  chapter("work-6", 2, "第二章 · 六次搬家，一间朝南的窗", [
    { type: "paragraph", text: "在北京十年，我搬过六次家。从地下室到隔断间，从合租到单间，每一次搬家，都像是和上一个阶段的自己告别。" },
    { type: "paragraph", text: "印象最深的是 2016 年那次。房东临时毁约，我三天之内要找到新的住处。那三天我拖着两个编织袋，在北京的地铁里往返，累到在换乘通道的长椅上睡着了。" },
    { type: "image", alt: "合租屋的一角", caption: "2016 · 那间朝北的隔断间", layout: "right", color: "#6366F1" },
    { type: "paragraph", text: "2021 年，我终于租下了一间带朝南窗户的小公寓。签合同那天，我站在窗边晒了很久的太阳，突然就哭了。原来一间能晒到太阳的房间，是我拼了七年才换来的。" },
    { type: "divider" },
    { type: "heading", level: 2, text: "那些咬牙坚持的日子" },
    { type: "paragraph", text: "加班到凌晨是常态。有一次项目上线，我连续三周没有休息，最后在工位上晕了过去。醒来的时候，同事给我递了杯热水，我笑着说没事，其实特别想给妈妈打个电话。" },
  ]),
  chapter("work-6", 3, "第三章 · 与自己和解", [
    { type: "paragraph", text: "后来我渐渐明白，北京从来没有亏欠过我什么。它给过我心酸，也给过我机会；让我哭过，也让我长成了一个可以独当一面的大人。" },
    { type: "paragraph", text: "我不再执念于要在这座城市买一套房，也不再因为别人的眼光而焦虑。我开始学着好好吃饭，周末去逛公园，把出租屋收拾成喜欢的样子。" },
    { type: "video", caption: "2024 · 我在北京的某个清晨（短片）" },
    { type: "paragraph", text: "北漂十年，我最想对自己说的是：谢谢你没有放弃。也谢谢这座城市，让我学会了与自己和解。" },
    { type: "map", label: "北京 · 朝阳 —— 我生活了十年的地方" },
  ]),
];

/** 《那场地震，我活下来了》 */
const earthquakeChapters: Chapter[] = [
  chapter("work-13", 1, "第一章 · 2008 年 5 月 12 日", [
    { type: "paragraph", text: "那天下午两点多，我正在教室上数学课。突然，课桌开始剧烈地摇晃，头顶的日光灯像钟摆一样甩来甩去。老师喊了一声「地震了，快跑」，我们拼命往楼下冲。" },
    { type: "paragraph", text: "我跑到了教学楼外面的空地上，脚下的地面还在颤动。那一刻，我看到教学楼在我身后塌了一半。尘土扬起来，天一下子变成了灰色。" },
    { type: "image", alt: "震后的废墟", caption: "2008 · 震后的校舍", layout: "full", color: "#F97316" },
    { type: "quote", text: "很多年后我才明白，能跑出来，已经是一种幸运。" },
  ]),
  chapter("work-13", 2, "第二章 · 废墟下的 72 小时", [
    { type: "paragraph", text: "后来余震不断，我在去往安置点的路上被一块坠落的预制板砸中了腿。黑暗里，我数着自己的心跳，一遍遍告诉自己：不能睡，睡着了可能就再也醒不过来。" },
    { type: "paragraph", text: "不知道过了多久，我听见头顶传来挖掘的声音，还有人在喊：「下面有人吗？敲一下！」我用尽力气敲了三下。那是这辈子我敲过的最响的三下。" },
    { type: "image", alt: "救援现场（示意动图）", caption: "废墟上的救援（示意）", layout: "center", animated: true, color: "#F97316" },
    { type: "paragraph", text: "被救出来的那一刻，刺眼的阳光让我睁不开眼。我听见有人哭了，是救援队员，也是我。" },
  ]),
  chapter("work-13", 3, "第三章 · 十八年的重建", [
    { type: "paragraph", text: "身体的伤愈合得很快，心里的伤却用了很多年。很长一段时间里，我一听到重物坠地的声音就会发抖，晚上也睡不踏实。" },
    { type: "paragraph", text: "后来，我回到重建后的家乡，看着新的学校、新的街道一点点长出来。我也试着重新拥抱生活：读书、工作、恋爱，去过一种「普通」的人生。" },
    { type: "image", alt: "重建后的新校园", caption: "2026 · 重建后的家乡", layout: "full", color: "#22C55E" },
    { type: "paragraph", text: "写下这个故事，是想告诉所有和我一样经历过至暗时刻的人：活着本身，就已经是奇迹。我们都可以重新开始。" },
  ]),
];

/** 《抑郁症自救手册：我如何熬过那三年》 */
const depressionChapters: Chapter[] = [
  chapter("work-7", 1, "第一章 · 被拖进深渊", [
    { type: "paragraph", text: "确诊重度抑郁的那天，我拿着报告单坐在医院的走廊里，很久没有动。确诊反而让我松了一口气——原来那些日日夜夜的痛苦，是有名字的。" },
    { type: "paragraph", text: "那段日子，我像被关在一个没有出口的玻璃罩子里。明明外面阳光很好，我却一点都感觉不到温度。" },
    { type: "quote", text: "抑郁不是「想开点」就能好的，它是一种真实存在的疾病。" },
  ]),
  chapter("work-7", 2, "第二章 · 慢慢好起来", [
    { type: "paragraph", text: "规律的服药、心理咨询，还有朋友的陪伴，让我一点一点从谷底往上爬。我开始记录每天「还不错」的小事，哪怕只是吃了一顿热饭。" },
    { type: "image", alt: "窗台的一盆绿植", caption: "窗台上那盆活了下来的绿萝", layout: "right", color: "#EC4899" },
    { type: "paragraph", text: "第三年春天，有一天早上醒来，我突然发现，窗外的鸟叫声好像没那么吵了。那一刻我知道，我在好起来了。" },
  ]),
  chapter("work-7", 3, "第三章 · 把光分给你", [
    { type: "paragraph", text: "我把这段经历写下来，是希望正在经历同样痛苦的人知道：你并不孤单，也请不要放弃。深渊之下，一定有人在等你回来。" },
    { type: "audio", caption: "为你读一段 · 给正在低谷的你" },
  ]),
];

export const mockChapters: Record<string, Chapter[]> = {
  "work-6": beipiaoChapters,
  "work-13": earthquakeChapters,
  "work-7": depressionChapters,
};

/** 获取作品章节（未预置章节的作品，生成通用章节） */
export function getChaptersForWork(workId: string): Chapter[] {
  if (mockChapters[workId]) return mockChapters[workId];

  const n = 4 + (Number(workId.replace("work-", "")) % 3);
  return Array.from({ length: n }, (_, i) =>
    chapter(workId, i + 1, `第${["一", "二", "三", "四", "五", "六"][i]}章 · 正文`, [
      { type: "paragraph", text: `这是第 ${i + 1} 章的正文内容。这里讲述的是真实人生经历中的一段，经过 AI 协作整理与润色，形成可阅读的小说化文本。` },
      { type: "paragraph", text: "每一个细节都来自亲历者的记忆，每一处情绪都真实发生过。它们也许普通，却因为真实而格外动人。" },
      ...(i % 2 === 0
        ? ([
            { type: "image", alt: "正文配图", caption: "章节配图", layout: "center" as const, color: "#5B8DEF" },
          ] as ContentBlock[])
        : ([{ type: "quote", text: "真实的人生，比小说更动人。" }] as ContentBlock[])),
    ])
  );
}

// ---------- AI 特色：人生时间轴 / 情绪曲线 / 人物关系图 ----------

const timelines: Record<string, TimelineNode[]> = {
  "work-6": [
    { id: "n1", year: "2014", title: "初到北京", chapterOrder: 1 },
    { id: "n2", year: "2016", title: "第三次搬家", chapterOrder: 2 },
    { id: "n3", year: "2019", title: "第一次升职", chapterOrder: 2 },
    { id: "n4", year: "2021", title: "住进朝南的房间", chapterOrder: 2 },
    { id: "n5", year: "2024", title: "与自己和解", chapterOrder: 3 },
  ],
  "work-13": [
    { id: "n1", year: "2008", title: "那场地震", chapterOrder: 1 },
    { id: "n2", year: "2008", title: "获救", chapterOrder: 2 },
    { id: "n3", year: "2010", title: "心理重建", chapterOrder: 3 },
    { id: "n4", year: "2018", title: "回到家乡", chapterOrder: 3 },
    { id: "n5", year: "2026", title: "写下故事", chapterOrder: 3 },
  ],
  "work-7": [
    { id: "n1", year: "2021", title: "确诊", chapterOrder: 1 },
    { id: "n2", year: "2022", title: "开始治疗", chapterOrder: 2 },
    { id: "n3", year: "2023", title: "好转", chapterOrder: 2 },
    { id: "n4", year: "2024", title: "重新出发", chapterOrder: 3 },
  ],
};

export function getTimeline(workId: string): TimelineNode[] {
  if (timelines[workId]) return timelines[workId];
  return [
    { id: "n1", year: "早年", title: "故事的开始", chapterOrder: 1 },
    { id: "n2", year: "后来", title: "重要的转折", chapterOrder: 2 },
    { id: "n3", year: "现在", title: "回望与和解", chapterOrder: 3 },
  ];
}

const emotionCurves: Record<string, EmotionPoint[]> = {
  "work-6": [
    { chapterOrder: 1, label: "初到北京", value: 0.3, emotion: "hope" },
    { chapterOrder: 2, label: "租房漂泊", value: -0.5, emotion: "sad" },
    { chapterOrder: 3, label: "升职", value: 0.5, emotion: "happy" },
    { chapterOrder: 4, label: "朝南的窗", value: 0.7, emotion: "happy" },
    { chapterOrder: 5, label: "和解", value: 0.6, emotion: "hope" },
  ],
  "work-13": [
    { chapterOrder: 1, label: "灾难降临", value: -0.9, emotion: "tense" },
    { chapterOrder: 2, label: "废墟获救", value: -0.6, emotion: "sad" },
    { chapterOrder: 3, label: "心理重建", value: -0.2, emotion: "tense" },
    { chapterOrder: 4, label: "回到家乡", value: 0.4, emotion: "hope" },
    { chapterOrder: 5, label: "写下故事", value: 0.8, emotion: "happy" },
  ],
  "work-7": [
    { chapterOrder: 1, label: "确诊", value: -0.8, emotion: "sad" },
    { chapterOrder: 2, label: "治疗", value: -0.4, emotion: "tense" },
    { chapterOrder: 3, label: "好转", value: 0.3, emotion: "hope" },
    { chapterOrder: 4, label: "重新出发", value: 0.7, emotion: "happy" },
  ],
};

export function getEmotionCurve(workId: string): EmotionPoint[] {
  if (emotionCurves[workId]) return emotionCurves[workId];
  return [
    { chapterOrder: 1, label: "开始", value: 0.2, emotion: "hope" },
    { chapterOrder: 2, label: "低谷", value: -0.5, emotion: "sad" },
    { chapterOrder: 3, label: "转折", value: 0, emotion: "tense" },
    { chapterOrder: 4, label: "和解", value: 0.6, emotion: "happy" },
  ];
}

interface CharacterGraph {
  nodes: CharacterNode[];
  edges: CharacterEdge[];
}

const characterGraphs: Record<string, CharacterGraph> = {
  "work-6": {
    nodes: [
      { id: "c1", name: "我", role: "主角" },
      { id: "c2", name: "妈妈", role: "亲人" },
      { id: "c3", name: "房东", role: "过客" },
      { id: "c4", name: "老同事", role: "朋友" },
      { id: "c5", name: "北京", role: "城市" },
    ],
    edges: [
      { source: "c1", target: "c2", relation: "牵挂" },
      { source: "c1", target: "c3", relation: "辗转" },
      { source: "c1", target: "c4", relation: "并肩" },
      { source: "c1", target: "c5", relation: "十年" },
    ],
  },
  "work-13": {
    nodes: [
      { id: "c1", name: "我", role: "幸存者" },
      { id: "c2", name: "老师", role: "引导者" },
      { id: "c3", name: "救援队员", role: "恩人" },
      { id: "c4", name: "家人", role: "支柱" },
    ],
    edges: [
      { source: "c1", target: "c2", relation: "那一课" },
      { source: "c1", target: "c3", relation: "获救" },
      { source: "c1", target: "c4", relation: "陪伴" },
    ],
  },
};

export function getCharacterGraph(workId: string): CharacterGraph {
  if (characterGraphs[workId]) return characterGraphs[workId];
  return {
    nodes: [
      { id: "c1", name: "我", role: "主角" },
      { id: "c2", name: "家人", role: "亲人" },
      { id: "c3", name: "朋友", role: "陪伴" },
    ],
    edges: [
      { source: "c1", target: "c2", relation: "亲情" },
      { source: "c1", target: "c3", relation: "友情" },
    ],
  };
}

// ---------- AI 特色：人生地图（故事发生地点） ----------

const lifeMaps: Record<string, LifeMapLocation[]> = {
  "work-6": [
    { id: "m1", name: "南方县城 · 家", x: 52, y: 82, chapterOrder: 1 },
    { id: "m2", name: "北京西站", x: 46, y: 42, chapterOrder: 1 },
    { id: "m3", name: "地下二层出租屋", x: 42, y: 48, chapterOrder: 1 },
    { id: "m4", name: "隔断间", x: 40, y: 40, chapterOrder: 2 },
    { id: "m5", name: "朝南的小公寓", x: 50, y: 34, chapterOrder: 2 },
    { id: "m6", name: "北京 · 朝阳", x: 58, y: 28, chapterOrder: 3 },
  ],
  "work-13": [
    { id: "m1", name: "校舍", x: 46, y: 56, chapterOrder: 1 },
    { id: "m2", name: "废墟", x: 52, y: 58, chapterOrder: 2 },
    { id: "m3", name: "安置点", x: 40, y: 66, chapterOrder: 2 },
    { id: "m4", name: "重建后的家乡", x: 48, y: 50, chapterOrder: 3 },
  ],
  "work-7": [
    { id: "m1", name: "医院", x: 50, y: 54, chapterOrder: 1 },
    { id: "m2", name: "家", x: 38, y: 44, chapterOrder: 1 },
    { id: "m3", name: "心理咨询室", x: 56, y: 42, chapterOrder: 2 },
    { id: "m4", name: "窗台", x: 34, y: 36, chapterOrder: 2 },
  ],
};

export function getLifeMap(workId: string): LifeMapLocation[] {
  if (lifeMaps[workId]) return lifeMaps[workId];
  return [
    { id: "m1", name: "故事开始的地方", x: 50, y: 45, chapterOrder: 1 },
    { id: "m2", name: "重要的转折点", x: 42, y: 62, chapterOrder: 2 },
    { id: "m3", name: "回望与和解", x: 60, y: 34, chapterOrder: 3 },
  ];
}

export { authors };
