
import { ProjectUser } from "./model";

import { ApolloError } from "apollo-server-express";

// Checks whether a user belongs to a project
export const getMembership = async (projectId: string, userId: string) => {
  return ProjectUser.findOne({ where: { projectId, userId } });
};

// Tout membre peut accéder ; requireOwner=true restreint l'accès aux membres avec isOwner:true
export const ensureProjectAccess = async (
  projectId: string,
  userId: string,
  requireOwner = false
) => {

  const membership = await getMembership(projectId, userId);
  if (!membership || (requireOwner && !membership.isOwner)) {
    throw new ApolloError("PROJECT ACCESS DENIED");
  }
  return membership;
};