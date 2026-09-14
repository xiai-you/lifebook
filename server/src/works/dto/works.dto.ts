import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { CoverRatio, WorkStatus, WorkVisibility } from "../../common/enums";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export class ChapterInputDto {
  @ApiProperty({ description: "章节标题" })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ description: "结构化内容块（ContentBlock[]：paragraph/heading/quote/divider/image…）" })
  @IsArray()
  blocks!: unknown[];
}

export class CreateWorkDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty()
  @IsString()
  summary!: string;

  @ApiProperty()
  @IsString()
  categoryL1!: string;

  @ApiProperty()
  @IsString()
  categoryL2!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryL3?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emotion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  // 内容模型（编辑排版核心）
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lifeStage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  year?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storySource?: string;

  // 首页内容形态（生活流混合排版）
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsString()
  feedKind?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  momentLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  featuredLine?: string;

  /** 正文（纯文本，创建时转为一个章节） */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  /** 结构化章节（多章节 + 内容块，含图片）。提供时优先于 content。 */
  @ApiPropertyOptional({ type: [ChapterInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterInputDto)
  chapters?: ChapterInputDto[];

  @ApiPropertyOptional({ enum: WorkVisibility })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsEnum(WorkVisibility)
  visibility?: WorkVisibility;

  @ApiPropertyOptional({ enum: CoverRatio })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" && value.includes(":") ? `RATIO_${value.replace(":", "_")}` : value
  )
  @IsEnum(CoverRatio)
  coverRatio?: CoverRatio;
}

export class UpdateWorkDto extends PartialType(CreateWorkDto) {
  @ApiPropertyOptional({ enum: WorkStatus })
  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus;
}

export class QueryWorksDto {
  @ApiPropertyOptional({ description: "排序：recommend / latest / hot / follow" })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: "一级分类 ID" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: "二级分类" })
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiPropertyOptional({ description: "作者 ID" })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: "标签名" })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}
