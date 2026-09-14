import type { Metadata } from "next";
import { WriteStudio } from "@/components/write/WriteStudio";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const metadata: Metadata = { title: "写下你的人生 · LifeBook" };

/** AI 人生故事工作室 —— 采访 → 生成 → 编辑 → 发布（需登录）。 */
export default function WritePage() {
  return (
    <RequireAuth>
      <WriteStudio />
    </RequireAuth>
  );
}
