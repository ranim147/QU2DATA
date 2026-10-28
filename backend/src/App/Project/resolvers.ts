import {
  createProject,
  deleteProject,
  getProjectMembers,
  getProjects,
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  updateProject,
} from "./service";
import {
  GetProjectsOptions,
  createProjectInput,
  inviteCollaboratorInput,
  removeCollaboratorInput,
  updateCollaboratorRoleInput,
  updateProjectInput,
} from "./types";
import {
  createProjectInputSchema,
  inviteCollaboratorInputSchema,
  removeCollaboratorInputSchema,
  updateCollaboratorRoleInputSchema,
  updateProjectInputSchema,
} from "./validators";
import { parseDataValidation } from "../../Helpers/GeneralHelpers";
import { ContextWithUser } from "../../Directives/auth";

const resolvers = {
  Mutation: {
    createProject: async (
      _: any,
      args: createProjectInput,
      context: ContextWithUser
    ) => {
      const result = parseDataValidation(args, createProjectInputSchema);
      if (result !== true) {
        return { ...result, project: null };
      }
      return await createProject(args, context.user.id);
    },
    updateProject: async (
      _: any,
      args: updateProjectInput,
      context: ContextWithUser
    ) => {
      const result = parseDataValidation(args, updateProjectInputSchema);
      if (result !== true) {
        return { ...result, project: null };
      }
      return await updateProject(args, context.user.id);
    },
    deleteProject: async (
      _: any,
      { projectId }: { projectId: string },
      context: ContextWithUser
    ) => {
      return await deleteProject(projectId, context.user.id);
    },
    inviteCollaborator: async (
      _: any,
      args: inviteCollaboratorInput,
      context: ContextWithUser
    ) => {
      const result = parseDataValidation(args, inviteCollaboratorInputSchema);
      if (result !== true) {
        return { ...result, membership: null };
      }
      return await inviteCollaborator(args, context.user.id);
    },
    updateCollaboratorRole: async (
      _: any,
      args: updateCollaboratorRoleInput,
      context: ContextWithUser
    ) => {
      const result = parseDataValidation(
        args,
        updateCollaboratorRoleInputSchema
      );
      if (result !== true) {
        return { ...result, membership: null };
      }
      return await updateCollaboratorRole(args, context.user.id);
    },
    removeCollaborator: async (
      _: any,
      args: removeCollaboratorInput,
      context: ContextWithUser
    ) => {
      const result = parseDataValidation(args, removeCollaboratorInputSchema);
      if (result !== true) {
        return result;
      }
      return await removeCollaborator(args, context.user.id);
    },
  },
  Query: {
    getProjects: async (
      _: any,
      args: GetProjectsOptions,
      context: ContextWithUser
    ) => {
      return await getProjects(context.user.id, args);
    },
    getProjectMembers: async (
      _: any,
      { projectId }: { projectId: string },
      context: ContextWithUser
    ) => {
      return await getProjectMembers(projectId, context.user.id);
    },
  },
};

export default resolvers;