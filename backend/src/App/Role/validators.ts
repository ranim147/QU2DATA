import { z } from "zod";

export const createRoleInputSchema = z.object({
  roleName: z.string().refine((value) => /^[a-zA-Z]+$/.test(value), {
    message: "roleName must be an alphabetic string",
  }),
});
