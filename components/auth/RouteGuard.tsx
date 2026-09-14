"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * 路由级登录守卫：包裹整棵页面树。
 * 受保护路径（书架/消息/通知/我的/写作/设置）未登录自动跳转 /login；
 * 公开页面（首页/发现/搜索/故事/用户/分类/标签/登录）无需登录即可浏览。
 */
const PROTECTED = ["/shelf", "/messages", "/notifications", "/me", "/write", "/settings"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (isProtected && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [isProtected, status, router]);

  // 受保护页面且尚未确认登录：不渲染（等待会话恢复或跳转）
  if (isProtected && status !== "authenticated") return null;

  return <>{children}</>;
}
