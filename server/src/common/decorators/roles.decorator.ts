import { SetMetadata } from "@nestjs/common";
import { Role } from "../enums";

export const ROLES_KEY = "roles";

/** 标记接口所需的角色（RBAC）。例如 @Roles(Role.ADMIN)。 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
