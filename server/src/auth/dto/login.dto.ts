import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ description: "用户名或邮箱" })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  account!: string;

  @ApiProperty({ description: "密码" })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;
}
