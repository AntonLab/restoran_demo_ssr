import { describe, expect, it } from "vitest";
import { canView } from "@/server/view-token";

describe("canView", () => {
  const doc = { userId: { toString: () => "u1" }, viewToken: "secret" };

  it("lets a User see their own document", () => {
    expect(canView(doc, "u1", undefined)).toBe(true);
  });

  it("refuses another User even with the right token", () => {
    expect(canView(doc, "u2", "secret")).toBe(false);
  });

  it("lets a Guest in with the matching token", () => {
    expect(canView({ userId: null, viewToken: "secret" }, null, "secret")).toBe(true);
  });

  it("refuses a Guest with a wrong or missing token", () => {
    expect(canView(doc, null, "wrong")).toBe(false);
    expect(canView(doc, null, undefined)).toBe(false);
  });

  it("refuses a Guest when the document has no token", () => {
    expect(canView({ userId: null }, null, "secret")).toBe(false);
  });
});
