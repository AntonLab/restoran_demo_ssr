import { hashPassword } from "@/server/auth/password";
import { User } from "@/server/models/user";

export const mkUser = async (overrides: Record<string, unknown> = {}) =>
  User.create({
    email: "ann@example.com",
    passwordHash: await hashPassword("password1"),
    name: "Ann",
    phone: "+15551234567",
    ...overrides,
  });

type Outcome = { status: string; error?: string };

// The limiter is per process and keyed by one "local" IP, so earlier tests may have spent hits: call until refused.
export async function untilRefused<T extends Outcome>(call: () => Promise<T>, max: number) {
  let last = { status: "idle" } as Outcome;
  for (let i = 0; i < max + 1; i++) {
    last = await call().catch(() => ({ status: "redirected" }));
    if (last.status === "error" && last.error?.includes("Too many")) break;
  }
  return last;
}
