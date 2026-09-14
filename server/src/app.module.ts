import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { WorksModule } from "./works/works.module";
import { AiModule } from "./ai/ai.module";
import { SearchModule } from "./search/search.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { MessagesModule } from "./messages/messages.module";
import { AdminModule } from "./admin/admin.module";
import { DiscoverModule } from "./discover/discover.module";
import { MeModule } from "./me/me.module";
import { StorageModule } from "./storage/storage.module";
import { HealthModule } from "./health/health.module";

import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

/**
 * 根模块。
 * JWT 鉴权 + RBAC 角色守卫通过 APP_GUARD 全局注册；公开接口用 @Public() 标注。
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    WorksModule,
    AiModule,
    SearchModule,
    NotificationsModule,
    MessagesModule,
    AdminModule,
    DiscoverModule,
    MeModule,
    StorageModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
