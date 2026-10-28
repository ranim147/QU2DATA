import { gql } from "@apollo/client";
import { Project } from "../../types/project.types";

export interface CreateProjectVariables {
  name: string;
  description?: string;
  domain?: string;
  objective?: string;
}

interface CreateProjectResponse {
  success: boolean;
  message: string;
  project: Project;
}

export interface CreateProjectType {
  createProject: CreateProjectResponse;
}

export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject(
    $name: String!
    $description: String
    $domain: String
    $objective: String
  ) {
    createProject(
      name: $name
      description: $description
      domain: $domain
      objective: $objective
    ) {
      success
      message
      project {
        id
        name
        description
        domain
        objective
        createdAt
      }
    }
  }
`;

export interface InviteCollaboratorVariables {
  projectId: string;
  email: string;
  isOwner?: boolean;
}

interface InviteCollaboratorResponse {
  success: boolean;
  message: string;
}

export interface InviteCollaboratorType {
  inviteCollaborator: InviteCollaboratorResponse;
}

export const INVITE_COLLABORATOR_MUTATION = gql`
  mutation InviteCollaborator($projectId: ID!, $email: String!, $isOwner: Boolean) {
    inviteCollaborator(projectId: $projectId, email: $email, isOwner: $isOwner) {
      success
      message
    }
  }
`;