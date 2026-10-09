import { z } from "zod";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/auth-schemas";
import type { AccountFailure } from "@/server/accounts";
import { hashPassword } from "@/server/auth/password";
import { revokeAllSessions } from "@/server/auth/session-store";
import { hashToken, newToken } from "@/server/auth/tokens";
import { connectDb } from "@/server/db";
import type { FieldErrors } from "@/server/feedback";
import { passwordResetMail } from "@/server/mail/password-reset";
import type { MailMessage } from "@/server/mail/types";
import { PasswordResetToken } from "@/server/models/password-reset-token";
import { User } from "@/server/models/user";
import { createRateLimiter, formatRetry, type Limiter } from "@/server/rate-limit";

export const resetRequestLimiter = createRateLimiter({ limit: 5, windowMs: 3_600_000 });

const RESET_TTL_MS = 3_600_000;
const INVALID_LINK: AccountFailure = { ok: false, error: "This link is invalid or expired." };

const fieldFailure = (error: z.ZodError): AccountFailure => ({
  ok: false,
  error: "Please fix the highlighted fields.",
  fieldErrors: z.flattenError(error).fieldErrors as FieldErrors,
});

export async function requestPasswordReset(
  input: unknown,
  ctx: { ip: string; baseUrl: string; limiter?: Limiter },
): Promise<{ ok: true; mail: MailMessage | null } | AccountFailure> {
  // Validate before limiter.hit: invalid input must not spend a hit.
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return fieldFailure(parsed.error);
  const hit = (ctx.limiter ?? resetRequestLimiter).hit(ctx.ip);
  if (!hit.ok) {
    return {
      ok: false,
      error: `Too many attempts. Try again in ${formatRetry(hit.retryAfterMs)}.`,
    };
  }
  await connectDb();
  const user = await User.findOne({ email: parsed.data.email }).lean();
  // Unknown email answers like a known one so the form does not reveal accounts.
  if (!user) return { ok: true, mail: null };
  await PasswordResetToken.deleteMany({ userId: user._id });
  const token = newToken();
  await PasswordResetToken.create({
    tokenHash: hashToken(token),
    userId: user._id,
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  });
  return {
    ok: true,
    mail: passwordResetMail({
      to: user.email,
      link: `${ctx.baseUrl}/reset-password?token=${token}`,
    }),
  };
}

export async function isResetTokenValid(token: unknown): Promise<boolean> {
  if (typeof token !== "string" || !token) return false;
  await connectDb();
  const found = await PasswordResetToken.exists({
    tokenHash: hashToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  return found !== null;
}

export async function resetPassword(input: unknown): Promise<{ ok: true } | AccountFailure> {
  // Validate first: a weak password must not consume the link.
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fieldFailure(parsed.error);
  const { token, password } = parsed.data;
  await connectDb();
  const now = new Date();
  // The atomic claim decides the race between two simultaneous uses.
  const claim = await PasswordResetToken.findOneAndUpdate(
    { tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: now } },
    { usedAt: now },
  );
  if (!claim) return INVALID_LINK;
  await User.updateOne({ _id: claim.userId }, { passwordHash: await hashPassword(password) });
  await revokeAllSessions(String(claim.userId));
  return { ok: true };
}
