import { ApolloError } from "apollo-server-express";
import { Op } from "sequelize";
import { Project, ProjectUser } from "./model";
import { createDefaultPageForProject } from "../Page/service";
import { User } from "../User/model";
import { findUserBy } from "../User/service";
import { sequelize } from "../../Config/database";
import {
  GetProjectsOptions,
  GetProjectsResponse,
  SearchProjectInput,
  createProjectInput,
  inviteCollaboratorInput,
  removeCollaboratorInput,
  updateCollaboratorRoleInput,
  updateProjectInput,
} from "./types";

import { ensureProjectAccess, getMembership } from "./helpers";
export const findAll = async () => {
  return Project.findAll();
};

export const findProjectBy = async (input: SearchProjectInput) => {
  const { param, value } = input;

  const validFields = Object.keys(Project.getAttributes());
  if (!validFields.includes(param)) {
    throw new Error(`Invalid parameter: ${param}`);
  }

  const whereCondition: Record<string, string | number> = {};
  whereCondition[param] = value;

  return Project.findOne({ where: whereCondition });
};


export const getProjects = async (
  userId: string,
  args: GetProjectsOptions
): Promise<GetProjectsResponse> => {
  try {
    const { page = 1, limit = 10, filter = {} } = args;
    const offset = (page - 1) * limit;
    const keys = Object.keys(filter);
    const searchOptions: any[] = [];
    keys.forEach((key) => {
      const searchOption = {};
      searchOption[key] = { [Op.iLike]: `%${filter[key]}%` };
      searchOptions.push(searchOption);
    });

    const projectIds= ProjectUser.findAll({
      where: { userId },
      attributes: ['projectId'],
    });
    const dataRows = await Project.findAndCountAll({
      include: [
        {
          model: User,
          as: "members",
          where: { id: userId },
          attributes: [],
          through: { attributes: [] },
        },
      ],
      offset,
      limit,
      where: searchOptions.length ? { [Op.or]: searchOptions } : undefined,
    });
    return dataRows;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

export const createProject = async (
  input: createProjectInput,
  userId: string
) => {
  try {
    const result = await sequelize.transaction(async (transaction) => {
      const project = await Project.create(
        {
          name: input.name,
          description: input.description ?? null,
          domain: input.domain ?? null,
          objective: input.objective ?? null,
        },
        { transaction }
      );

      // The project creator is automatically added as the owner member
      await ProjectUser.create(
        {
          projectId: project.id,
          userId,
          isOwner: true,
        },
        { transaction }
      );

      // Create the default Studio page for this project
      await createDefaultPageForProject(project.id, transaction);

      return project;
    });

    return {
      message: "PROJECT CREATED",
      project: result,
      success: true,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return { message: error.message, project: null, success: false };
    }
    throw error;
  }
};
export const updateProject = async (
  input: updateProjectInput,
  userId: string
) => {
  const { projectId, ...fields } = input;
  try {
    // Tout membre peut modifier le projet
    await ensureProjectAccess(projectId, userId, false);

    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new ApolloError("PROJECT NOT FOUND");
    }

    Object.keys(fields).forEach((key) => {
      if (fields[key] !== undefined) {
        project[key] = fields[key];
      }
    });
    await project.save();

    return { message: "PROJECT UPDATED", project, success: true };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return { message: error.message, project: null, success: false };
    }
    throw error;
  }
};

export const deleteProject = async (projectId: string, userId: string) => {
  try {
    // Seul un owner peut supprimer le projet
    await ensureProjectAccess(projectId, userId, true);

    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new ApolloError("PROJECT NOT FOUND");
    }

    await ProjectUser.destroy({ where: { projectId } });
    await project.destroy();

    return { success: true, message: "PROJECT DELETED" };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return { message: error.message, success: false };
    }
    throw error;
  }
};

export const inviteCollaborator = async (
  input: inviteCollaboratorInput,
  requesterId: string
) => {
  const { projectId, email, isOwner } = input;
  try {
    // Seul un owner peut inviter
    await ensureProjectAccess(projectId, requesterId, true);

    const user = await findUserBy({ param: "email", value: email });
    if (!user) {
      throw new ApolloError("USER NOT FOUND");
    }

    const alreadyMember = await getMembership(projectId, user.id);
    if (alreadyMember) {
      throw new ApolloError("USER ALREADY IN PROJECT");
    }

    const membership = await ProjectUser.create({
      projectId,
      userId: user.id,
      isOwner: isOwner ?? false,
    });

    return { success: true, message: "COLLABORATOR ADDED", membership };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return { message: error.message, success: false, membership: null };
    }
    throw error;
  }
};

export const updateCollaboratorRole = async (
  input: updateCollaboratorRoleInput,
  requesterId: string
) => {
  const { projectId, userId, isOwner } = input;
  try {
    // Seul un owner peut changer le rôle d'un membre
    await ensureProjectAccess(projectId, requesterId, true);

    const membership = await getMembership(projectId, userId);
    if (!membership) {
      throw new ApolloError("MEMBERSHIP NOT FOUND");
    }

    membership.isOwner = isOwner;
    await membership.save();

    return { success: true, message: "ROLE UPDATED", membership };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return { message: error.message, success: false, membership: null };
    }
    throw error;
  }
};

export const removeCollaborator = async (
  input: removeCollaboratorInput,
  requesterId: string
) => {
  const { projectId, userId } = input;
  try {
    // Seul un owner peut retirer un collaborateur
    await ensureProjectAccess(projectId, requesterId, true);

    if (userId === requesterId) {
      throw new ApolloError("OWNER CANNOT REMOVE THEMSELVES");
    }

    const membership = await getMembership(projectId, userId);
    if (!membership) {
      throw new ApolloError("MEMBERSHIP NOT FOUND");
    }

    await membership.destroy();
    return { success: true, message: "COLLABORATOR REMOVED" };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return { message: error.message, success: false };
    }
    throw error;
  }
};

export const getProjectMembers = async (
  projectId: string,
  requesterId: string
) => {
  // Tout membre peut voir la liste des membres
  await ensureProjectAccess(projectId, requesterId, false);
  const listOfUsersIds = await ProjectUser.findAll({
    where: { projectId },
    attributes: ['userId'],
  });
  return await User.findAll({
    where: {
      id: listOfUsersIds.map((membership) => membership.userId),
    },
  });
};