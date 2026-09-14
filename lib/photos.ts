import type { Work } from "@/types";

/**
 * 真实摄影封面库 —— Art Direction 2.0 核心。
 * 用 curated Unsplash 摄影图替代纯渐变占位；按情绪/主题映射，每张图带确定性种子，
 * 图片加载失败时由 CoverImage 回退到电影感渐变。
 *
 * 风格硬性要求：自然光 / 黄金时刻 / 浅景深 / 生活痕迹 / 轻微胶片质感，
 * 禁止 AI 塑料脸、高饱和、赛博朋克。
 */

type Mood =
  | "city"
  | "family"
  | "career"
  | "school"
  | "love"
  | "travel"
  | "health"
  | "mind"
  | "growth"
  | "culture"
  | "society"
  | "special";

const UNSPLASH: Record<Mood, string[]> = {
  // 城市：夜色 / 街景 / 高楼
  city: [
    "photo-1477959858617-67f85cf4f1df",
    "photo-1521295121783-8a321d551ad2",
    "photo-1494526585095-c41746248156",
    "photo-1514565131-fce0801e5785",
  ],
  // 家庭：餐桌 / 老物件 / 暖光室内
  family: [
    "photo-1492724441997-5dc865305da7",
    "photo-1519999482648-25049ddd37b1",
    "photo-1609220136736-443140cffec6",
    "photo-1543269865-cbf427effbad",
  ],
  // 职场：办公桌 / 通勤
  career: [
    "photo-1486312338219-ce68d2c6f44d",
    "photo-1454165804606-c3d57bc86b40",
    "photo-1497032628192-86f99bcd76bc",
    "photo-1504384308090-c894fdcc538d",
  ],
  // 校园：教室 / 毕业 / 青春
  school: [
    "photo-1523050854058-8df90110c9f1",
    "photo-1541339907198-e08756dedf3f",
    "photo-1522202176988-66273c2fd55f",
    "photo-1529156069898-49953e39b3ac",
  ],
  // 爱情：牵手 / 黄昏 / 相伴
  love: [
    "photo-1518199266791-5375a83190b7",
    "photo-1494774157365-9e04c6720e47",
    "photo-1516589178581-6cd7833ae3b2",
    "photo-1522673607200-164d1b6ce486",
  ],
  // 旅行：山川 / 公路 / 远方
  travel: [
    "photo-1501785888041-af3ef285b470",
    "photo-1500534314209-a25ddb2bd429",
    "photo-1469474968028-56623f02e42e",
    "photo-1500534623283-312aade485b7",
  ],
  // 健康：窗台 / 晨光 / 希望
  health: [
    "photo-1506126613408-eca07ce68773",
    "photo-1519751138087-5bf79df62d5b",
    "photo-1544367567-0f2fcb009e0b",
    "photo-1517840901100-8179e982acb7",
  ],
  // 心理：独处 / 情绪 / 宁静
  mind: [
    "photo-1470071459604-3b5ec3a7fe05",
    "photo-1500530855697-b586d89ba3ee",
    "photo-1506744038136-46273834b3fb",
    "photo-1441974231531-c6227db76b6e",
  ],
  // 成长：少年 / 背影 / 时间
  growth: [
    "photo-1519681393784-d120267933ba",
    "photo-1500534314209-a25ddb2bd429",
    "photo-1517048676732-d65bc937f952",
    "photo-1518640467707-6811f4a6ab73",
  ],
  // 文化 / 家乡：传统 / 手作 / 记忆
  culture: [
    "photo-1504674900247-0877df9cc836",
    "photo-1490645935967-10de6ba17061",
    "photo-1466637574441-749b8f19452f",
    "photo-1495195134817-aeb325a55b65",
  ],
  // 社会：人群 / 街道 / 人间烟火
  society: [
    "photo-1517457373958-b7bdd4587205",
    "photo-1529156069898-49953e39b3ac",
    "photo-1500375592092-40eb2168fd21",
    "photo-1516733968668-dbdce39c4651",
  ],
  // 特殊经历：极境 / 勇气 / 重生
  special: [
    "photo-1500534314209-a25ddb2bd429",
    "photo-1469474968028-56623f02e42e",
    "photo-1470071459604-3b5ec3a7fe05",
    "photo-1501785888041-af3ef285b470",
  ],
};

/** 由分类/情绪选择一张主题摄影图（确定性，同一作品始终同一张）。 */
export function photoFor(
  work: Pick<Work, "id" | "categoryL1" | "emotion" | "tags">
): string {
  const mood = (work.categoryL1 ?? "growth") as Mood;
  const pool = UNSPLASH[mood] ?? UNSPLASH.growth;
  const hash = work.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const id = pool[hash % pool.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
}

/** 兜底：Lorem Picsum 确定性真实照片（保证总有一张真实图片）。 */
export function picsumFor(seed: string, w = 900, h = 1200): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

/** 头像：真实人像（可选，用于作者） */
export function portraitFor(seed: string): string {
  return `https://i.pravatar.cc/150?u=${seed}`;
}
