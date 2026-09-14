import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ description: "用户名（唯一）" })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username!: string;

  @ApiProperty({ description: "昵称" })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  nickname!: string;

  @ApiProperty({ description: "密码" })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ description: "邮箱（可选）", required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}
