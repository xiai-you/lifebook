import { BadRequestException, Injectable } from "@nestjs/common";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { extname, join } from "path";

/**
 * 存储服务 —— 把上传的图片落盘到本地 uploads/ 目录，返回可访问的相对 URL。
 * 生产环境可无缝替换为对象存储（S3 / OSS / COS），契约不变：返回 { url }。
 */

/** multer 内存存储上传文件的最小形状（避免引入 @types/multer）。 */
export interface UploadedImage {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

@Injectable()
export class StorageService {
  /** 上传根目录：默认 <cwd>/uploads，可用 UPLOAD_DIR 覆盖。 */
  uploadRoot(): string {
    return process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads");
  }

  async save(userId: string, file?: UploadedImage): Promise<{ url: string }> {
    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException("未接收到文件");
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException("图片不能超过 8MB");
    }
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      throw new BadRequestException("仅支持 JPG / PNG / WebP / GIF / AVIF 图片");
    }

    const userDir = join(this.uploadRoot(), userId);
    if (!existsSync(userDir)) mkdirSync(userDir, { recursive: true });

    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    await writeFile(join(userDir, filename), file.buffer);

    // 相对路径：前端 /uploads 代理到后端静态目录，生产由网关/CDN 同源提供，不硬编码域名。
    return { url: `/uploads/${userId}/${filename}` };
  }
}
