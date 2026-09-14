import {
  Sprout,
  Heart,
  Users,
  Briefcase,
  GraduationCap,
  Building,
  Brain,
  Activity,
  Plane,
  Palette,
  Scale,
  Landmark,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * LifeBook 分类体系（三级树：一级分类 / 二级分类 / 标签）
 * 对应需求文档第七节「分类系统」，覆盖人生全部维度。
 */

/** 二级分类 */
export interface SubCategory {
  name: string;
  description?: string;
}

/** 一级分类 */
export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  children: SubCategory[];
}

export const categories: Category[] = [
  {
    id: "growth",
    name: "人生成长",
    icon: Sprout,
    color: "#22C55E",
    children: [
      { name: "童年", description: "最初的记忆与单纯岁月" },
      { name: "青春", description: "热烈、迷茫与倔强" },
      { name: "校园", description: "读书时光里的成长" },
      { name: "初恋", description: "第一次心动" },
      { name: "大学", description: "自由与选择" },
      { name: "留学", description: "异国求学与蜕变" },
      { name: "工作", description: "踏入社会的第一课" },
      { name: "创业", description: "从零开始的人生实验" },
      { name: "中年", description: "上有老下有小的承重" },
      { name: "老年", description: "回望与沉淀" },
    ],
  },
  {
    id: "love",
    name: "情感",
    icon: Heart,
    color: "#F43F5E",
    children: [
      { name: "爱情" },
      { name: "暗恋" },
      { name: "异地恋" },
      { name: "分手" },
      { name: "婚姻" },
      { name: "离婚" },
      { name: "复合" },
      { name: "单身" },
    ],
  },
  {
    id: "family",
    name: "家庭",
    icon: Users,
    color: "#8B5CF6",
    children: [
      { name: "父母" },
      { name: "母亲" },
      { name: "父亲" },
      { name: "兄弟姐妹" },
      { name: "祖辈" },
      { name: "孩子" },
      { name: "家庭矛盾" },
    ],
  },
  {
    id: "career",
    name: "职场",
    icon: Briefcase,
    color: "#3B82F6",
    children: [
      { name: "求职" },
      { name: "面试" },
      { name: "加班" },
      { name: "裁员" },
      { name: "创业" },
      { name: "升职" },
      { name: "打工" },
    ],
  },
  {
    id: "school",
    name: "校园",
    icon: GraduationCap,
    color: "#0EA5E9",
    children: [
      { name: "高中" },
      { name: "大学" },
      { name: "考研" },
      { name: "留学" },
      { name: "宿舍" },
      { name: "老师" },
      { name: "同学" },
    ],
  },
  {
    id: "city",
    name: "城市生活",
    icon: Building,
    color: "#6366F1",
    children: [
      { name: "北漂" },
      { name: "沪漂" },
      { name: "深漂" },
      { name: "广漂" },
      { name: "海外生活" },
      { name: "租房" },
      { name: "合租" },
    ],
  },
  {
    id: "mind",
    name: "心理",
    icon: Brain,
    color: "#EC4899",
    children: [
      { name: "焦虑" },
      { name: "抑郁" },
      { name: "孤独" },
      { name: "自愈" },
      { name: "自我成长" },
      { name: "社恐" },
    ],
  },
  {
    id: "health",
    name: "健康",
    icon: Activity,
    color: "#14B8A6",
    children: [
      { name: "康复" },
      { name: "医疗" },
      { name: "手术" },
      { name: "慢病" },
      { name: "健身" },
    ],
  },
  {
    id: "travel",
    name: "旅行",
    icon: Plane,
    color: "#06B6D4",
    children: [
      { name: "独自旅行" },
      { name: "穷游" },
      { name: "自驾" },
      { name: "海外旅行" },
    ],
  },
  {
    id: "hobby",
    name: "兴趣",
    icon: Palette,
    color: "#F59E0B",
    children: [
      { name: "摄影" },
      { name: "音乐" },
      { name: "绘画" },
      { name: "游戏" },
      { name: "阅读" },
    ],
  },
  {
    id: "society",
    name: "社会",
    icon: Scale,
    color: "#64748B",
    children: [
      { name: "公益" },
      { name: "志愿者" },
      { name: "军旅" },
      { name: "警察" },
      { name: "医护" },
    ],
  },
  {
    id: "culture",
    name: "文化",
    icon: Landmark,
    color: "#B45309",
    children: [
      { name: "传统文化" },
      { name: "节日" },
      { name: "家乡故事" },
    ],
  },
  {
    id: "special",
    name: "特殊经历",
    icon: Sparkles,
    color: "#F97316",
    children: [
      { name: "重生般的人生转折" },
      { name: "生死瞬间" },
      { name: "奇遇" },
      { name: "灾难经历" },
      { name: "奇迹" },
    ],
  },
];

/** 根据分类 ID 查找分类 */
export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

/** 根据分类 ID 获取主题色（找不到时回退主色） */
export function getCategoryColor(id: string): string {
  return getCategoryById(id)?.color ?? "#5B8DEF";
}

/** 根据分类 ID 获取分类名 */
export function getCategoryName(id: string): string {
  return getCategoryById(id)?.name ?? id;
}

// ---------- 国家 / 城市 / 情绪（自动识别标签） ----------

export const countries = [
  "中国",
  "日本",
  "韩国",
  "美国",
  "法国",
  "英国",
  "德国",
  "澳大利亚",
  "加拿大",
  "新加坡",
  "泰国",
  "新西兰",
  "意大利",
  "西班牙",
  "荷兰",
];

export const cities = [
  "北京",
  "上海",
  "深圳",
  "广州",
  "杭州",
  "成都",
  "重庆",
  "南京",
  "武汉",
  "西安",
  "苏州",
  "长沙",
  "青岛",
  "厦门",
  "大理",
  "伦敦",
  "东京",
  "纽约",
  "巴黎",
  "悉尼",
];

export const emotions = [
  "治愈",
  "催泪",
  "温暖",
  "孤独",
  "励志",
  "遗憾",
  "释然",
  "热血",
  "平静",
  "感动",
  "共鸣",
  "希望",
];

/** 发现页热门标签 */
export const discoverTags = [
  "今日热门",
  "新发布",
  "编辑推荐",
  "真人故事",
  "治愈",
  "催泪",
  "北漂",
  "抗癌",
  "抑郁症",
  "创业失败",
  "异地恋",
  "独居",
  "90后",
  "单亲妈妈",
  "支教",
  "海归",
  "小镇青年",
];
