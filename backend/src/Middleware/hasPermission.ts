import { UserInstance } from "../App/User/model/user.model";
import { Role } from "../App/Role/model";
import { Permission } from "../App/Permission/model";
import { Request, Response, NextFunction } from "express";
import { ApolloError } from "apollo-server-express";
import { Access } from "../App/Access/model";

export function hasPermissionMiddleware(flag: string, access: string) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as UserInstance;
      if (!user) {
        throw new ApolloError("You are not authenticated.", "UNAUTHENTICATED");
      }
      const roleId = user.roleId;
      const role = await Role.findByPk(roleId, {
        include: {
          model: Access,
          as: "accesses", // Include the associated accesses within the role
          include: [
            {
              model: Permission, // Include the associated permissions within the access
            },
          ],
        },
      });

      if (!role) {
        throw new ApolloError("Role not found.", "INTERNAL_SERVER_ERROR");
      }

      const can = role.accesses.some(
        (a) =>
          (a.Permission.flag === flag && a[access]) ||
          (a.Permission.flag === flag && a.isFullAccess)
      );
      if (!can) {
        const error = "You are not authorized to this resource";
        throw new ApolloError(error, "UNAUTHORIZED");
      }
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
