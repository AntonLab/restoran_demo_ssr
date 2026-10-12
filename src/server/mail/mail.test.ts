import { afterEach, expect, test, vi } from "vitest";
import { sendMail } from "@/server/mail";
import { passwordResetMail } from "@/server/mail/password-reset";

afterEach(() => vi.restoreAllMocks());

test("passwordResetMail carries the link and the lifetime", () => {
  const mail = passwordResetMail({ to: "a@b.c", link: "http://x/reset-password?token=t" });
  expect(mail.to).toBe("a@b.c");
  expect(mail.subject).toBe("Reset your password");
  expect(mail.text).toContain("http://x/reset-password?token=t");
  expect(mail.text).toContain("1 hour");
});
test("sendMail prints the header line and the text", async () => {
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  await sendMail({ to: "a@b.c", subject: "Hi", text: "body" });
  expect(info.mock.calls).toEqual([["Mail to a@b.c: Hi"], ["body"]]);
});
