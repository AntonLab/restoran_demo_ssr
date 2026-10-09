import { z } from "zod";
import { changeEmailSchema, changePasswordSchema, contactsSchema } from "@/lib/auth-schemas";
import { fieldFailure, guard, zodFailure, type AccountFailure } from "@/server/accounts";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { revokeAllSessions } from "@/server/auth/session-store";
import { connectDb } from "@/server/db";
import { User } from "@/server/models/user";
import { createRateLimiter, type Limiter } from "@/server/rate-limit";

// One budget for both actions: otherwise an attacker alternates them to double the guesses.
export const passwordAttemptLimiter = createRateLimiter({ limit: 10, windowMs: 900_000 });

type Result = { ok: true } | AccountFailure;

const NOT_FOUND: AccountFailure = { ok: false, error: "Account not found." };

// Validates, spends a limiter hit, then checks the current password.
async function checkedUser<T extends z.ZodType<{ currentPassword: string }>>(
  schema: T,
  userId: string,
  input: unknown,
  limiter: Limiter,
): Promise<{ data: z.output<T> } | { failure: AccountFailure }> {
  const checked = guard(schema, input, limiter, () => userId);
  if ("failure" in checked) return checked;
  await connectDb();
  const user = await User.findById(userId).lean();
  if (!user) return { failure: NOT_FOUND };
  if (!(await verifyPassword(checked.data.currentPassword, user.passwordHash))) {
    return { failure: fieldFailure({ currentPassword: ["Current password is wrong"] }) };
  }
  return checked;
}

export async function updateContacts(userId: string, input: unknown): Promise<Result> {
  const parsed = contactsSchema.safeParse(input);
  if (!parsed.success) {
    return zodFailure(parsed.error);
  }
  await connectDb();
  // Query updates skip the model's role-dependent phone validator; the schema already guarded it.
  const res = await User.updateOne({ _id: userId }, parsed.data);
  return res.matchedCount ? { ok: true } : NOT_FOUND;
}

export async function changeEmail(
  userId: string,
  input: unknown,
  limiter: Limiter = passwordAttemptLimiter,
): Promise<Result> {
  const checked = await checkedUser(changeEmailSchema, userId, input, limiter);
  if ("failure" in checked) return checked.failure;
  try {
    await User.updateOne({ _id: userId }, { email: checked.data.email });
    return { ok: true };
  } catch (error) {
    // The unique index decides, including the same-instant race.
    if ((error as { code?: number }).code === 11000) {
      return fieldFailure({ email: ["Email already registered"] });
    }
    throw error;
  }
}

export async function changePassword(
  userId: string,
  sessionId: string,
  input: unknown,
  limiter: Limiter = passwordAttemptLimiter,
): Promise<Result> {
  const checked = await checkedUser(changePasswordSchema, userId, input, limiter);
  if ("failure" in checked) return checked.failure;
  const passwordHash = await hashPassword(checked.data.newPassword);
  await User.updateOne({ _id: userId }, { passwordHash });
  await revokeAllSessions(userId, { except: sessionId });
  return { ok: true };
}
