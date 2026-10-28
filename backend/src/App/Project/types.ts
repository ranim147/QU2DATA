import { ProjectInstance } from "./model/project.model";

export interface createProjectInput {
  name: string;
  description?: string;
  domain?: string;
  objective?: string;
}

export interface updateProjectInput {
  projectId: string;
  name?: string;
  description?: string;
  domain?: string;
  objective?: string;
}

export interface SearchProjectInput {
  param: string;
  value: string | number;
}

export interface inviteCollaboratorInput {
  projectId: string;
  email: string;
  isOwner?: boolean;
}

export interface updateCollaboratorRoleInput {
  projectId: string;
  userId: string;
  isOwner: boolean;
}

export interface removeCollaboratorInput {
  projectId: string;
  userId: string;
}

export interface GetProjectsOptions {
  page?: number;
  limit?: number;
  filter?: {
    name?: string;
    domain?: string;
  };
}

export interface GetProjectsResponse {
  rows: ProjectInstance[];
  count: number;
}
