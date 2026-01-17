import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  display_name: z.string().max(100).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const UpdateProfileInputSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .optional(),
  display_name: z.string().max(100).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});

export const CreateProfileInputSchema = z.object({
  id: z.string().uuid(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  display_name: z.string().max(100).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;
export type CreateProfileInput = z.infer<typeof CreateProfileInputSchema>;
