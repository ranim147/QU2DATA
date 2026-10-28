import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import { ApolloError, ExpressContext, gql } from "apollo-server-express";
import { GraphQLSchema, defaultFieldResolver } from "graphql";
import { UserInstance } from "../App/User/model/user.model";
import { decode } from "../Helpers/Security/Helpers";
import { Role } from "../App/Role/model";
import { Permission } from "../App/Permission/model";
import { renderCtx } from "./auth";
import { Access } from "../App/Access/model";
export const directiveName = "hasPermission";

export function typeDef() {
  return gql`
    directive @hasPermission(
      flag: String!
      access: String!
    ) on OBJECT | FIELD_DEFINITION | INPUT_FIELD_DEFINITION
  `;
}

export function transformer(schema: GraphQLSchema) {
  const typeDirectiveArgumentMaps: Record<string, any> = {};
  return mapSchema(schema, {
    [MapperKind.TYPE]: (type) => {
      const hasPermissionDirective = getDirective(
        schema,
        type,
        directiveName
      )?.[0];
      if (hasPermissionDirective) {
        typeDirectiveArgumentMaps[type.name] = hasPermissionDirective;
      }
      return undefined;
    },
    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
      const hasPermissionDirective =
        getDirective(schema, fieldConfig, directiveName)?.[0] ??
        typeDirectiveArgumentMaps[typeName];
      if (hasPermissionDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        const { flag, access } = hasPermissionDirective;
        fieldConfig.resolve = async function (source, args, context, info) {
          const ctx = await renderCtx(context);
          const roleId = ctx.user.roleId;
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

          const can = role.accesses.some(
            (a) =>
              (a.Permission.flag === flag && a[access]) ||
              (a.Permission.flag === flag && a.isFullAccess)
          );
          console.log(can, access, role.accesses);
          if (!can) {
            const error = "You are not authorized to this resource";
            throw new ApolloError(error, "UNAUTHORIZED");
          }
          return resolve(source, args, ctx, info);
        };
        return fieldConfig;
      }
    },
  });
}

export interface ContextWithUser extends ExpressContext {
  user: UserInstance;
}
