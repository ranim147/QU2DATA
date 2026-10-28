import { Role } from "./model";
import { Permission } from "../Permission/model";
import { User } from "../User/model";
import { Access } from "../Access/model";
import {
  CreateRoleResponse,
  DeleteResponse,
  createRoleInput,
  deleteRoleInput,
} from "./types";
import { ApolloError } from "apollo-server-express";

export async function findAll() {
  return Role.findAll();
}
export async function statics(roleId: string) {
  const role = await Role.findByPk(roleId, {
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
  });
  const userCount = await User.count({
    include: [
      {
        model: Role, // Include the associated role
        where: { id: roleId }, // Filter by the role id
      },
    ],
  });

  return {
    role: role,
    userCount: userCount,
    accessesCount: role.accesses.length,
  };
}
export async function create(
  data: createRoleInput
): Promise<CreateRoleResponse> {
  try {
    const { roleName } = data;
    const result = await Role.create({ roleName: roleName });
    return {
      message: "ROLE ADDED SUCCESSFULLY",
      role: result,
      success: true,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        message: error.message,
        role: null,
        success: false,
      };
    }
    throw error;
  }
}
export async function deleteRole(
  data: deleteRoleInput
): Promise<DeleteResponse> {
  const { roleId } = data;
  try {
    if (!roleId) {
      throw new ApolloError("ID is required ! ");
    }
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new ApolloError("ROLE NOT FOUND ! ");
    }
    await role.destroy();
    return {
      message: "ROLE DELETED ! ",
      success: true,
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
}
