import type { Metadata } from "next";
import { getAuthorById } from "@/lib/api";
import { UserProfile } from "@/components/profile/UserProfile";

/** 用户主页（规范路由）—— 任何作者都可通过 /user/[id] 访问。 */
export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  try {
    const a = await getAuthorById(params.username);
    return { title: `${a?.nickname ?? "用户"} · LifeBook` };
  } catch (e) {
    // 元数据非关键路径：后端不可达时降级为通用标题，但记录错误（不静默吞掉）。
    console.error("[metadata] getAuthorById failed:", e);
    return { title: "用户 · LifeBook" };
  }
}

export default function UserPage({ params }: { params: { username: string } }) {
  return <UserProfile authorId={params.username} />;
}
