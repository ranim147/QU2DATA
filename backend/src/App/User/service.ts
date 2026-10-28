import { ApolloError } from "apollo-server-express";
import { GenerateUserName } from "../../Helpers/GeneralHelpers";
import { User } from "./model";
import {
  GetOptions,
  GetUsersResponse,
  SearchUserInput,
  UpdateArgs,
  createUserByAdminInput,
  createUserInput,
  updateUserByAdminInput,
} from "./types";
import {
  comparePasswords,
  generateBearerToken,
  generateEmailValidationToken,
  generateRefreshToken,
  hashPassword,
  verifyEmailValidationToken,
  verifyRefreshToken,
} from "../../Helpers/Security/Helpers";
import { sendEmailHelperWithTemplate } from "../../Helpers/Email";
import { GetOptionBy } from "../../Helpers/Options/service";
import config from "../../Config/config.json";
import { ContextWithUser } from "../../Directives/auth";
import { UserAttributes, UserInstance } from "./model/user.model";
import { IncomingHttpHeaders } from "http";
import { Role } from "../Role/model";
import { Permission } from "../Permission/model";
import { RoleAttributes, RoleInstance } from "../Role/model/role.model";
import { Model, Op } from "sequelize";
import { Access } from "../Access/model";
import { includes } from "lodash";

