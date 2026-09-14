import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { StorageService, type UploadedImage } from "./storage.service";

/** 存储上传 —— 登录后上传图片，返回 { url }。 */
@ApiTags("storage")
@ApiBearerAuth()
@Controller("storage")
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  upload(@CurrentUser() user: User, @UploadedFile() file?: UploadedImage) {
    return this.storage.save(user.id, file);
  }
}
