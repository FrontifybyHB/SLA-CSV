import Joi from "joi";

import { MIN_PASSWORD_LENGTH } from "../contracts/auth.js";

const email = Joi.string().email().trim().lowercase().required();

const password = Joi.string()
  .min(MIN_PASSWORD_LENGTH)
  .max(128)
  .pattern(/[a-z]/)
  .pattern(/[A-Z]/)
  .pattern(/[0-9]/)
  .pattern(/[^a-zA-Z0-9]/)
  .required()
  .messages({
    "string.min": `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    "string.pattern.base":
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
  });

export const registerSchema = Joi.object({
  email,
  password,
});

export const loginSchema = Joi.object({
  email,
  // Bound the password so a ~100KB body can't be turned into a bcrypt CPU
  // burn per attempt (bcrypt truncates past 72 bytes anyway).
  password: Joi.string().max(128).required(),
});