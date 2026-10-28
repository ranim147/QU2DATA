import { ApolloError } from "apollo-server-express";
import { Permission } from "../Permission/model";
import { Role } from "../Role/model";
import { saveRoleInput, updateAccessInput } from "./type";
import { Access } from "./model";
export async function updateAccess(data: updateAccessInput) {
  const { value, accessType, accessId } = data;
  try {
    if (!accessId || !accessType || value == undefined)
      throw new ApolloError("ID OR VALUE OR ACCESS_TYPE NOT FOUND !");
    const access = await Access.findByPk(accessId);
    if (!access) {
      throw new ApolloError("ACCESS NOT FOUND ! ");
    }
    access[accessType] = value;
    await access.save();
    return {
      success: true,
      message: "ACCESS UPDATED ! ",
    };
  } catch (error) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: false,
      message: "Ops",
    };
  }
}
export async function saveAccess(data: saveRoleInput) {
  const { roleId, permissionId } = data;
  console.log(roleId);
  const role = await Role.findByPk(roleId);
  try {
    if (!role) {
      throw new ApolloError("ROLE NOT FOUND! ");
    }
    const permission = await Permission.findByPk(permissionId);

    if (!permission) {
      throw new ApolloError("PERMISSION NOT FOUND! ");
    }
    await Access.create({
      permissionId,
      roleId,
    });
    return {
      success: true,
      message: "ACCESS CREATED ! ",
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: false,
      message: "Ops",
    };
  }
}
