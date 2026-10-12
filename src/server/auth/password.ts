import bcrypt from "bcrypt";
import { newToken } from "@/server/auth/tokens";

// Unknown users compare against this so response time does not reveal whether an email exists.
let dummyHash: Promise<string> | undefined;

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export async function verifyPassword(password: string, hash: string | null) {
  if (hash) return bcrypt.compare(password, hash);
  dummyHash ??= bcrypt.hash(newToken(), 10);
  await bcrypt.compare(password, await dummyHash);
  return false;
}
