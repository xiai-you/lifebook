import type { LifeContext } from "@/types";

/**
 * Life Context 提取器（规则版）。
 * 在 AI 采访过程中，从用户的回答里实时抽取「人物 / 地点 / 时间 / 事件 / 情绪 / 物件」，
 * 累积成 Story Draft 的人生要素。接入真实 NLP 后可替换此规则实现。
 */

const PEOPLE = ["奶奶", "爷爷", "外公", "外婆", "妈妈", "爸爸", "母亲", "父亲", "哥哥", "姐姐", "弟弟", "妹妹", "朋友", "老师", "同事", "老板", "同学", "室友", "孩子", "儿子", "女儿", "妻子", "丈夫", "恋人", "男朋友", "女朋友"];
const CITIES = ["北京", "上海", "广州", "深圳", "杭州", "成都", "重庆", "南京", "武汉", "西安", "苏州", "长沙", "青岛", "厦门", "大连", "大理", "拉萨", "哈尔滨", "沈阳", "贵阳", "东京", "首尔", "纽约", "伦敦", "巴黎", "悉尼", "多伦多", "新加坡", "东莞", "绵阳", "郑州", "合肥", "黔东南"];
const EVENTS = ["搬家", "辞职", "入职", "毕业", "结婚", "离婚", "分手", "失业", "创业", "生病", "住院", "手术", "高考", "考研", "留学", "出国", "回国", "出生", "去世", "离别", "重逢", "拆迁"];
const EMOTIONS = ["开心", "难过", "孤独", "害怕", "紧张", "焦虑", "平静", "激动", "委屈", "愧疚", "遗憾", "释然", "想念"];
const OBJECTS = ["收音机", "缝纫机", "相机", "手表", "自行车", "摩托车", "信", "明信片", "照片", "钥匙", "行李箱", "饭盒", "水杯", "灯", "桌子", "绿萝"];

export function emptyLifeContext(): LifeContext {
  return { people: [], locations: [], times: [], events: [], relationships: [], emotions: [], objects: [] };
}

export function extractLifeContext(text: string, prev: LifeContext): LifeContext {
  const ctx: LifeContext = {
    people: [...prev.people],
    locations: [...prev.locations],
    times: [...prev.times],
    events: [...prev.events],
    relationships: [...prev.relationships],
    emotions: [...prev.emotions],
    objects: [...prev.objects],
  };
  const add = (key: keyof LifeContext, value: string) => {
    if (value && !ctx[key].includes(value)) ctx[key] = [...ctx[key], value];
  };

  for (const kw of PEOPLE) if (text.includes(kw)) add("people", kw);
  for (const c of CITIES) if (text.includes(c)) add("locations", c);
  const years = text.match(/(19|20)\d{2}/g) ?? [];
  for (const y of years) add("times", `${y}年`);
  for (const e of EVENTS) if (text.includes(e)) add("events", e);
  for (const e of EMOTIONS) if (text.includes(e)) add("emotions", e);
  for (const o of OBJECTS) if (text.includes(o)) add("objects", o);

  return ctx;
}

/** 把 Life Context 拼成一句「人生档案」摘要。 */
export function contextSummary(ctx: LifeContext): string {
  const parts: string[] = [];
  if (ctx.times.length) parts.push(ctx.times.join("—"));
  if (ctx.locations.length) parts.push(ctx.locations.join("、"));
  if (ctx.people.length) parts.push(ctx.people.slice(0, 3).join("、"));
  if (ctx.events.length) parts.push(ctx.events.join("、"));
  return parts.join(" · ");
}
