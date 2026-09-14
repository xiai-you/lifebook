import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

/** Redis 客户端封装：用于缓存 / 热搜 / 限流 / 会话等。
 *  惰性连接：仅在实际发出命令时才连接（本机无 Redis 时可正常启动）。 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
    });
  }

  get redis(): Redis {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
