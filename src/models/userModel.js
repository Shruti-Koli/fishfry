import { z } from "zod";

export const registerSchema = z.object({
  name: z.string("Name is required").trim().min(1, "Name is required").max(100),
  email: z
    .string("Email is required")
    .trim()
    .min(1, "Email is required")
    .email("Email is not valid"),
  password: z
    .string("Password is required")
    .trim()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(50),
  role: z
    .enum(["user", "admin"], "Role must be one of user, admin")
    .default("user"),
});

export const loginSchema = z.object({
  email: z
    .string("Email is required")
    .trim()
    .min(1, "Email is required")
    .email("Email is not valid"),
  password: z
    .string("Password is required")
    .trim()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(100)
});