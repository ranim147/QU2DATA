import { z } from "zod";

const uuid = z.string().uuid();

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export const createUserByAdminInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  roleId: uuid,
});
export const updateUserByAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  roleId: uuid,
  userId: uuid,
});
