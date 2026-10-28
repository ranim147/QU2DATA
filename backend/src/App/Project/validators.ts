import { z } from "zod";

const uuid = z.string().uuid();

export const createProjectInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  domain: z.string().optional(),
  objective: z.string().optional(),
});

export const updateProjectInputSchema = z.object({
  projectId: uuid,
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  domain: z.string().optional(),
  objective: z.string().optional(),
});

export const inviteCollaboratorInputSchema = z.object({
  projectId: uuid,
  email: z.string().email(),
  isOwner: z.boolean().optional(),
});

export const updateCollaboratorRoleInputSchema = z.object({
  projectId: uuid,
  userId: uuid,
  isOwner: z.boolean(),
});

export const removeCollaboratorInputSchema = z.object({
  projectId: uuid,
  userId: uuid,
});