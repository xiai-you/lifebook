"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * 全局 Provider：主题（浅色 / 深色 / 系统）+ React Query（服务端状态）+ 会话恢复。
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  // 应用启动时恢复登录会话（读取本地 token → /auth/me）
  useEffect(() => {
    useAuthStore.getState().refresh();
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
