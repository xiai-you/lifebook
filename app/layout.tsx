import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { Footer } from "@/components/layout/Footer";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { CreateFab } from "@/components/shared/CreateFab";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifebook.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "LifeBook · 人生小说平台", template: "%s · LifeBook" },
  description:
    "LifeBook —— 每个人都是自己人生的主角。用 AI 把你的真实人生写成小说，让故事飞向世界。",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: "LifeBook · 人生小说平台",
    title: "LifeBook · 把真实人生写成小说",
    description: "AI 协作，把每个人的真实经历变成可阅读、可共鸣的小说。",
  },
  twitter: {
    card: "summary_large_image",
    title: "LifeBook · 人生小说平台",
    description: "AI 协作，把真实人生写成小说，让故事飞向世界。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1115" },
  ],
};

/** 首屏主题初始化脚本（避免深色模式闪烁 FOUC） */
const themeInitScript = `(function(){try{var t=localStorage.getItem('lifebook-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');}document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

/**
 * 根布局 —— 桌面：顶部导航 + 左侧导航 + 内容 + 右侧栏 + 底部
 *          移动：移动顶部栏 + 内容（全宽）+ 底部 Tab 栏
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}",
          }}
        />
        {/* 多层背景氛围（固定不动，随内容滚动形成视差）：柔和渐变 + 模糊色块 + 颗粒噪点 */}
        <div aria-hidden className="bg-atmosphere pointer-events-none fixed inset-0 -z-10" />
        <div aria-hidden className="grain pointer-events-none fixed inset-0 -z-10 opacity-[0.03]" />
        <Providers>
          <MobileTopBar />

          <div className="mx-auto flex min-h-screen w-full max-w-[1560px]">
            <LeftSidebar />
            <main className="min-w-0 flex-1">
              <div className="mx-auto w-full max-w-[680px] px-4 pb-24 pt-16 lg:px-6 lg:pb-16 lg:pt-8">
                <RouteGuard>{children}</RouteGuard>
                <Footer />
              </div>
            </main>
            <RightSidebar />
          </div>

          <BottomTabBar />
          <CreateFab />
        </Providers>
      </body>
    </html>
  );
}