export const findAll = async () => {
  const result = User.findAll();
  return result;
};
export const findUserBy = async (input: SearchUserInput) => {
  const { param, value } = input;

  // Check if the specified parameter is a valid field in the User model
  const validFields = Object.keys(User.getAttributes());
  if (!validFields.includes(param)) {
    throw new Error(`Invalid parameter: ${param}`);
  }

  const whereCondition: Record<string, string | number> = {};
  whereCondition[param] = value;

  const user = await User.findOne({
    where: whereCondition,
  });

  return user;
};
export const updateLoginFields = async (
  input: UserInstance,
  headers?: IncomingHttpHeaders
) => {
  input.lastLogin = new Date();
  if (headers  && headers["user-agent"]) {
    input.user_agent = headers["user-agent"];
  }
  await input.save();
  return input;
};
interface GetUsersOptions {
  requestedFields: Partial<UserAttributes>;
  include: Array<Partial<RoleAttributes>>;
  args: GetOptions;
}
export const getUsers = async ({
  requestedFields,
  include,
  args,
}: GetUsersOptions): Promise<GetUsersResponse> => {
  try {
    const { page = 1, limit = 10, filter = {} } = args;
    const offset = (page - 1) * limit;
    const keys = Object.keys(filter);
const searchOptions: any[] = [];

keys.forEach((key) => {
      const searchOption = {};
      // iLike keeps the case-insensitive matching MySQL's LIKE used to provide
      searchOption[key] = { [Op.iLike]: filter[key] };
      searchOptions.push(searchOption);
    });
    const dataRows = await User.findAndCountAll({
      attributes: Object.keys(requestedFields),
      include: include.map((role) => ({ model: Role, ...role })),
      offset,
      limit,
      where: { [Op.or]: searchOptions },
    });
    return dataRows;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};
export const LoginWithToken = async (
  input: ContextWithUser,
  requestedFields: any
) => {
  try {
    const { user } = input;
    const { id } = user;
    const { headers } = input.req;
    let exist = await User.findByPk(id, {
      include: [
        {
          model: Role, // Include the associated role
          include: [
            {
              model: Access,
              as: "accesses", // Include the associated accesses within the role
              include: [
                {
                  model: Permission, // Include the associated permissions within the access
                },
              ],
            },
          ],
        },
      ],
    });
    if (!exist) {
      throw new ApolloError("BAD CREDENTIALS");
    }
    if (exist.isBanned) {
      throw new ApolloError("BANNED USER");
    }
    exist = await updateLoginFields(exist, headers);
    const token = generateBearerToken(exist);
    const refreshToken = generateRefreshToken(exist.id);
    exist.requested_token = refreshToken;
    exist.requested_tokenAt = new Date();
    await exist.save();
    return {
      user: exist,
      token: token,
      refreshToken: refreshToken,
      success: true,
      message: "USER LOGIN SUCCESSFUL",
    };
  } catch (error) {
    if (error instanceof ApolloError) {
      return {
        message: error.message,
        user: null,
        success: false,
      };
    }
    throw error;
  }
};
export const UpdateUser = async (input: UpdateArgs): Promise<boolean> => {
  const { userId, attribute, value, type_attribute } = input;
  let success = false;

  try {
    let new_value;

    switch (type_attribute) {
      case "DATE":
        new_value = new Date(value);
        break;
      case "BOOLEAN":
        new_value = value === "true";
        break;
      case "NUMBER":
        new_value = Number(value);
        break;
      // Add cases for other attribute types if needed
      default:
        // Handle default case if necessary
        new_value = value; // or throw an error
        break;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApolloError("USER NOT FOUND");
    }

    user[attribute] = new_value;
    await user.save();
    success = true;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new ApolloError("Error updating user");
  }

  return success;
};

export const DeleteUserByAdmin = async (id: string) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new ApolloError("USER NOT FOUND");
    }
    await user.destroy();
    return {
      success: true,
      message: "USER DELETED",
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        message: error.message,
        success: false,
      };
    }
    throw error;
  }
};
export const Login = async (input: createUserInput, headers: any) => {
  try {
    const { email, password } = input;
    const exist = await findUserBy({
      param: "email",
      value: email,
    });
    if (!exist) {
      throw new ApolloError("BAD CREDENTIALS");
    }
    const passwordVerify = await comparePasswords(password, exist.password);
    if (!passwordVerify) {
      throw new ApolloError("BAD CREDENTIALS");
    }
    if (exist.isBanned) {
      throw new ApolloError("BANNED USER");
    }
    exist.lastLogin = new Date();
    exist.user_agent = headers["user-agent"];
    const refreshToken = generateRefreshToken(exist.id);
    exist.requested_token = refreshToken;
    exist.requested_tokenAt = new Date();
    const connected = await exist.save();
    const token = generateBearerToken(exist);
    return {
      user: connected,
      token: token,
      refreshToken: refreshToken,
      success: true,
      message: "USER LOGIN SUCCESSFUL",
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        message: error.message,
        user: null,
        success: false,
      };
    }
    throw error;
  }
};
export const updateByAdmin = async (input: updateUserByAdminInput) => {
  const { userId, email, password, roleId } = input;
  try {
    if (!userId) {
      throw new ApolloError("USER NOT FOUND");
    }
    const hashedPassword = await hashPassword(password);
    const existRole = await Role.findByPk(roleId);
    if (!existRole) {
      throw new ApolloError("ROLE NOT FOUND");
    }
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApolloError("USER NOT FOUND");
    }
    user.email = email;
    user.password = hashedPassword;
    user.roleId = roleId;
    const result = await user.save();
    return {
      message: "User updated successfully",
      user: result,
      success: true,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        message: error.message,
        user: null,
        success: false,
      };
    }
    throw error;
  }
};
export const createByAdmin = async (input: createUserByAdminInput) => {
  try {
    const { email, password, roleId } = input;
    const user_name = GenerateUserName(email);
    const hashedPassword = await hashPassword(password);
    const exist =
      (await findUserBy({
        param: "email",
        value: email,
      })) !== null;
    if (exist) {
      throw new ApolloError("Email Exist ");
    }
    const existRole = await Role.findByPk(roleId);
    if (!existRole) {
      throw new ApolloError("ROLE NOT FOUND");
    }
    const userToAdd = {
      email: email,
      password: hashedPassword,
      isActive: false,
      isBanned: false,
      user_name: user_name,
      roleId: roleId,
    };

    // Create a new user in the database
    const newUser = await User.create(userToAdd);

    return {
      message: "User created successfully",
      user: newUser,
      success: true,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        message: error.message,
        user: null,
        success: false,
      };
    }
    throw error;
  }
};

