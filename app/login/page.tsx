"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MessageCircle, Apple, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** 登录 / 注册 —— 手机号/邮箱 + 密码；三方登录（Mock 直接登入）；忘记密码。 */
type Mode = "login" | "register" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [account, setAccount] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthHint, setOauthHint] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!account.trim()) return setError(mode === "login" ? "请输入用户名或邮箱" : "请输入用户名");
    if (mode === "register" && !nickname.trim()) return setError("请输入昵称");
    if (mode === "register" && password.length < 6) return setError("密码至少 6 位");
    if (mode === "register" && password !== confirmPassword) return setError("两次输入的密码不一致");
    if (mode === "login" && password.length < 6) return setError("密码至少 6 位");

    if (mode === "reset") {
      setError("密码重置功能即将开放，暂不支持线上重置。");
      return;
    }

    setLoading(true);
    try {
      const auth = useAuthStore.getState();
      if (mode === "login") {
        await auth.login(account.trim(), password);
      } else {
        await auth.register({ username: account.trim(), nickname: nickname.trim(), password });
      }
      router.push("/me");
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  function oauth(provider: string) {
    const label = provider === "wechat" ? "微信" : provider === "apple" ? "Apple" : "邮箱";
    setOauthHint(`${label}登录即将接入，请先使用账号密码登录。`);
  }

  const strength = passwordStrength(password);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-card/80 p-8 shadow-card ring-1 ring-white/60 backdrop-blur dark:ring-white/10">
        <div className="flex flex-col items-center">
          <Logo />
          <p className="mt-2 text-sm text-muted">
            {mode === "login" && "先记住自己，再遇见别人。"}
            {mode === "register" && "创建一个属于你的账户。"}
            {mode === "reset" && "重置你的密码。"}
          </p>
        </div>

        {/* 模式切换 */}
        <div className="mt-6 grid grid-cols-2 rounded-full bg-hover p-1">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              className={cn(
                "rounded-full py-2 text-sm font-medium transition-all",
                mode === m ? "bg-card text-foreground shadow-sm" : "text-muted"
              )}
            >
              {m === "login" ? "登录" : "注册"}
            </button>
          ))}
        </div>

        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {mode === "reset" ? (
            <div>
              <label className="mb-1.5 block text-xs text-muted">邮箱 / 手机号</label>
              <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="输入注册时用的邮箱或手机号" />
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-xs text-muted">
                  {mode === "login" ? "用户名 / 邮箱" : "用户名"}
                </label>
                <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder={mode === "login" ? "输入用户名或邮箱" : "输入用户名"} autoComplete="username" />
              </div>
              {mode === "register" && (
                <div>
                  <label className="mb-1.5 block text-xs text-muted">昵称</label>
                  <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="输入昵称" autoComplete="nickname" />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs text-muted">密码</label>
                <div className="relative">
                  <Input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="输入密码" autoComplete={mode === "login" ? "current-password" : "new-password"} className="pr-10" />
                  <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground" aria-label={showPwd ? "隐藏密码" : "显示密码"}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {mode === "register" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs text-muted">确认密码</label>
                    <Input type={showPwd ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再次输入密码" autoComplete="new-password" />
                  </div>
                  {password && (
                    <p className="text-xs text-subtle">
                      密码强度：
                      <span className={cn(
                        "font-medium",
                        strength.label === "强" ? "text-success" : strength.label === "中" ? "text-primary" : "text-danger"
                      )}>
                        {strength.label}
                      </span>
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {error && <p className="text-xs text-danger">{error}</p>}

          {mode === "login" && (
            <div className="flex justify-end">
              <button type="button" onClick={() => { setMode("reset"); setError(null); }} className="text-xs text-primary hover:underline">
                忘记密码？
              </button>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "请稍候…" : mode === "login" ? "登录" : mode === "register" ? "创建账号" : "发送重置链接"}
          </Button>
        </form>

        {/* 三方登录 */}
        <div className="mt-6">
          <div className="flex items-center gap-3 text-xs text-subtle">
            <span className="h-px flex-1 bg-divider" /> 其他方式登录 <span className="h-px flex-1 bg-divider" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "微信", icon: MessageCircle, cls: "text-emerald-500", provider: "wechat" },
              { label: "Apple", icon: Apple, cls: "text-foreground", provider: "apple" },
              { label: "邮箱", icon: Mail, cls: "text-foreground", provider: "email" },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button key={p.provider} onClick={() => oauth(p.provider)} disabled={loading} className="flex flex-col items-center gap-1.5 rounded-xl bg-hover py-3 text-xs text-muted transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50">
                  <Icon className={cn("h-5 w-5", p.cls)} /> {p.label}
                </button>
              );
            })}
          </div>
          {oauthHint && <p className="mt-3 text-center text-xs text-subtle">{oauthHint}</p>}
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-subtle">
          登录即代表同意
          <Link href="/terms" className="text-primary hover:underline">《用户协议》</Link>
          与
          <Link href="/privacy" className="text-primary hover:underline">《隐私政策》</Link>
        </p>
      </div>
    </div>
  );
}

/** 密码强度（弱 / 中 / 强）：基于长度与字符种类，用于注册时的前端提示。 */
function passwordStrength(pw: string): { label: string } {
  if (!pw) return { label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  const label = score <= 1 ? "弱" : score === 2 ? "中" : "强";
  return { label };
}
