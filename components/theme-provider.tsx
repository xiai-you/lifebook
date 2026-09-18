"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getSettings } from "@/lib/api";
import { useAuthStore, selectAuthStatus } from "@/lib/store/useAuthStore";

/**
 * 主题上下文 —— 支持 浅色 / 深色 / 跟随系统（需求文档第二节）
 * 通过 <html> 上的 .dark 类驱动 Tailwind darkMode: "class"。
 */

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "lifebook-theme";

function isTheme(v: unknown): v is Theme {
  return v === "light" || v === "dark" || v === "system";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (isTheme(saved)) return saved;
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  const status = useAuthStore(selectAuthStatus);

  // 应用主题到 <html>
  useEffect(() => {
    const apply = (t: Theme) => {
      const resolved = t === "system" ? getSystemTheme() : t;
      const root = document.documentElement;
      root.classList.toggle("dark", resolved === "dark");
      root.style.colorScheme = resolved;
      setResolved(resolved);
    };
    apply(theme);
  }, [theme]);

  // 初始化（读取 localStorage）
  useEffect(() => {
    setThemeState(getInitialTheme());
  }, []);

  // 登录后从后端设置恢复主题（仅当本地无显式偏好时），实现跨设备一致。
  useEffect(() => {
    if (status !== "authenticated") return;
    const local = window.localStorage.getItem(STORAGE_KEY);
    if (isTheme(local)) return;
    getSettings()
      .then((s) => {
        if (!s) return;
        const t = s.theme;
        if (isTheme(t)) {
          setThemeState(t);
          window.localStorage.setItem(STORAGE_KEY, t);
        }
      })
      .catch((e) => console.error("[theme] 恢复主题失败", e));
  }, [status]);

  // 跟随系统变化
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = mq.matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", resolved === "dark");
      document.documentElement.style.colorScheme = resolved;
      setResolved(resolved);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    window.localStorage.setItem(STORAGE_KEY, t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
