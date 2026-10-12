import mongoose from "mongoose";
import { hashToken, newToken } from "@/server/auth/tokens";
import { connectDb } from "@/server/db";
import { Session } from "@/server/models/session";
import { User } from "@/server/models/user";

export const SESSION_COOKIE = "sid";
export const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "user" | "admin";
};
export type SessionInfo = { sessionId: string; user: SessionUser };

export async function createSessionRecord(
  userId: string,
  now = Date.now(),
): Promise<{ token: string; expiresAt: Date }> {
  await connectDb();
  const token = newToken();
  const expiresAt = new Date(now + SESSION_TTL_MS);
  await Session.create({ tokenHash: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function findSession(
  token: string | undefined,
  now = Date.now(),
): Promise<SessionInfo | null> {
  if (!token) return null;
  await connectDb();
  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date(now) },
  }).lean();
  if (!session) return null;
  const user = await User.findById(session.userId).lean();
  if (!user) return null;
  return {
    sessionId: String(session._id),
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      phone: user.phone ?? null,
      role: user.role ?? "user",
    },
  };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await connectDb();
  await Session.deleteOne({ tokenHash: hashToken(token) });
}

export async function revokeAllSessions(userId: string, opts?: { except?: string }): Promise<void> {
  if (!mongoose.isValidObjectId(userId)) return;
  await connectDb();
  await Session.deleteMany({
    userId,
    ...(opts?.except ? { _id: { $ne: opts.except } } : {}),
  });
}

export const sessionCookieOptions = (secure: boolean, expiresAt: Date) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  path: "/",
  expires: expiresAt,
});
