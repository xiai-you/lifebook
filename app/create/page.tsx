import { redirect } from "next/navigation";

/** 旧写作入口 /create → 新「人生故事工作室」/write。 */
export default function CreateRedirect() {
  redirect("/write");
}
