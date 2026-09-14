import { redirect } from "next/navigation";

/** 旧路由 /work/[id] → 新规范路由 /story/[id]（保持旧链接可用）。 */
export default function WorkRedirect({ params }: { params: { workId: string } }) {
  redirect(`/story/${params.workId}`);
}
