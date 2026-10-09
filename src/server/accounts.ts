import { z } from "zod";
import { loginSchema, registerSchema } from "@/lib/auth-schemas";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { connectDb } from "@/server/db";
import type { FieldErrors } from "@/server/feedback";
import { User } from "@/server/models/user";
import { createRateLimiter, formatRetry, type Limiter } from "@/server/rate-limit";

export type AccountFailure = { ok: false; error: string; fieldErrors?: FieldErrors };

export const registerLimiter = createRateLimiter({ limit: 5, windowMs: 3_600_000 });
export const loginLimiter = createRateLimiter({ limit: 10, windowMs: 900_000 });

const INVALID_CREDENTIALS = "Invalid email or password";

export const fieldFailure = (fieldErrors: FieldErrors): AccountFailure => ({
  ok: false,
  error: "Please fix the highlighted fields.",
  fieldErrors,
});

// Validate before limiter.hit: invalid input must not spend a hit.
export function guard<T extends z.ZodType>(
  schema: T,
  input: unknown,
  limiter: Limiter,
  key: (data: z.output<T>) => string,
): { data: z.output<T> } | { failure: AccountFailure } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { failure: fieldFailure(z.flattenError(parsed.error).fieldErrors as FieldErrors) };
  }
  const hit = limiter.hit(key(parsed.data));
  if (!hit.ok) {
    return {
      failure: {
        ok: false,
        error: `Too many attempts. Try again in ${formatRetry(hit.retryAfterMs)}.`,
      },
    };
  }
  return { data: parsed.data };
}

export async function registerUser(
  input: unknown,
  ip: string,
  limiter: Limiter = registerLimiter,
): Promise<{ ok: true; userId: string } | AccountFailure> {
  const checked = guard(registerSchema, input, limiter, () => ip);
  if ("failure" in checked) return checked.failure;
  const { password, ...profile } = checked.data;
  const passwordHash = await hashPassword(password);
  await connectDb();
  try {
    const user = await User.create({ ...profile, passwordHash, role: "user" });
    return { ok: true, userId: String(user._id) };
  } catch (error) {
    // The unique index on User.email also decides the same-instant race.
    if ((error as { code?: number }).code === 11000) {
      return fieldFailure({ email: ["Email already registered"] });
    }
    throw error;
  }
}

export async function authenticate(
  input: unknown,
  ip: string,
  limiter: Limiter = loginLimiter,
): Promise<{ ok: true; userId: string; role: "user" | "admin" } | AccountFailure> {
  const checked = guard(loginSchema, input, limiter, (d) => `${ip}|${d.email}`);
  if ("failure" in checked) return checked.failure;
  const { email, password } = checked.data;
  await connectDb();
  const user = await User.findOne({ email }).lean();
  const valid = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !valid) return { ok: false, error: INVALID_CREDENTIALS };
  return { ok: true, userId: String(user._id), role: user.role };
}
