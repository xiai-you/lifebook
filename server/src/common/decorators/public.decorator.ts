import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/** 标记接口为公开访问（跳过 JWT 鉴权），例如登录 / 注册 / 首页流。 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
