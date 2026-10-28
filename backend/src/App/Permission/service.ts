import { ApolloError } from "apollo-server-express";
import { Role } from "../Role/model";
import { Permission } from "./model";
import { PermissionInstance } from "./model/permission.model";
import { getPermissionsForRoleInput } from "./type";
import { Access } from "../Access/model";
export async function findAll(): Promise<PermissionInstance[]> {
  return await Permission.findAll();
}

export async function getPermissionForRole(
  args: getPermissionsForRoleInput
): Promise<PermissionInstance[]> {
  const { roleId } = args;
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
    throw new ApolloError("role not found ! ");
  }
  const permissionAffectedToRole = role.accesses.map((e) => e.Permission);

  let result = await Permission.findAll();
  result = result.filter(
    (e) => permissionAffectedToRole.findIndex((e1) => e1.id === e.id) === -1
  );

  return result;
}
