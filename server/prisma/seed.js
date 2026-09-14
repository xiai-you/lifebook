/* LifeBook 开发环境种子数据（真实感，非生产账号）。
 * 运行：node prisma/seed.js
 * 生成：52 用户 / 110 故事 / 300+ 章节 / 100 标签 / 关注·赞·藏·共鸣·评论·私信·通知·书架。
 * 测试账号（Development Seed Account）：alice / bob / maria，密码均为 lifebook123。
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// 确定性伪随机（保证每次 seed 结果一致）
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260912);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
};
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

const OCCUPATIONS = [
  "程序员", "护士", "厨师", "出租车司机", "摄影师", "教师", "留学生", "创业者", "退休教师",
  "外卖骑手", "医生", "设计师", "记者", "律师", "会计", "导游", "银行职员", "公务员",
  "自由职业", "全职妈妈", "大学生", "消防员", "服务员", "理发师", "装修工", "农民",
  "空乘", "编辑", "作家", "插画师", "建筑师", "工程师", "兽医", "社工", "店员", "快递员",
];
const CITIES = [
  "北京", "上海", "广州", "深圳", "杭州", "成都", "重庆", "南京", "武汉", "西安",
  "苏州", "长沙", "青岛", "厦门", "大连", "大理", "拉萨", "哈尔滨", "沈阳", "贵阳",
  "东京", "首尔", "纽约", "伦敦", "巴黎", "悉尼", "多伦多", "新加坡",
];
const COUNTRY_BY_CITY = { "东京": "日本", "首尔": "韩国", "纽约": "美国", "伦敦": "英国", "巴黎": "法国", "悉尼": "澳大利亚", "多伦多": "加拿大", "新加坡": "新加坡" };

const NICKNAMES = [
  "林小满", "陈默", "林晚", "苏小满", "老周", "阿青", "向南", "麦子", "沈星河", "方糖",
  "陆离", "白露", "林芳", "老赵", "王师傅", "顾", "阿北", "小北", "老吴", "何静",
  "周涛", "陈晓", "刘洋", "张伟", "李娜", "王芳", "赵磊", "孙悦", "吴敏", "郑浩",
  "冯雪", "蒋欣", "韩梅", "杨光", "朱琳", "秦朗", "许晴", "罗丹", "高远", "梁静",
  "宋佳", "唐磊", "顾宁", "沈括", "林可", "苏杭", "温言", "叶青", "夏雨", "程诺",
  "alice", "bob", "maria",
];
const BIOS = [
  "记录生活里那些普通又闪闪发光的瞬间。",
  "一个还在学着和生活和解的普通青年。",
  "记录独居生活里那些细碎的光。",
  "用食物写家乡，写妈妈。",
  "在异国他乡学着长大。",
  "熬过那些年，想把光分给你一点。",
  "从地下室到小公寓，城市五年。",
  "深夜的方向盘，装着一座城的秘密。",
  "用镜头替别人留住时间。",
  "一个人也可以是一个完整的家。",
];
const INTERESTS = ["成长", "爱情", "家庭", "职场", "旅行", "校园", "城市", "心理", "健康", "文化"];

const TAGS = [
  "北漂", "沪漂", "90后", "00后", "单亲妈妈", "抗癌", "小镇青年", "海归", "抑郁症", "创业失败",
  "异地恋", "高考", "独居", "地震", "罕见病", "支教", "夜班", "护士", "厨师", "出租车",
  "租房", "合租", "老家", "母亲", "父亲", "外婆", "祖父", "童年", "青春", "初恋",
  "暗恋", "分手", "婚姻", "离婚", "家庭", "职场", "裁员", "35岁危机", "裸辞", "大厂",
  "留学", "考研", "宿舍", "老师", "同学", "毕业", "旅行", "徒步", "骑行", "摄影",
  "美食", "故乡", "城市", "凌晨", "便利店", "医院", "急诊", "手术", "康复", "健身",
  "跑步", "马拉松", "抑郁", "焦虑", "孤独", "自愈", "成长", "转折", "生死", "奇迹",
  "灾难", "志愿者", "公益", "警察", "消防员", "医护", "乡村", "海边", "地铁", "机场",
  "火车", "出租屋", "菜市场", "学校", "养老院", "工厂", "办公室", "家庭餐桌", "手作", "传统",
  "老物件", "旧照片", "书信", "节日", "过年", "回家", "远方", "孤独感", "重逢", "告别",
];

const STORIES = [
  // [title, excerpt, summary, category, emotion, city, year, format, lifeStage, occupation]
  ["北京东三环的最后一个夜班", "凌晨四点我把卷帘门拉下来，突然不知道明天还要不要来。", "在东三环一家 24 小时便利店值了两年夜班。", "city", "平静", "北京", "2022", "LIFE_FRAGMENT", "初入社会", "便利店店员"],
  ["我爸留下的旧收音机", "旋钮已经磨得发亮，可我再也没听过那个频率。", "一台老式收音机，和一个沉默的父亲。", "family", "怀念", "西安", "1998", "MEMOIR", "中年", "工程师"],
  ["2017年，宿舍四楼", "毕业那天我把钥匙放在桌上，没有再拿回来。", "大学最后一晚，四个人的宿舍空了。", "school", "怀念", "武汉", "2017", "MEMOIR", "大学", "学生"],
  ["妈妈退休后的第一个冬天", "她忽然不知道每天早上该往哪儿去了。", "母亲退休后，花了整整一个冬天适应没有工作的日子。", "family", "平静", "沈阳", "2023", "MEMOIR", "成家", "退休教师"],
  ["我在上海租过的第四间房", "搬进去的时候墙皮在掉，搬出来的时候我已经不像刚来的人。", "四年换了四间出租屋，每一间都装着一段日子。", "city", "释然", "上海", "2021", "MEMOIR", "初入社会", "设计师"],
  ["凌晨三点的医院走廊", "父亲住院后的第 17 天，母亲第一次在楼梯间哭了。", "陪床的一个月，我看见了人间最真的一家人。", "health", "温暖", "重庆", "2024", "LIFE_FRAGMENT", "中年", "会计"],
  ["毕业以后，我没有回老家", "火车开走的时候，我故意没看窗外。", "一个北方小镇青年，在南方留下来。", "growth", "释然", "深圳", "2020", "MEMOIR", "初入社会", "程序员"],
  ["那张一直没寄出去的明信片", "地址我背得出来，却一次都没有写下过。", "从大理寄给自己的一张明信片，在抽屉里放了六年。", "love", "遗憾", "大理", "2019", "LETTER", "成年", "自由职业"],
  ["急诊科的第 100 个夜班", "下班前我在更衣室坐五分钟，把这一夜放下再回家。", "在急诊科来回穿梭的日子，比谁都珍惜天亮。", "health", "敬畏", "武汉", "2023", "DIARY", "成年", "护士"],
  ["一个人的深夜便利店", "凌晨两点的店里只有我一个人，和货架上没卖完的面包。", "独居第三年，深夜便利店成了我的固定去处。", "mind", "孤独", "上海", "2022", "LIFE_FRAGMENT", "成年", "编辑"],
  ["守了二十年的小馆子，今年关门了", "摘招牌那天，老街坊来点了最后一桌回锅肉。", "一家开了二十年的川菜馆，最后一天营业。", "culture", "不舍", "重庆", "2024", "MEMOIR", "中年", "厨师"],
  ["我载过的 8000 个乘客", "每个坐进我车里的人，都带着一个不肯说出口的故事。", "二十六年出租车，八万个陌生人。", "city", "平静", "北京", "2023", "ORAL_HISTORY", "中年", "出租车司机"],
  ["给父母拍一张合照，用了十年", "相机换了一台又一台，却始终没按下那张合照的快门。", "想给父母拍张合影，拖了十年。", "family", "遗憾", "大理", "2024", "PHOTO_STORY", "成年", "摄影师"],
  ["出租屋里那张折叠桌", "我在那张桌上吃掉了三年的外卖，也写完了我的辞职信。", "一张二手折叠桌，陪我走过最拮据的三年。", "career", "释然", "广州", "2021", "LIFE_FRAGMENT", "初入社会", "设计师"],
  ["我没有去参加毕业典礼", "那天我在地铁上，听着同学们在群里发合照。", "为了一个面试，错过了自己的毕业典礼。", "school", "遗憾", "深圳", "2018", "MEMOIR", "初入社会", "程序员"],
  ["凌晨三点的急诊室", "有的人在这里醒来，有的人在这里告别。", "值夜班时看到的，都是别人最紧急的人生。", "society", "敬畏", "武汉", "2023", "LIFE_FRAGMENT", "成年", "医生"],
  ["送外卖的第 300 天", "雨天摔了一跤，餐盒洒了，客户却先问我摔没摔伤。", "跑外卖一年，见识了这座城市最真实的一面。", "career", "坚韧", "深圳", "2022", "MEMOIR", "初入社会", "外卖骑手"],
  ["工厂流水线上的十年", "同一个动作做了一百万次，青春就过去了。", "在电子厂流水线干了十年。", "career", "平静", "东莞", "2015", "MEMOIR", "中年", "工人"],
  ["第一次坐飞机，我 45 岁", "起飞的时候我手心里全是汗，像第一次出门打工那天。", "45 岁第一次坐飞机，去看在海外的女儿。", "growth", "感动", "沈阳", "2023", "LIFE_FRAGMENT", "中年", "农民"],
  ["深夜的地铁末班车", "末班车上的人，各有各的不容易。", "加班到末班车，才看清这座城市的另一面。", "city", "孤独", "上海", "2022", "LIFE_FRAGMENT", "初入社会", "程序员"],
  ["乡下奶奶的院子", "那棵枣树去年枯了，可我还是梦见它结满了枣。", "童年的暑假，都在奶奶的院子里。", "family", "怀念", "河南", "1999", "MEMOIR", "童年", "公务员"],
  ["办公室凌晨的灯", "加班到两点，抬头看见对面楼也还亮着一盏。", "那些年一起熬夜的项目组。", "career", "共鸣", "北京", "2021", "SHORT_STORY", "成年", "产品经理"],
  ["给父亲的一封信", "爸，我最近换了工作，一直没敢告诉你。", "写给已经走了三年的父亲。", "family", "催泪", "长沙", "2024", "LETTER", "中年", "记者"],
  ["初到深圳的第一个月", "口袋里还剩 340 块，我数了三遍。", "2008 年，第一次来深圳。", "city", "励志", "深圳", "2008", "MEMOIR", "初入社会", "创业者"],
  ["病房走廊的深夜", "陪床的第 40 天，我在走廊里听见隔壁床的家属在哭。", "一场大病，让我重新认识了家人。", "health", "温暖", "重庆", "2024", "LIFE_FRAGMENT", "中年", "会计"],
  ["离家的那趟火车", "绿皮火车的窗外，故乡越来越小，最后变成一个点。", "第一次离开县城，去省城读书。", "growth", "怀念", "江西", "2010", "MEMOIR", "青春", "学生"],
  ["第一次一个人过年", "出租屋里煮了一碗饺子，咬下去的时候眼泪就下来了。", "第一次没回家过年。", "city", "孤独", "北京", "2019", "LIFE_FRAGMENT", "初入社会", "程序员"],
  ["考研二战，我上岸了", "成绩出来那天，我一个人在出租屋里哭到半夜。", "二战考研的那一年。", "school", "热血", "西安", "2022", "MEMOIR", "成年", "学生"],
  ["送妈妈最后一程", "她走的那天，我忽然成了家里必须拿主意的人。", "关于告别，和成为一个大人。", "family", "催泪", "合肥", "2021", "MEMOIR", "中年", "教师"],
  ["急诊室里的一杯热水", "那个陌生阿姨递来的热水，我记了五年。", "一次深夜急诊，被陌生人暖到。", "society", "温暖", "广州", "2019", "LIFE_FRAGMENT", "成年", "护士"],
  ["老屋拆迁前的一晚", "我把每一扇门都关了一遍，像和童年告别。", "住了二十年的老屋，拆迁前最后一晚。", "culture", "怀念", "重庆", "2023", "MEMOIR", "中年", "公务员"],
  ["从护士到患者，我换了角色", "躺在病床上的那一刻，我才懂病人为什么总在夜里醒着。", "护士确诊后，第一次以患者的身份住院。", "health", "敬畏", "武汉", "2022", "MEMOIR", "成年", "护士"],
  ["深夜加班回家路上的路灯", "那盏路灯一直亮着，像在等我。", "通勤三年的那条路，和那些晚归的日子。", "city", "共鸣", "深圳", "2021", "LIFE_FRAGMENT", "成年", "程序员"],
  ["我和母亲的电话", "每次挂电话前，她都要问我一句吃了没有。", "离家之后，和母亲每周一次的电话。", "family", "温暖", "成都", "2023", "DIARY", "成年", "程序员"],
  ["第一次领工资的那天", "3800 块，我给家里转了两千。", "毕业后的第一份工资。", "growth", "平静", "杭州", "2019", "LIFE_FRAGMENT", "初入社会", "设计师"],
  ["独自生活的第一年", "学会了自己修水管，也学会了一个人吃饭。", "独居教会我的那些事。", "mind", "平静", "上海", "2020", "MEMOIR", "成年", "编辑"],
  ["在海边打工的那个夏天", "每天下班去海边坐一会儿，鞋里都是沙子。", "大学暑假，在青岛海边的民宿打工。", "travel", "平静", "青岛", "2016", "MEMOIR", "大学", "学生"],
  ["父亲的摩托车", "那辆摩托车早就报废了，可我还记得它排气管的声音。", "父亲骑了二十年的摩托车。", "family", "怀念", "长沙", "2005", "MEMOIR", "童年", "教师"],
  ["第一次被裁员", "HR 说了什么我一句没听进去，只记得那天在下雨。", "工作三年，第一次被裁员。", "career", "释然", "深圳", "2022", "MEMOIR", "成年", "产品经理"],
  ["当妈妈的第三年", "她第一次说'妈妈'的时候，我正把她的奶瓶放进消毒柜。", "从一个女孩，变成一个人的妈妈。", "family", "温暖", "杭州", "2024", "DIARY", "成家", "全职妈妈"],
  ["租来的小阳台", "阳台上那盆绿萝，是我在这个城市里唯一的活物。", "在上海的第三间出租屋，有一个小阳台。", "city", "平静", "上海", "2021", "PHOTO_STORY", "初入社会", "插画师"],
  ["外婆的缝纫机", "那台缝纫机早就不转了，可我还记得她踩踏板的样子。", "外婆走后，家里剩下一台老缝纫机。", "family", "催泪", "成都", "2018", "MEMOIR", "青春", "编辑"],
  ["第一次创业失败", "公司关掉那天，我把剩下的办公用品打包寄回了家。", "第一次创业，赔光了积蓄。", "career", "坚韧", "杭州", "2019", "MEMOIR", "成年", "创业者"],
  ["住院部窗外的树", "那棵树从枯到绿，正好是我住院的三周。", "手术后的三周，每天都在看窗外那棵树。", "health", "平静", "南京", "2022", "DIARY", "成年", "教师"],
  ["一个人的年夜饭", "点了四个菜，吃到一半就凉了。", "疫情那年，一个人留在工作的城市过年。", "city", "孤独", "北京", "2020", "LIFE_FRAGMENT", "初入社会", "程序员"],
  ["那条回家的路", "路修宽了，可我记得的，还是那条泥巴路。", "老家门前的路，变了又变。", "culture", "怀念", "河南", "2012", "MEMOIR", "青春", "农民"],
  ["我开网约车的第七年", "后视镜里，看过太多人靠在车窗上睡着。", "网约车司机的七年。", "city", "平静", "成都", "2024", "ORAL_HISTORY", "中年", "网约车司机"],
  ["女儿出生那天", "产房门口，我蹲在地上，突然不知道该做什么。", "成为父亲的那一天。", "family", "温暖", "武汉", "2021", "LIFE_FRAGMENT", "成家", "工程师"],
  ["把爱好做成店", "第一单生意，是个陌生人来定做一只皮夹。", "手工皮具店的第一年。", "hobby", "坚韧", "成都", "2023", "MEMOIR", "成年", "手艺人"],
  ["深夜的大排档", "凌晨一点的大排档，坐满了刚下夜班的人。", "城市夜生活的另一面。", "society", "温暖", "广州", "2022", "PHOTO_STORY", "成年", "摄影师"],
  ["我教过的最后一届学生", "毕业那天，有个孩子塞给我一张纸条：老师，谢谢你没放弃我。", "支教两年，教过的最后一届。", "society", "温暖", "黔东南", "2018", "MEMOIR", "成年", "支教老师"],
  ["和父亲的最后一次散步", "那天他走得比平时慢，我没催他。", "父亲走之前的那个秋天。", "family", "催泪", "西安", "2019", "MEMOIR", "中年", "公务员"],
  ["搬到新城市的第一天", "搬家公司走后，我坐在地板上，屋子空得能听见回声。", "换了一座城市，重新开始。", "city", "平静", "杭州", "2022", "MEMOIR", "成年", "设计师"],
  ["图书馆的旧书", "借书卡上还留着上一个读者的名字。", "在图书馆旧书里，读到别人留下的痕迹。", "culture", "平静", "南京", "2023", "LIFE_FRAGMENT", "成年", "学生"],
  ["凌晨四点的菜市场", "摊主们已经开始摆货，天还没亮。", "早起去买菜，看见了城市的另一种作息。", "culture", "温暖", "广州", "2022", "PHOTO_STORY", "成年", "摄影师"],
  ["第一次异地", "高铁站送别，我们都说不出'再见'。", "异地恋的第一年。", "love", "遗憾", "武汉", "2019", "MEMOIR", "成年", "程序员"],
  ["养老院的下午", "那个老人每天下午都坐在窗边，等一个不会再来看他的人。", "在养老院做义工的周末。", "society", "温暖", "南京", "2023", "LIFE_FRAGMENT", "成年", "社工"],
  ["我的第一台相机", "二手店淘来的，快门数已经三万多。", "用第一台相机开始拍照。", "hobby", "平静", "大理", "2017", "MEMOIR", "成年", "摄影师"],
  ["上夜班的人", "白天睡觉，晚上上班，和整个世界有时差。", "工厂夜班的那段日子。", "career", "平静", "东莞", "2016", "DIARY", "初入社会", "工人"],
  ["妈妈腌的咸菜", "离家之后，就再也没吃到那个味道。", "妈妈腌的咸菜，是一种回不去的味道。", "family", "怀念", "湖南", "2015", "MEMOIR", "青春", "编辑"],
  ["一封没写完的信", "写了三页，最后只寄出去半张。", "写给一个再也见不到的人。", "love", "遗憾", "成都", "2020", "LETTER", "成年", "作家"],
];

const CATEGORY_L2 = {
  school: ["校园", "青春", "留学", "高考"], city: ["北漂", "沪漂", "城市观察"], career: ["职场", "裁员", "创业"],
  family: ["父母", "亲情", "告别"], mind: ["孤独", "自愈", "成长"], health: ["康复", "医护", "慢病"],
  love: ["爱情", "异地恋", "婚姻"], growth: ["成长", "转折", "中年"], travel: ["旅行", "远方"],
  culture: ["家乡", "传统", "老物件"], society: ["公益", "人间观察"], special: ["生死", "奇迹"], hobby: ["热爱", "手作"],
};
const COVER_COLORS = ["#5B8DEF", "#7A8A99", "#9A8C7E", "#6E7B8B", "#8A7F8D", "#5F7A6B", "#9B6B5E", "#5A6B7A", "#8C6F5A", "#7A6E8C", "#6B7A5F", "#A07A5B"];
const EMOTIONS = ["治愈", "催泪", "温暖", "孤独", "励志", "遗憾", "释然", "热血", "平静", "感动", "共鸣", "希望"];
const COMMENT_POOL = [
  "看哭了，写的就是我本人。",
  "「生活里那些普通又闪闪发光的瞬间」这句真的破防了。",
  "谢谢你愿意把这段经历写下来，活着本身就是最大的勇敢。",
  "抱抱你，我们都不是一个人在走。",
  "这段让我想起了我的父亲。",
  "真实的人生，比小说更动人。",
  "我也在北京，已经十年了。",
  "读到一半，眼泪就下来了。",
  "谢谢你让我知道，我不是一个人。",
  "文笔太好了，像在看一部电影。",
  "这就是普通人的史诗。",
  "收藏了，改天慢慢读。",
];

async function main() {
  console.log("清空旧数据…");
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.resonate.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.like.deleteMany();
  await prisma.shelfItem.deleteMany();
  await prisma.workAi.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.work.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tag.deleteMany();

  console.log("创建标签…");
  const tagIds = {};
  for (const name of TAGS) {
    const t = await prisma.tag.create({ data: { name } });
    tagIds[name] = t.id;
  }

  console.log("创建用户…");
  const users = [];
  const passwordHash = await bcrypt.hash("lifebook123", 10);
  for (let i = 0; i < NICKNAMES.length; i++) {
    const nickname = NICKNAMES[i];
    const city = pick(CITIES);
    const country = COUNTRY_BY_CITY[city] ?? "中国";
    const username = i === 0 ? "alice" : i === 1 ? "bob" : i === 2 ? "maria" : `${nickname.toLowerCase()}_${int(100, 999)}`;
    const email = i === 0 ? "alice@example.com" : i === 1 ? "bob@example.com" : i === 2 ? "maria@example.com" : null;
    const u = await prisma.user.create({
      data: {
        username,
        nickname,
        email,
        passwordHash,
        avatar: `https://i.pravatar.cc/150?u=${username}`,
        bio: pick(BIOS),
        region: `${city} · ${pick(["朝阳", "海淀", "静安", "天河", "锦江", "余杭", "鼓楼", "古城", "雁塔", "渝中"])}`,
        country,
        role: "AUTHOR",
        interests: JSON.stringify(pickN(INTERESTS, int(2, 5))),
        tags: JSON.stringify([pick(["90后", "00后", "北漂", "沪漂", "留学生", "小镇青年"]), pick(TAGS)]),
        createdDays: int(1, 1800),
      },
    });
    users.push(u);
  }

  console.log("创建作品与章节…");
  const works = [];
  for (let i = 0; i < 120; i++) {
    const [title, excerpt, summary, categoryL1, emotion, city, year, format, lifeStage, occupation] = STORIES[i % STORIES.length];
    const author = users[int(0, users.length - 1)];
    const chapterCount = int(3, 6);
    const viewCount = int(0, 260000);
    const likeCount = int(0, Math.round(viewCount * 0.1));
    const commentCount = int(0, Math.round(viewCount * 0.03));
    const storySource =
      format === "ORAL_HISTORY" ? "ORAL_TRANSCRIPT"
      : format === "PHOTO_STORY" ? "AUTHOR_PHOTO"
      : i % 3 === 0 ? "AI_ASSISTED"
      : "AUTHOR_WRITTEN";
    const w = await prisma.work.create({
      data: {
        authorId: author.id,
        title: title + (i >= STORIES.length ? `（${["上", "下", "续", "外传"][int(0, 3)]}）` : ""),
        summary,
        excerpt,
        year,
        format,
        lifeStage,
        occupation,
        storySource,
        feedKind: format === "PHOTO_STORY" ? "PHOTO" : format === "SHORT_STORY" ? "NOVEL" : "ESSAY",
        momentLabel: year && occupation ? `${year} · ${occupation}` : year ?? occupation ?? null,
        featuredLine: excerpt,
        categoryL1,
        categoryL2: pick(CATEGORY_L2[categoryL1] ?? ["其他"]),
        emotion,
        city,
        country: COUNTRY_BY_CITY[city] ?? "中国",
        coverColor: pick(COVER_COLORS),
        coverImage: `https://picsum.photos/seed/lifebook-${i}/600/800`,
        totalWords: int(1200, 30000),
        chapterCount,
        status: rand() > 0.3 ? "ONGOING" : "COMPLETED",
        visibility: "PUBLIC",
        coverRatio: pick(["RATIO_16_9", "RATIO_3_4", "RATIO_1_1"]),
        viewCount,
        likeCount,
        collectCount: int(0, Math.round(likeCount * 0.4)),
        commentCount,
        resonateCount: int(0, Math.round(likeCount * 0.28)),
        readMinutes: int(3, 30),
        publishAt: new Date(Date.now() - int(0, 400) * 86400000),
        tags: { connect: pickN(Object.keys(tagIds), int(2, 5)).map((n) => ({ id: tagIds[n] })) },
      },
    });
    works.push(w);

    const para = [
      { type: "paragraph", text: excerpt },
      { type: "paragraph", text: `${year ? year + " 年" : "那一年"}，${city ? "在" + city : ""}，这件事真实地发生在我身上。很多细节已经模糊了，可当时的心情，现在想起来还很清楚。` },
      { type: "quote", text: excerpt },
    ];
    for (let c = 1; c <= chapterCount; c++) {
      await prisma.chapter.create({
        data: {
          workId: w.id,
          order: c,
          title: `第${["一", "二", "三", "四", "五", "六", "七", "八"][c - 1]}章 · ${pick(["开始", "那时", "转折", "回望", "和解", "后来"])}`,
          content: JSON.stringify([
            { type: "paragraph", text: `这是第 ${c} 章。关于「${title}」，我想从${year ? year + " 年" : "最早"}说起。` },
            ...para,
            ...(c % 2 === 0 ? [{ type: "image", alt: "章节配图", caption: `${city} · 故事里的一个画面`, layout: "center" }] : []),
          ]),
          wordCount: int(600, 3000),
        },
      });
    }
  }

  console.log("创建关注 / 赞 / 收藏 / 共鸣 / 评论…");
  for (const u of users) {
    const following = users.filter((x) => x.id !== u.id && rand() > 0.8).slice(0, int(2, 12));
    for (const f of following) {
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: u.id, followingId: f.id } },
        create: { followerId: u.id, followingId: f.id },
        update: {},
      }).catch(() => {});
    }
    const liked = works.filter(() => rand() > 0.85).slice(0, int(3, 25));
    for (const w of liked) {
      await prisma.like.upsert({ where: { userId_workId: { userId: u.id, workId: w.id } }, create: { userId: u.id, workId: w.id }, update: {} }).catch(() => {});
    }
    const collected = liked.filter(() => rand() > 0.5).slice(0, 6);
    for (const w of collected) {
      await prisma.collection.upsert({ where: { userId_workId: { userId: u.id, workId: w.id } }, create: { userId: u.id, workId: w.id }, update: {} }).catch(() => {});
    }
    const resonated = liked.filter(() => rand() > 0.6).slice(0, 4);
    for (const w of resonated) {
      await prisma.resonate.upsert({ where: { userId_workId: { userId: u.id, workId: w.id } }, create: { userId: u.id, workId: w.id }, update: {} }).catch(() => {});
    }
  }

  // 评论（为主角账号的作品制造真实评论区）
  for (let i = 0; i < 220; i++) {
    const w = works[int(0, works.length - 1)];
    const author = users[int(0, users.length - 1)];
    await prisma.comment.create({
      data: {
        workId: w.id,
        authorId: author.id,
        content: pick(COMMENT_POOL),
        likes: int(0, 3000),
        createdAt: new Date(Date.now() - int(0, 200) * 86400000),
      },
    });
  }

  // 为主角账号（alice）生成书架 / 私信 / 通知
  const alice = users[0];
  for (let i = 0; i < 6; i++) {
    const w = works[i];
    await prisma.shelfItem.upsert({
      where: { userId_workId: { userId: alice.id, workId: w.id } },
      create: { userId: alice.id, workId: w.id, progress: pick([0.2, 0.42, 0.6, 0.75, 1]), lastChapterOrder: int(1, 3) },
      update: {},
    });
  }
  const contacts = users.slice(1, 6);
  for (const c of contacts) {
    const [a, b] = [alice.id, c.id].sort();
    const conv = await prisma.conversation.upsert({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      create: { userAId: a, userBId: b, lastMessage: pick(COMMENT_POOL) },
      update: {},
    });
    await prisma.message.create({ data: { conversationId: conv.id, fromId: c.id, content: pick(COMMENT_POOL), read: rand() > 0.5 } });
    await prisma.message.create({ data: { conversationId: conv.id, fromId: alice.id, content: "谢谢你读我的故事。" } });
  }
  const notifTypes = ["LIKE", "COMMENT", "FOLLOW", "COLLECT", "AI", "OFFICIAL"];
  for (let i = 0; i < 8; i++) {
    const actor = contacts[i % contacts.length];
    await prisma.notification.create({
      data: {
        userId: alice.id,
        type: notifTypes[i % notifTypes.length],
        actorId: actor.id,
        workId: works[i % works.length].id,
        content: pick(COMMENT_POOL),
        read: i > 2,
      },
    });
  }

  console.log("种子完成：", users.length, "用户 /", works.length, "作品");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
