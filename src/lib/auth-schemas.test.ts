import { expect, test } from "vitest";
import type { ZodType } from "zod";
import {
  changeEmailSchema,
  changePasswordSchema,
  contactsSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/auth-schemas";

const good = {
  email: "  A@B.com ",
  password: "12345678",
  name: " Ann ",
  phone: "+1 (555) 123-4567",
};
const errorsOf = (schema: ZodType, input: unknown) =>
  Object.fromEntries(
    (schema.safeParse(input).error?.issues ?? []).map((i) => [String(i.path[0]), i.message]),
  );

test("registerSchema normalizes email, name and phone", () => {
  expect(registerSchema.parse(good)).toEqual({
    email: "a@b.com",
    password: "12345678",
    name: "Ann",
    phone: "+15551234567",
  });
});
test.each([
  [{ email: "nope" }, "email", "Enter a valid email."],
  [{ password: "1234567" }, "password", "Use 8 to 72 characters."],
  [{ password: "x".repeat(73) }, "password", "Use 8 to 72 characters."],
  [{ password: "😀".repeat(37) }, "password", "Use 8 to 72 characters."],
  [{ name: "   " }, "name", "Enter your name."],
  [{ name: "n".repeat(81) }, "name", "Keep it under 80 characters."],
  [{ phone: "123456" }, "phone", "Enter a phone number with 7 to 16 digits."],
  [{ phone: "1".repeat(17) }, "phone", "Enter a phone number with 7 to 16 digits."],
  [{ phone: "abc" }, "phone", "Enter a phone number with 7 to 16 digits."],
])("registerSchema rejects %j", (patch, field, message) => {
  expect(errorsOf(registerSchema, { ...good, ...patch })[field]).toBe(message);
});
test("a 72-character ASCII password is accepted", () => {
  expect(registerSchema.safeParse({ ...good, password: "x".repeat(72) }).success).toBe(true);
});
test("loginSchema only needs a non-empty password", () => {
  expect(loginSchema.parse({ email: "A@b.com", password: "x" })).toEqual({
    email: "a@b.com",
    password: "x",
  });
  expect(errorsOf(loginSchema, { email: "a@b.com", password: "" }).password).toBe(
    "Enter your password.",
  );
});
test("other schemas reuse the same rules", () => {
  expect(contactsSchema.parse({ name: "Bo", phone: "555 1234" })).toEqual({
    name: "Bo",
    phone: "5551234",
  });
  expect(errorsOf(changeEmailSchema, { email: "x", currentPassword: "" })).toMatchObject({
    email: "Enter a valid email.",
    currentPassword: "Enter your password.",
  });
  expect(
    errorsOf(changePasswordSchema, { currentPassword: "a", newPassword: "short" }).newPassword,
  ).toBe("Use 8 to 72 characters.");
  expect(errorsOf(resetPasswordSchema, { token: "", password: "12345678" }).token).toBeDefined();
});
