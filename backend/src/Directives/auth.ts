import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import { ApolloError, ExpressContext, gql } from "apollo-server-express";
import { GraphQLSchema, defaultFieldResolver } from "graphql";
import { UserInstance } from "../App/User/model/user.model";
import { decode } from "../Helpers/Security/Helpers";
import { Options } from "../Helpers/Options/model";
import { Role } from "../App/Role/model";
export const directiveName = "auth";

export function typeDef() {
  return gql`
    directive @auth on OBJECT | FIELD_DEFINITION | INPUT_FIELD_DEFINITION
  `;
}

export function transformer(schema: GraphQLSchema) {
  const typeDirectiveArgumentMaps: Record<string, any> = {};
  return mapSchema(schema, {
    [MapperKind.TYPE]: (type) => {
      const authenticatedUser = getDirective(schema, type, directiveName)?.[0];
      if (authenticatedUser) {
        typeDirectiveArgumentMaps[type.name] = authenticatedUser;
      }
      return undefined;
    },
    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
      const authenticatedUser =
        getDirective(schema, fieldConfig, directiveName)?.[0] ??
        typeDirectiveArgumentMaps[typeName];
      if (authenticatedUser) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        fieldConfig.resolve = async function (source, args, context, info) {
          const ctx = await renderCtx(context);
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

export async function renderCtx<T extends ExpressContext>(
  context: T
): Promise<ContextWithUser> {
  const _user = await decode(context.req.headers.authorization);
  if (!_user) {
    const error = "You are not authenticated.";
    throw new ApolloError(error, "UNAUTHENTICATED");
  }

  if (_user.isBanned) {
    const error = "User is disabled.";
    throw new ApolloError(error, "USER_DISABLED");
  }
  const option_on = await Options.findOne({
    where: {
      option_name: "application_on",
    },
  });
  if (!option_on || option_on.dataValues.option_value !== "true") {
    const role = await Role.findByPk(_user.roleId);

    if (role.roleName !== "admin") {
      const errorMessage =
        "Access to construction mode is restricted to developers and administrators.";
      throw new ApolloError(
        errorMessage,
        "CONSTRUCTION_MODE_ACCESS_RESTRICTED"
      );
    }
  }

  return {
    ...context,
    user: _user,
  };
}
