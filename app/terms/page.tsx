import type { Metadata } from "next";

export const metadata: Metadata = { title: "用户协议 · LifeBook" };

export default function TermsPage() {
  return (
    <article className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-foreground">用户协议</h1>
      <div className="space-y-4 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-1.5 text-base font-semibold text-foreground">1. 内容真实性</h2>
          <p>LifeBook 鼓励你书写真实的人生经历。你对自己发布内容的真实性、合法性负责。</p>
        </section>
        <section>
          <h2 className="mb-1.5 text-base font-semibold text-foreground">2. 隐私与安全</h2>
          <p>你可以选择作品的可见范围（公开 / 仅关注者 / 仅自己），也可以匿名发布、模糊地点、隐藏身份信息。</p>
        </section>
        <section>
          <h2 className="mb-1.5 text-base font-semibold text-foreground">3. 社区规范</h2>
          <p>请尊重每一个真实的人。禁止仇恨、骚扰、人身攻击与未经同意的隐私泄露。</p>
        </section>
        <section>
          <h2 className="mb-1.5 text-base font-semibold text-foreground">4. AI 生成内容</h2>
          <p>AI 只做整理、润色与文学化表达，不会擅自改变你的真实经历。你拥有最终编辑权。</p>
        </section>
      </div>
    </article>
  );
}
