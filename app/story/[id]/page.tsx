import type { Metadata } from "next";
import { getWorkById } from "@/lib/api";
import { WorkDetail } from "@/components/work/WorkDetail";

/** 故事详情页（规范路由）—— 服务端生成 SEO 元数据，交互交给 WorkDetail 客户端组件。 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const work = await getWorkById(params.id);
    if (!work) return { title: "故事不存在 · LifeBook" };
    return {
      title: `${work.title} · LifeBook`,
      description: work.summary,
      openGraph: { title: `${work.title} · LifeBook`, description: work.summary, type: "article" },
    };
  } catch (e) {
    // 元数据非关键路径：后端不可达时降级为通用标题，但记录错误（不静默吞掉）。
    console.error("[metadata] getWorkById failed:", e);
    return { title: "故事 · LifeBook" };
  }
}

export default function StoryPage({ params }: { params: { id: string } }) {
  return <WorkDetail workId={params.id} />;
}
