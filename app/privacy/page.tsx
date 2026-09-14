import type { Metadata } from "next";

export const metadata: Metadata = { title: "隐私政策 · LifeBook" };

export default function PrivacyPage() {
  return (
    <article className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-foreground">隐私政策</h1>
      <div className="space-y-4 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-1.5 text-base font-semibold text-foreground">1. 我们收集什么</h2>
          <p>你主动提供的信息（昵称、简介、作品内容）以及用于提供服务的必要信息。</p>
        </section>
        <section>
          <h2 className="mb-1.5 text-base font-semibold text-foreground">2. 我们如何使用</h2>
          <p>仅用于提供创作、阅读与社区互动服务，不会出售你的个人数据。</p>
        </section>
        <section>
          <h2 className="mb-1.5 text-base font-semibold text-foreground">3. 你的权利</h2>
          <p>你可以随时编辑、删除自己的内容，也可以申请导出或删除账号数据。</p>
        </section>
      </div>
    </article>
  );
}
