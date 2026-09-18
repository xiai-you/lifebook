import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: "昵称（可重复）" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  nickname?: string;

  @ApiPropertyOptional({ description: "一句话简介" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @ApiPropertyOptional({ description: "头像（图片 URL）" })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  avatar?: string;

  @ApiPropertyOptional({ description: "主页背景（图片 URL）" })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  coverImage?: string;

  @ApiPropertyOptional({ description: "地区" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @ApiPropertyOptional({ description: "国家" })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string;

  @ApiPropertyOptional({ description: "性别（male/female/other/secret）" })
  @IsOptional()
  @IsIn(["male", "female", "other", "secret"])
  gender?: string;

  @ApiPropertyOptional({ type: [String], description: "兴趣" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ type: [String], description: "个人标签" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationLike?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationComment?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationFollow?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationAi?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  messagePrivacy?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profileVisibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storyDefaultVisibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readingFont?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readingFontSize?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readingLineHeight?: string;
}
