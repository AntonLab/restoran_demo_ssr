import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import {
  forgotPasswordAction,
  loginAction,
  logoutAction,
  registerAction,
  resetPasswordAction,
} from "@/app/(auth)/actions";
import { afterRegister, afterSignIn } from "@/server/auth/sign-in-hooks";
import { SESSION_COOKIE } from "@/server/auth/session-store";
import { hashToken } from "@/server/auth/tokens";
import { sendMail } from "@/server/mail";
import { PasswordResetToken } from "@/server/models/password-reset-token";
import { Session } from "@/server/models/session";
import { User } from "@/server/models/user";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";
import { mkUser, untilRefused } from "@/server/test/fixtures";
import { formOf } from "@/server/test/form";

const store = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
const afterCallbacks: Array<() => Promise<void>> = [];

vi.mock("next/headers", () => ({ cookies: async () => store, headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock("next/server", () => ({ after: (cb: () => Promise<void>) => afterCallbacks.push(cb) }));
vi.mock("@/server/auth/sign-in-hooks", () => ({ afterRegister: vi.fn(), afterSignIn: vi.fn() }));
vi.mock("@/server/mail", () => ({ sendMail: vi.fn() }));

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  vi.clearAllMocks();
  afterCallbacks.length = 0;
  await clearTestDb();
});

const IDLE = { status: "idle" } as const;
const redirectOf = (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e: Error) => e.message,
  );
const wrongRateForm = () => formOf({ email: "rate@example.com", password: "wrong-wrong" });
const reg = {
  email: "ann@example.com",
  password: "password1",
  name: "Ann",
  phone: "+1 555 123 4567",
};

describe("loginAction", () => {
  test("creates a Session, sets the cookie, runs afterSignIn and redirects", async () => {
    const user = await mkUser();
    const to = await redirectOf(
      loginAction(
        IDLE,
        formOf({ email: "ann@example.com", password: "password1", next: "/account" }),
      ),
    );
    expect(to).toBe("REDIRECT:/account");
    expect(await Session.countDocuments({ userId: user._id })).toBe(1);
    const [name, token, options] = store.set.mock.calls[0];
    expect(name).toBe(SESSION_COOKIE);
    expect(await Session.countDocuments({ tokenHash: hashToken(token) })).toBe(1);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax" });
    expect(afterSignIn).toHaveBeenCalledWith(String(user._id), "user");
  });
  test("an Admin lands in /admin", async () => {
    await mkUser({ role: "admin" });
    const to = await redirectOf(
      loginAction(IDLE, formOf({ email: "ann@example.com", password: "password1" })),
    );
    expect(to).toBe("REDIRECT:/admin");
  });
  test("wrong password returns an error and creates no Session", async () => {
    await mkUser();
    const state = await loginAction(
      IDLE,
      formOf({ email: "ann@example.com", password: "nope-nope" }),
    );
    expect(state).toMatchObject({ status: "error", error: "Invalid email or password" });
    expect(await Session.countDocuments()).toBe(0);
    expect(store.set).not.toHaveBeenCalled();
  });
  test("invalid input returns field errors", async () => {
    expect(await loginAction(IDLE, formOf({ email: "bad", password: "" }))).toMatchObject({
      status: "error",
      fieldErrors: { email: expect.any(Array), password: expect.any(Array) },
    });
  });
  test("is refused after 10 attempts for one email", async () => {
    for (let i = 0; i < 10; i++) {
      expect(await loginAction(IDLE, wrongRateForm())).toMatchObject({
        error: "Invalid email or password",
      });
    }
    expect(await loginAction(IDLE, wrongRateForm())).toMatchObject({
      status: "error",
      error: expect.stringContaining("Too many attempts"),
    });
  });
});

describe("logoutAction", () => {
  test("deletes the Session and the cookie, then redirects home", async () => {
    const user = await mkUser();
    await redirectOf(
      loginAction(IDLE, formOf({ email: "ann@example.com", password: "password1" })),
    );
    const token = store.set.mock.calls[0][1];
    store.get.mockReturnValue({ value: token });
    expect(await redirectOf(logoutAction())).toBe("REDIRECT:/");
    expect(await Session.countDocuments({ userId: user._id })).toBe(0);
    expect(store.delete).toHaveBeenCalledWith(SESSION_COOKIE);
  });
});

