import { revalidatePath } from "next/cache";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { contactsAction, emailAction, passwordAction } from "@/app/account/actions";
import { verifyPassword } from "@/server/auth/password";
import { createSessionRecord } from "@/server/auth/session-store";
import { Session } from "@/server/models/session";
import { User } from "@/server/models/user";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";
import { mkUser } from "@/server/test/fixtures";
import { formOf } from "@/server/test/form";
import { asSession } from "@/server/test/session";

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
const forms = {
  contacts: () => contactsAction(IDLE, formOf({ name: "Bob", phone: "+1 555 765 4321" })),
  email: () =>
    emailAction(IDLE, formOf({ email: "new@example.com", currentPassword: "password1" })),
  password: () =>
    passwordAction(IDLE, formOf({ currentPassword: "password1", newPassword: "brand-new-pw" })),
};

describe.each(Object.entries(forms))("%s action", (_name, run) => {
  test.each([null, "admin"] as const)("refuses %s and changes nothing", async (role) => {
    const user = await mkUser();
    asSession(role, String(user._id));
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
    asSession("user", String(user._id));
    expect(await forms.contacts()).toEqual({ status: "success", message: "Details saved." });
    expect((await User.findById(user._id).lean())!.name).toBe("Bob");
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });
  test("emailAction changes the email after the password check", async () => {
    const user = await mkUser();
    asSession("user", String(user._id));
    expect(await forms.email()).toEqual({ status: "success", message: "Email changed." });
    expect((await User.findById(user._id).lean())!.email).toBe("new@example.com");
  });
  test("emailAction with a wrong password is a field error", async () => {
    const user = await mkUser();
    asSession("user", String(user._id));
    const state = await emailAction(
      IDLE,
      formOf({ email: "new@example.com", currentPassword: "wrong-wrong" }),
    );
    expect(state).toMatchObject({
      status: "error",
      fieldErrors: { currentPassword: ["Current password is wrong"] },
    });
  });
  test("passwordAction sets the password and keeps only the current Session", async () => {
    const user = await mkUser();
    await createSessionRecord(String(user._id));
    await createSessionRecord(String(user._id));
    const keepId = String((await Session.find().sort({ _id: 1 }).lean())[0]._id);
    asSession("user", String(user._id), keepId);
    expect(await forms.password()).toEqual({ status: "success", message: "Password changed." });
    expect(
      await verifyPassword("brand-new-pw", (await User.findById(user._id).lean())!.passwordHash),
    ).toBe(true);
    const left = await Session.find().lean();
    expect(left.map((s) => String(s._id))).toEqual([keepId]);
  });
});
