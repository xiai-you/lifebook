import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "../common/enums";
import { Roles } from "../common/decorators/roles.decorator";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.EDITOR)
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("stats")
  stats() {
    return this.admin.stats();
  }

  @Get("users")
  users(@Query("page") page?: number) {
    return this.admin.listUsers(Number(page ?? 1));
  }

  @Patch("users/:id/role")
  updateRole(@Param("id") id: string, @Body() body: { role: Role }) {
    return this.admin.updateRole(id, body.role);
  }

  @Get("works")
  works(@Query("page") page?: number) {
    return this.admin.listWorks(Number(page ?? 1));
  }
}
