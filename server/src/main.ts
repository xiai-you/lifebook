import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { join } from "path";
import { AppModule } from "./app.module";

/**
 * LifeBook 后端入口。
 * 生产级配置：全局校验管道、API 版本前缀、OpenAPI 文档、安全头、CORS。
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 安全头
  app.use(helmet({ crossOriginResourcePolicy: false }));

  // CORS：生产环境用 CORS_ORIGIN 指定允许的域名（逗号分隔）；留空则开发环境放开。
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(",").map((s) => s.trim()) : true,
    credentials: true,
  });

  // 静态资源：上传的图片通过 /uploads/* 访问。
  // 必须与 StorageService.uploadRoot 同目录 —— 生产用 UPLOAD_DIR 指向持久卷。
  const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads");
  app.useStaticAssets(uploadDir, { prefix: "/uploads/" });

  // 全局前缀 + 版本：/api/v1/*
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  // 入参校验（DTO 白名单 + 自动转换类型）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // OpenAPI 文档（Swagger UI 挂载于 /docs）
  const config = new DocumentBuilder()
    .setTitle("LifeBook API")
    .setDescription("人生小说平台 · AI 人生故事后端接口")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.PORT ?? 3001);
  // 显式绑定 0.0.0.0（而非 localhost），供 Railway / 容器环境从外部访问。
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`LifeBook API 已启动：0.0.0.0:${port}/api/v1`);
}
bootstrap();
