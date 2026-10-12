import { expect, test } from "vitest";
import { checkAccess } from "@/server/auth/guards";
import type { SessionInfo } from "@/server/auth/session-store";

const session = (role: "user" | "admin"): SessionInfo => ({
  sessionId: "s",
  user: { id: "u", email: "a@b.c", name: "A", phone: null, role },
});

test("Guest goes to /login with an encoded next", () => {
  expect(checkAccess(null, "user", "/account/favorites?x=1")).toEqual({
    ok: false,
    redirectTo: "/login?next=%2Faccount%2Ffavorites%3Fx%3D1",
  });
  expect(checkAccess(null, "admin", "/admin")).toEqual({
    ok: false,
    redirectTo: "/login?next=%2Fadmin",
  });
});
test("User passes the user area and is sent from admin to /", () => {
  expect(checkAccess(session("user"), "user", "/account").ok).toBe(true);
  expect(checkAccess(session("user"), "admin", "/admin")).toEqual({ ok: false, redirectTo: "/" });
});
test("Admin passes the admin area and is sent from the user area to /admin", () => {
  expect(checkAccess(session("admin"), "admin", "/admin").ok).toBe(true);
  expect(checkAccess(session("admin"), "user", "/account")).toEqual({
    ok: false,
    redirectTo: "/admin",
  });
});
