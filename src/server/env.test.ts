import { describe, expect, test } from "vitest";
import { parseEnv } from "@/server/env";

describe("parseEnv", () => {
  test("applies defaults", () => {
    const env = parseEnv({});
    expect(env.MONGODB_URI).toBe("mongodb://127.0.0.1:27017/restoran_demo");
    expect(env.APP_BASE_URL).toBe("http://localhost:3000");
    expect(env.MAIL_DELIVERY).toBe("log");
    expect(env.UPLOADS_DIR).toBeUndefined();
  });
  test("treats empty strings as unset", () => {
    const env = parseEnv({ MONGODB_URI: "", ADMIN_EMAIL: "" });
    expect(env.MONGODB_URI).toBe("mongodb://127.0.0.1:27017/restoran_demo");
    expect(env.ADMIN_EMAIL).toBeUndefined();
  });
  test("rejects an unknown MAIL_DELIVERY", () => {
    expect(() => parseEnv({ MAIL_DELIVERY: "pigeon" })).toThrow();
  });
  test("rejects MAIL_DELIVERY=smtp (not supported in this version)", () => {
    expect(() => parseEnv({ MAIL_DELIVERY: "smtp" })).toThrow();
  });
  test("rejects a malformed ADMIN_EMAIL", () => {
    expect(() => parseEnv({ ADMIN_EMAIL: "nope" })).toThrow();
  });
});