const sendValidationEmail = async (user: UserInstance) => {
  const validationToken = generateEmailValidationToken(user.id);
  const validationUrl = `${config.frontendRouter}/validation/email/${validationToken}`;
  await sendEmailHelperWithTemplate(
    user.email,
    "Validate your email address",
    "validation.email.hbs",
    [{ att_name: "validationUrl", att_value: validationUrl }]
  );
};

export const createUser = async (
  input: createUserInput,
  headers?: IncomingHttpHeaders
) => {
  try {
    const { email, password } = input;
    const exist = await findUserBy({ param: "email", value: email });
    if (exist) {
      throw new ApolloError("EMAIL ALREADY EXISTS");
    }

    // Resolve the default role for self-registered users
    const option = await GetOptionBy({
      param: "option_name",
      value: "default_user_role",
    });
    let role = null as RoleInstance | null;
    if (option && !Array.isArray(option)) {
      role = await Role.findByPk(option.dataValues.option_value);
    }
    if (!role) {
      role = await Role.findOne({ where: { roleName: "user" } });
    }
    if (!role) {
      throw new ApolloError("REGISTRATION IS NOT AVAILABLE");
    }

    const hashedPassword = await hashPassword(password);
    
    const newUser = await User.create({
      email,
      password: hashedPassword,
      isActive: false,
      isBanned: false,
      user_name: GenerateUserName(email),
      roleId: role.id,
      user_agent: headers ? headers["user-agent"] : null,
      lastLogin: new Date(),
    });

    // Log the user in right away so the validation flow can run authenticated
    const newRefreshToken = generateRefreshToken(newUser.id);
    newUser.requested_token = newRefreshToken;
    newUser.requested_tokenAt = new Date();
    await newUser.save();
    const token = generateBearerToken(newUser);

    await sendValidationEmail(newUser);

    return {
      user: newUser,
      token,
      refreshToken: newRefreshToken,
      success: true,
      message: "USER CREATED",
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        message: error.message,
        user: null,
        success: false,
      };
    }
    throw error;
  }
};

export const SendEmailValidationService = async (user: UserInstance) => {
  try {
    if (user.isActive) {
      return { success: true, message: "EMAIL ALREADY VALIDATED" };
    }
    await sendValidationEmail(user);
    return { success: true, message: "VALIDATION EMAIL SENT" };
  } catch (error) {
    return { success: false, message: "COULD NOT SEND VALIDATION EMAIL" };
  }
};

export const ValidateEmailService = async (token: string) => {
  try {
    const decoded = verifyEmailValidationToken(token);
    if (!decoded) {
      throw new ApolloError("INVALID OR EXPIRED TOKEN");
    }
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new ApolloError("USER NOT FOUND");
    }
    if (user.isActive) {
      return { success: true, message: "EMAIL ALREADY VALIDATED" };
    }
    user.isActive = true;
    await user.save();
    return { success: true, message: "EMAIL VALIDATED" };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return { message: error.message, success: false };
    }
    throw error;
  }
};

export const RefreshTokenService = async (token: string) => {
  try {
    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      throw new ApolloError("INVALID REFRESH TOKEN");
    }
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new ApolloError("USER NOT FOUND");
    }
    if (user.requested_token !== token) {
      throw new ApolloError("INVALID REFRESH TOKEN");
    }
    if (user.isBanned) {
      throw new ApolloError("BANNED USER");
    }
    const newToken = generateBearerToken(user);
    const newRefreshToken = generateRefreshToken(user.id);
    user.requested_token = newRefreshToken;
    user.requested_tokenAt = new Date();
    await user.save();
    return {
      token: newToken,
      refreshToken: newRefreshToken,
      user,
      success: true,
      message: "TOKEN REFRESHED",
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        message: error.message,
        token: null,
        refreshToken: null,
        user: null,
        success: false,
      };
    }
    throw error;
  }
};

export async function Me(id: string) {
  try {
    const user = await User.findByPk(id, {
      include: {
        model: Role
      }
    });
    if (!user) {
      throw new ApolloError("USER NOT FOUND");
    }
    return user;
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        message: error.message,
        user: null,
        success: false,
      };
    }
    throw error;
  }
}
