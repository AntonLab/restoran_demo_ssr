import { revalidatePath } from "next/cache";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { contactsAction, emailAction, passwordAction } from "@/app/account/actions";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { getSession } from "@/server/auth/session";
import { createSessionRecord } from "@/server/auth/session-store";
import { Session } from "@/server/models/session";
import { User } from "@/server/models/user";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

// The real actionUser runs; only the session lookup is replaced, so the role check is covered.
vi.mock("@/server/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  vi.clearAllMocks();
  await clearTestDb();
});

const IDLE = { status: "idle" } as const;
const fd = (obj: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.set(k, v);
  return f;
};
const as = (role: "user" | "admin" | null, id = "507f1f77bcf86cd799439011", sessionId = "s") =>
  vi
    .mocked(getSession)
    .mockResolvedValue(role ? ({ sessionId, user: { id, role } } as never) : null);

async function mkUser() {
  return User.create({
    email: "ann@example.com",
    passwordHash: await hashPassword("password1"),
    name: "Ann",
    phone: "+15551234567",
  });
}

const forms = {
  contacts: () => contactsAction(IDLE, fd({ name: "Bob", phone: "+1 555 765 4321" })),
  email: () => emailAction(IDLE, fd({ email: "new@example.com", currentPassword: "password1" })),
  password: () =>
    passwordAction(IDLE, fd({ currentPassword: "password1", newPassword: "brand-new-pw" })),
};

describe.each(Object.entries(forms))("%s action", (_name, run) => {
  test.each([null, "admin"] as const)("refuses %s and changes nothing", async (role) => {
    const user = await mkUser();
    as(role, String(user._id));
    expect(await run()).toEqual({ status: "error", error: "Sign in as a user to do this." });
    expect(await User.findById(user._id).lean()).toMatchObject({
      name: "Ann",
      email: "ann@example.com",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("for a user", () => {
  test("contactsAction saves the details and revalidates /account", async () => {
    const user = await mkUser();
    as("user", String(user._id));
    expect(await forms.contacts()).toEqual({ status: "success", message: "Details saved." });
    expect((await User.findById(user._id).lean())!.name).toBe("Bob");
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });
  test("emailAction changes the email after the password check", async () => {
    const user = await mkUser();
    as("user", String(user._id));
    expect(await forms.email()).toEqual({ status: "success", message: "Email changed." });
    expect((await User.findById(user._id).lean())!.email).toBe("new@example.com");
  });
  test("emailAction with a wrong password is a field error", async () => {
    const user = await mkUser();
    as("user", String(user._id));
    const state = await emailAction(
      IDLE,
      fd({ email: "new@example.com", currentPassword: "wrong-wrong" }),
    );
    expect(state).toMatchObject({
      status: "error",
      fieldErrors: { currentPassword: ["Current password is wrong"] },
    });
  });
  test("passwordAction sets the password and keeps only the current Session", async () => {
    const user = await mkUser();
    const keep = await createSessionRecord(String(user._id));
    await createSessionRecord(String(user._id));
    const keepId = String((await Session.find().lean())[0]._id);
    void keep;
    as("user", String(user._id), keepId);
    expect(await forms.password()).toEqual({ status: "success", message: "Password changed." });
    expect(
      await verifyPassword("brand-new-pw", (await User.findById(user._id).lean())!.passwordHash),
    ).toBe(true);
    const left = await Session.find().lean();
    expect(left.map((s) => String(s._id))).toEqual([keepId]);
  });
});
