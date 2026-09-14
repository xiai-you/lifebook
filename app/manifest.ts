import type { MetadataRoute } from "next";

/** PWA Manifest —— 支持安装为独立应用。 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeBook · 人生小说平台",
    short_name: "LifeBook",
    description: "把真实人生写成小说，让故事飞向世界。",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#5b8def",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
