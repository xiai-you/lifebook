import type { Metadata } from "next";

export const metadata: Metadata = { title: "关于 LifeBook" };

export default function AboutPage() {
  return (
    <article className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-foreground">关于 LifeBook</h1>
      <p className="text-base leading-relaxed text-muted">
        LifeBook 是一个把真实人生写成小说的社区。我们相信，每个人都是自己人生的主角，每段人生都值得被写下来、被读到、被理解。
      </p>
      <div className="space-y-4 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">我们做什么</h2>
          <p>
            LifeBook 用 AI 协作，帮助每个人把自己的真实经历整理、润色、文学化，写成可阅读、可共鸣的小说。同时，它是一个让陌生人因为「相似的经历」而相遇的社区。
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">我们的原则</h2>
          <p>
            AI 不会擅自改变你的人生——它只负责整理、润色与文学化表达，你永远拥有最终的编辑权。情绪分析是文学表达，不是医疗诊断。
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">联系我们</h2>
          <p>如果你有任何建议、故事或合作想法，欢迎通过站内私信或邮件联系我们。</p>
        </section>
      </div>
    </article>
  );
}