describe("forgotPasswordAction", () => {
  test("known email: creates a token and sends the mail after the response", async () => {
    await mkUser();
    expect(await forgotPasswordAction(IDLE, formOf({ email: "ann@example.com" }))).toEqual({
      status: "sent",
    });
    expect(await PasswordResetToken.countDocuments()).toBe(1);
    expect(sendMail).not.toHaveBeenCalled();
    await afterCallbacks[0]();
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "ann@example.com" }));
  });
  test("unknown email answers the same and sends nothing", async () => {
    expect(await forgotPasswordAction(IDLE, formOf({ email: "ghost@example.com" }))).toEqual({
      status: "sent",
    });
    expect(afterCallbacks).toHaveLength(0);
    expect(await PasswordResetToken.countDocuments()).toBe(0);
  });
  test("a failing mail is swallowed", async () => {
    await mkUser();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(sendMail).mockRejectedValueOnce(new Error("smtp down"));
    await forgotPasswordAction(IDLE, formOf({ email: "ann@example.com" }));
    await expect(afterCallbacks[0]()).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith("Password reset mail failed");
    log.mockRestore();
  });
  test("invalid email returns field errors", async () => {
    expect(await forgotPasswordAction(IDLE, formOf({ email: "bad" }))).toMatchObject({
      status: "error",
      fieldErrors: { email: expect.any(Array) },
    });
  });
});

describe("resetPasswordAction", () => {
  test("a valid token changes the password, clears the cookie and redirects to login", async () => {
    const user = await mkUser();
    await PasswordResetToken.create({
      tokenHash: hashToken("tok"),
      userId: user._id,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const to = await redirectOf(
      resetPasswordAction(IDLE, formOf({ token: "tok", password: "brand-new-pw" })),
    );
    expect(to).toBe("REDIRECT:/login?reset=1");
    expect(store.delete).toHaveBeenCalledWith(SESSION_COOKIE);
    expect((await User.findById(user._id).lean())!.passwordHash).not.toBe(user.passwordHash);
  });
  test("an unknown token returns the invalid-link error and keeps the cookie", async () => {
    expect(
      await resetPasswordAction(IDLE, formOf({ token: "nope", password: "brand-new-pw" })),
    ).toMatchObject({ status: "error", error: "This link is invalid or expired." });
    expect(store.delete).not.toHaveBeenCalled();
  });
  test("a weak password returns field errors", async () => {
    expect(
      await resetPasswordAction(IDLE, formOf({ token: "tok", password: "short" })),
    ).toMatchObject({
      status: "error",
      fieldErrors: { password: expect.any(Array) },
    });
  });
});

describe("registerAction", () => {
  test("creates the User and a Session, runs afterRegister and redirects", async () => {
    const to = await redirectOf(registerAction(IDLE, formOf({ ...reg, next: "/account" })));
    expect(to).toBe("REDIRECT:/account");
    const user = await User.findOne({ email: reg.email }).lean();
    expect(user?.role).toBe("user");
    expect(await Session.countDocuments({ userId: user!._id })).toBe(1);
    expect(store.set).toHaveBeenCalledWith(SESSION_COOKIE, expect.any(String), expect.any(Object));
    expect(afterRegister).toHaveBeenCalledWith(String(user!._id), "+15551234567");
  });
  test("a duplicate email is a field error and creates no Session", async () => {
    await mkUser();
    expect(await registerAction(IDLE, formOf(reg))).toMatchObject({
      status: "error",
      fieldErrors: { email: ["Email already registered"] },
    });
    expect(afterRegister).not.toHaveBeenCalled();
    expect(await Session.countDocuments()).toBe(0);
  });
  test("is refused once the hourly limit is spent", async () => {
    const last = await untilRefused(() => registerAction(IDLE, formOf(reg)), 5);
    expect(last).toMatchObject({ status: "error", error: expect.stringContaining("Too many") });
  });
});

test("forgotPasswordAction is refused once the hourly limit is spent", async () => {
  const last = await untilRefused(
    () => forgotPasswordAction(IDLE, formOf({ email: "ann@example.com" })),
    5,
  );
  expect(last).toMatchObject({ status: "error", error: expect.stringContaining("Too many") });
});
