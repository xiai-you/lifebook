import type { MetadataRoute } from "next";

/** 站点地图（需求第二十一节：SEO） */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifebook.app";
  const routes = [
    "",
    "/discover",
    "/search",
    "/shelf",
    "/me",
    "/notifications",
    "/messages",
    "/create",
    "/login",
  ];
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
