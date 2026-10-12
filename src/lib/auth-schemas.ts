import { z } from "zod";
import { normalizePhone } from "@/server/auth/phone";

const PASSWORD_MESSAGE = "Use 8 to 72 characters.";
const PHONE_MESSAGE = "Enter a phone number with 7 to 16 digits.";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email."));
// bcrypt reads only the first 72 bytes, so the limit is in bytes, not characters.
const newPassword = z
  .string()
  .min(8, PASSWORD_MESSAGE)
  .max(72, PASSWORD_MESSAGE)
  .refine((v) => new TextEncoder().encode(v).length <= 72, PASSWORD_MESSAGE);
const currentPassword = z.string().min(1, "Enter your password.");
export const nameField = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(80, "Keep it under 80 characters.");
export const phoneField = z
  .string()
  .transform(normalizePhone)
  .refine((v) => {
    const digits = v.replace("+", "").length;
    return digits >= 7 && digits <= 16;
  }, PHONE_MESSAGE);

export const registerSchema = z.object({
  email,
  password: newPassword,
  name: nameField,
  phone: phoneField,
});
export const loginSchema = z.object({ email, password: currentPassword });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "This link is invalid or expired."),
  password: newPassword,
});
export const contactsSchema = z.object({ name: nameField, phone: phoneField });
export const changeEmailSchema = z.object({ email, currentPassword });
export const changePasswordSchema = z.object({ currentPassword, newPassword });
