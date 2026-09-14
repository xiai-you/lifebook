"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useRouter } from "next/navigation";
import {
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
  getMyInteractions,
  logout as apiLogout,
  type RegisterPayload,
} from "@/lib/api";
import { getAuthToken, isHttpMode } from "@/lib/api/http";
import { useAppStore } from "@/lib/store/useAppStore";
import type { User } from "@/types";

/**
 * 认证状态 —— 真正的账号系统：登录 / 注册 / 登出 / 会话恢复。
 * 用户数据来自后端 /auth/me；登出即失效 token。
 */

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/** 登录 / 会话恢复后，回填当前用户的互动状态（赞 / 藏 / 共鸣 / 关注）。 */
async function hydrateInteractions() {
  if (!isHttpMode()) return;
  try {
    useAppStore.getState().hydrate(await getMyInteractions());
  } catch (e) {
    // 互动状态非关键路径，失败不阻塞登录，但记录以便排查
    console.error("[hydrate] 互动状态回填失败", e);
  }
}

interface AuthState {
  user: User | null;
  status: AuthStatus;
  login: (account: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",

  async login(account, password) {
    const res = await apiLogin(account, password);
    set({ user: res.user, status: "authenticated" });
    hydrateInteractions();
    return res.user;
  },

  async register(payload) {
    const res = await apiRegister(payload);
    set({ user: res.user, status: "authenticated" });
    hydrateInteractions();
    return res.user;
  },

  logout() {
    apiLogout();
    useAppStore.getState().reset();
    set({ user: null, status: "unauthenticated" });
  },

  async refresh() {
    // Mock 模式：无后端，自动以演示账号进入（便于无后端演示）
    if (!isHttpMode()) {
      const user = await getCurrentUser();
      set({ user, status: "authenticated" });
      return;
    }
    if (!getAuthToken()) {
      set({ user: null, status: "unauthenticated" });
      return;
    }
    try {
      const user = await getCurrentUser();
      set({ user, status: "authenticated" });
      hydrateInteractions();
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },
}));

export const selectAuthUser = (s: AuthState) => s.user;
export const selectAuthStatus = (s: AuthState) => s.status;

/** 需要登录的交互守卫：未登录跳转登录页并返回 false。 */
export function useRequireLogin() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  return () => {
    if (status !== "authenticated") {
      router.push("/login");
      return false;
    }
    return true;
  };
}

/** 页面级登录守卫：未登录跳转登录页；返回当前认证状态。 */
export function useRequireAuth() {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);
  return status;
}
