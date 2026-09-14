"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * 认证守卫 —— 包裹需要登录的页面。
 * 未登录自动跳转 /login；恢复会话期间显示轻量加载态。
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-subtle">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return <>{children}</>;
}
