import { UserInstance } from "../App/User/model/user.model";
import { decode } from "../Helpers/Security/Helpers";
import { Options } from "../Helpers/Options/model";
import { Role } from "../App/Role/model";
import { Request, Response, NextFunction } from "express";
import { ApolloError } from "apollo-server-express";
declare module "express-serve-static-core" {
  interface Request {
    user?: UserInstance;
  }
}
export function authMiddleware() {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const user = await decode(req.headers.authorization);
       
      
      if (req.method === "OPTIONS") {
      return next();
    }


      if (!user) {
        throw new ApolloError("You are not authenticated.", "UNAUTHENTICATED");
      }

      if (user.isBanned) {
        throw new ApolloError("User is disabled.", "USER_DISABLED");
      }

      const optionOn = await Options.findOne({
        where: {
          option_name: "application_on",
        },
      });

      if (!optionOn || optionOn.option_value !== "true") {
        const role = await Role.findByPk(user.roleId);

        if (!role || role.roleName !== "admin") {
          throw new ApolloError(
            "Access to construction mode is restricted to developers and administrators.",
            "CONSTRUCTION_MODE_ACCESS_RESTRICTED"
          );
        }
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
