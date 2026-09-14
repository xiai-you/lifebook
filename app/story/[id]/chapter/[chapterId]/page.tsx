import { WorkDetail } from "@/components/work/WorkDetail";

/** 章节深链：直接打开阅读器定位到指定章节（章节 id 形如 `work-6-ch2`）。 */
export default function ChapterPage({
  params,
}: {
  params: { id: string; chapterId: string };
}) {
  const order = parseInt(params.chapterId.split("-ch").pop() ?? "1", 10) || 1;
  return <WorkDetail workId={params.id} initialChapter={order - 1} />;
}
