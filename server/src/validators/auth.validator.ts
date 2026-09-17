import Joi from "joi";

import { MIN_PASSWORD_LENGTH } from "../contracts/auth.js";

const email = Joi.string().email().trim().lowercase().required();

export const registerSchema = Joi.object({
  email,
  password: Joi.string()
    .min(MIN_PASSWORD_LENGTH)
    .max(128)
    .required()
    .messages({
      "string.min": `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    }),
});

export const loginSchema = Joi.object({
  email,
  password: Joi.string().required(),
});