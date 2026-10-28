import { gql } from "apollo-server-express";

const schema = gql`
  type Project {
    id: ID!
    name: String
    description: String
    userId: ID
    domain: String
    objective: String
    createdAt: String
    updatedAt: String
  }


type ProjectMember {
  id: ID!
  projectId: ID!
  userId: ID!
  isOwner: Boolean!
  User: User
}

  input ProjectFilterInput {
    name: String
    domain: String
  }

  type Mutation {
    createProject(
      name: String!
      description: String
      domain: String
      objective: String
    ): CreateProjectResponse! @hasPermission(flag: "projects", access: "can_create")


    updateProject(
      projectId: ID!
      name: String
      description: String
      domain: String
      objective: String
    ): UpdateProjectResponse! @hasPermission(flag: "projects", access: "can_update")

    deleteProject(projectId: ID!): BasicResponse!
      @hasPermission(flag: "projects", access: "can_delete")

   inviteCollaborator(
  projectId: ID!
  email: String!
  isOwner: Boolean
): InviteCollaboratorResponse! @hasPermission(flag: "projects", access: "can_update")

updateCollaboratorRole(
  projectId: ID!
  userId: ID!
  isOwner: Boolean!
): InviteCollaboratorResponse! @hasPermission(flag: "projects", access: "can_update")

    removeCollaborator(projectId: ID!, userId: ID!): BasicResponse! @hasPermission(flag: "projects", access: "can_update")
  }

  type Query {
    getProjects(
      page: Int = 1
      limit: Int = 10
      filter: ProjectFilterInput
    ): GetProjectsResponse! @hasPermission(flag: "projects", access: "can_show")

    getProjectMembers(projectId: ID!): [ProjectMember!]! @hasPermission(flag: "projects", access: "can_update")
  }

  type CreateProjectResponse {
    message: String
    project: Project
    success: Boolean
  }
  type UpdateProjectResponse {
    message: String
    project: Project
    success: Boolean
  }
  type GetProjectsResponse {
    rows: [Project]
    count: Int
  }
  type InviteCollaboratorResponse {
    message: String
    membership: ProjectMember
    success: Boolean
  }
`;

export default schema;