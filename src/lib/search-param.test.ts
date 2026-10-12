import { describe, expect, it } from "vitest";
import { singleParam } from "@/lib/search-param";

describe("singleParam", () => {
  it("keeps a single value", () => {
    expect(singleParam("abc")).toBe("abc");
  });

  it("drops a repeated or missing value", () => {
    expect(singleParam(["a", "b"])).toBeUndefined();
    expect(singleParam(undefined)).toBeUndefined();
  });
});
