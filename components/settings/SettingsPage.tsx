"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Camera, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser, updateProfile, getSettings, updateSettings, uploadImage } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTheme, type Theme } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

/**
 * 设置页 —— 全部真实持久化到数据库（PATCH /me/profile、PATCH /me/settings）。
 * 保存成功建立在 API 成功响应之上；刷新 / 退出重登后数据仍在。
 */
export function SettingsPage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: getCurrentUser });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });

  // 个人资料（本地编辑态，从用户数据同步）
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [region, setRegion] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // 设置（本地编辑态，从后端同步）
  const [notifLike, setNotifLike] = useState(true);
  const [notifComment, setNotifComment] = useState(true);
  const [notifFollow, setNotifFollow] = useState(true);
  const [notifAi, setNotifAi] = useState(true);
  const [visibility, setVisibility] = useState("public");

  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
      setBio(user.bio ?? "");
      setRegion(user.region ?? "");
      setAvatar(user.avatar ?? null);
      setCoverImage(user.coverImage ?? null);
    }
  }, [user]);

  useEffect(() => {
    if (settings) {
      setNotifLike(settings.notificationLike !== false);
      setNotifComment(settings.notificationComment !== false);
      setNotifFollow(settings.notificationFollow !== false);
      setNotifAi(settings.notificationAi !== false);
      if (typeof settings.storyDefaultVisibility === "string") {
        setVisibility(settings.storyDefaultVisibility);
      }
    }
  }, [settings]);

  function flash(type: "success" | "error", text: string) {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 2500);
  }

  const profileMut = useMutation({
    mutationFn: (p: { nickname: string; bio: string; region: string }) =>
      updateProfile({ nickname: p.nickname, bio: p.bio, region: p.region }),
    onSuccess: async () => {
      await useAuthStore.getState().refresh();
      queryClient.invalidateQueries({ queryKey: ["me"] });
      flash("success", "资料已更新");
    },
    onError: () => flash("error", "保存失败，请稍后重试"),
  });

  const avatarMut = useMutation({
    mutationFn: (avatar: string) => updateProfile({ avatar }),
    onSuccess: async () => {
      await useAuthStore.getState().refresh();
      queryClient.invalidateQueries({ queryKey: ["me"] });
      flash("success", "头像已更新");
    },
    onError: () => flash("error", "头像上传失败，请重试"),
  });

  const coverMut = useMutation({
    mutationFn: (coverImage: string) => updateProfile({ coverImage }),
    onSuccess: async () => {
      await useAuthStore.getState().refresh();
      queryClient.invalidateQueries({ queryKey: ["me"] });
      flash("success", "背景已更新");
    },
    onError: () => flash("error", "背景上传失败，请重试"),
  });

  const settingsMut = useMutation({
    mutationFn: () =>
      updateSettings({
        notificationLike: notifLike,
        notificationComment: notifComment,
        notificationFollow: notifFollow,
        notificationAi: notifAi,
        storyDefaultVisibility: visibility,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      flash("success", "设置已保存");
    },
    onError: () => flash("error", "保存失败，请稍后重试"),
  });

  function pickAvatar() {
    fileRef.current?.click();
  }

  function pickCover() {
    coverRef.current?.click();
  }

  async function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) {
      flash("error", "请选择图片文件");
      return;
    }
    try {
      const { url } = await uploadImage(file);
      setAvatar(url);
      avatarMut.mutate(url);
    } catch (err) {
      flash("error", err instanceof Error ? err.message : "头像上传失败，请重试");
    }
  }

  async function onCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) {
      flash("error", "请选择图片文件");
      return;
    }
    try {
      const { url } = await uploadImage(file);
      setCoverImage(url);
      coverMut.mutate(url);
    } catch (err) {
      flash("error", err instanceof Error ? err.message : "背景上传失败，请重试");
    }
  }

  function changeTheme(t: Theme) {
    setTheme(t);
    updateSettings({ theme: t })
      .then(() => queryClient.invalidateQueries({ queryKey: ["settings"] }))
      .catch(() => {});
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">设置</h1>
      </div>

      {notice && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm",
            notice.type === "success" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}
        >
          {notice.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {notice.text}
        </div>
      )}

      {/* 个人资料 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">个人资料</h2>
        <div className="rounded-2xl bg-card/60 p-4 ring-1 ring-divider sm:p-5">
          <div className="flex items-center gap-4">
            <button onClick={pickAvatar} className="group relative" aria-label="更换头像">
              <Avatar name={nickname || "我"} src={avatar} size="xl" className="h-20 w-20 text-2xl" />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-5 w-5 text-white" />
              </span>
              {avatarMut.isPending && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
            <div className="text-sm text-muted">
              <p className="font-medium text-foreground">头像</p>
              <p className="mt-0.5 text-xs text-subtle">点击更换，支持 JPG / PNG，保存后立即生效</p>
            </div>
          </div>

          {/* 主页背景 */}
          <div className="mt-4">
            <div className="relative h-28 w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#6a8cf5] via-[#8a7bf0] to-[#b48be0]">
              {coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImage} alt="主页背景" className="h-full w-full object-cover" />
              )}
              <button
                onClick={pickCover}
                className="absolute inset-0 flex items-center justify-center bg-black/20 text-xs font-medium text-white opacity-0 transition-opacity hover:opacity-100"
              >
                <Camera className="mr-1.5 h-4 w-4" /> 更换背景
              </button>
              {coverMut.isPending && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </span>
              )}
            </div>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onCoverFile} />
            <p className="mt-1 text-xs text-subtle">主页背景，展示在个人主页顶部</p>
          </div>

          <div className="mt-4 space-y-3">
            <Field label="昵称">
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="你的昵称" />
            </Field>
            <Field label="所在地">
              <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="如：北京 · 海淀" />
            </Field>
            <Field label="一句话介绍">
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="写一句关于你的话" />
            </Field>
          </div>

          <div className="mt-4">
            <Button onClick={() => profileMut.mutate({ nickname, bio, region })} disabled={profileMut.isPending} className="gap-1.5">
              {profileMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              保存资料
            </Button>
          </div>
        </div>
      </section>

      {/* 外观 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">外观</h2>
        <div className="rounded-2xl bg-card/60 p-4 ring-1 ring-divider sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">深色模式</p>
              <p className="text-xs text-subtle">跟随你的设备或手动切换</p>
            </div>
            <div className="flex gap-1 rounded-full bg-hover p-1">
              {(["light", "dark", "system"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => changeTheme(t)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs transition-colors",
                    theme === t ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
                  )}
                >
                  {t === "light" ? "浅色" : t === "dark" ? "深色" : "跟随系统"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 通知 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">通知</h2>
        <div className="divide-y divide-divider rounded-2xl bg-card/60 ring-1 ring-divider">
          <ToggleRow label="有人赞了我的作品" checked={notifLike} onChange={setNotifLike} />
          <ToggleRow label="有人评论 / 收藏" checked={notifComment} onChange={setNotifComment} />
          <ToggleRow label="有人关注了我" checked={notifFollow} onChange={setNotifFollow} />
          <ToggleRow label="AI 创作进度提醒" checked={notifAi} onChange={setNotifAi} />
        </div>
      </section>

      {/* 隐私 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">默认可见范围</h2>
        <div className="rounded-2xl bg-card/60 p-4 ring-1 ring-divider sm:p-5">
          <div className="flex gap-2">
            {([
              ["public", "公开", "所有人可见"],
              ["followers", "仅关注者", "只有关注你的人可见"],
              ["private", "仅自己", "只有你自己可见"],
            ] as const).map(([key, label, desc]) => (
              <button
                key={key}
                onClick={() => setVisibility(key)}
                className={cn(
                  "flex-1 rounded-xl p-3 text-left ring-1 transition-colors",
                  visibility === key ? "bg-primary/10 ring-primary" : "bg-hover ring-transparent hover:ring-divider"
                )}
              >
                <p className={cn("text-sm font-medium", visibility === key ? "text-primary" : "text-foreground")}>{label}</p>
                <p className="mt-0.5 text-xs text-subtle">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={() => settingsMut.mutate()} disabled={settingsMut.isPending} className="gap-1.5">
          {settingsMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          保存设置
        </Button>
        <Button variant="ghost" onClick={() => window.history.back()}>返回</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-muted">{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between px-4 py-3 text-left sm:px-5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-primary" : "bg-hover")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </span>
    </button>
  );
}
