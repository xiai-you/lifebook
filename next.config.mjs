/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
// 生产环境必须显式配置后端代理目标，禁止静默回退 localhost；开发环境可回退本机后端。
if (isProd && !process.env.API_PROXY_TARGET) {
  throw new Error(
    "生产环境必须设置 API_PROXY_TARGET（例如 https://<后端域名>），禁止回退到 localhost:3001。"
  );
}
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "http://localhost:3001";

const nextConfig = {
  // 开发环境将 /api/v1 代理到 NestJS 后端，避免跨域（前端 http 模式使用相对路径）。
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_PROXY_TARGET}/api/v1/:path*`,
      },
      {
        // 上传的图片由后端静态目录提供，前端同源访问（生产由网关/CDN 同源）。
        source: "/uploads/:path*",
        destination: `${API_PROXY_TARGET}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
