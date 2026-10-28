// resolvers.ts

import {
  createByAdmin,
  createUser,
  Login,
  LoginWithToken,
  Me,
  RefreshTokenService,
  SendEmailValidationService,
  UpdateUser,
  ValidateEmailService,
  getUsers,
  updateByAdmin,
  DeleteUserByAdmin,
} from "./service";
import {
  GetOptions,
  LoginInput,
  RefreshTokenInput,
  UpdateArgs,
  createUserByAdminInput,
  createUserInput,
  updateUserByAdminInput,
} from "./types";
import {
  createUserByAdminInputSchema,
  createUserInputSchema,
  updateUserByAdminSchema,
} from "./validators";
import { parseDataValidation } from "../../Helpers/GeneralHelpers";
import { ContextWithUser } from "../../Directives/auth";
import graphqlFields from "graphql-fields";
import { GraphQLResolveInfo } from "graphql";
import { getIncludesAndRequestedFields } from "./helpers";

const resolvers = {
  Mutation: {
    createUser: async (_: any, args: createUserInput, context: any) => {
      try {
        const result = parseDataValidation(args, createUserInputSchema);
        if (result === true) {
          const headers = context.req.headers;
          return await createUser(args, headers);
        } else {
          return {
            ...result,
            user: null,
          };
        }
      } catch (error) {
        throw error;
      }
    },
    SendEmailValidation: async (
      _: any,
      __: any,
      context: ContextWithUser
    ) => {
      return await SendEmailValidationService(context.user);
    },
    ValidateEmail: async (_: any, { token }: { token: string }) => {
      return await ValidateEmailService(token);
    },
    createUserByAdmin: async (_: any, args: createUserByAdminInput) => {
      try {
        const result = parseDataValidation(args, createUserByAdminInputSchema);
        if (result === true) {
          const response = await createByAdmin(args);
          return response;
        } else {
          return {
            ...result,
            user: null,
          };
        }
      } catch (error) {
        throw error;
      }
    },

    Login: async (_: any, args: LoginInput, context: any) => {
      const headers = context.req.headers;
      try {
        const result = parseDataValidation(args, createUserInputSchema);
        if (result === true) {
          const { email, password } = args;
          const response = await Login({ email, password }, headers);
          return response;
        } else {
          return {
            ...result,
            user: null,
          };
        }
      } catch (error) {
        throw error;
      }
    },
    LoginWithToken: async (
      _: any,
      args: any,
      context: ContextWithUser,
      info: GraphQLResolveInfo
    ) => {
      const requestedFields = graphqlFields(info);

      const response = await LoginWithToken(context, requestedFields);
      return response;
    },
    RefreshToken: async (_: any, { token }: RefreshTokenInput) => {
      return await RefreshTokenService(token);
    },
    updateUserAttribute: async (_: any, args: UpdateArgs, __: any) => {
      return await UpdateUser(args);
    },
    updateUserByAdmin: async (_: any, args: updateUserByAdminInput) => {
      try {
        const result = parseDataValidation(args, updateUserByAdminSchema);
        if (result === true) {
          const response = await updateByAdmin(args);
          return response;
        } else {
          return {
            ...result,
            user: null,
          };
        }
      } catch (error) {
        throw error;
      }
    },
    deleteUserByAdmin: async (_: any, { userId }) => {
      try {
        console.log(userId);
        return await DeleteUserByAdmin(userId);
      } catch (error) {
        throw error;
      }
    },
  },
  Query: {
    Me: async (_: any, __: any, context: ContextWithUser) => {
      const user = context.user;
      if (!user) {
        throw "USER NOT FOUND ! ";
      }
      return await Me(user.id);
    },
    getUsers: async (
      _: any,
      args: GetOptions,
      __: any,
      info: GraphQLResolveInfo
    ) => {
      const { requestedFields, include } = getIncludesAndRequestedFields(
        graphqlFields(info)["rows"]
      );

      const users = await getUsers({ requestedFields, include, args });
      return users;
    },
  },
};

export default resolvers;
