import { describe, expect, test } from "vitest";
import { createMutex } from "@/server/mutex";

describe("createMutex", () => {
  test("runs tasks one at a time in call order", async () => {
    const mutex = createMutex();
    const log: string[] = [];
    const gate = Promise.withResolvers<void>();
    const slow = mutex.run(async () => {
      log.push("a start");
      await gate.promise;
      log.push("a end");
    });
    const fast = mutex.run(async () => void log.push("b"));
    await Promise.resolve();
    expect(log).toEqual(["a start"]);
    gate.resolve();
    await Promise.all([slow, fast]);
    expect(log).toEqual(["a start", "a end", "b"]);
  });
  test("a failing task does not block the next", async () => {
    const mutex = createMutex();
    await expect(mutex.run(async () => Promise.reject(new Error("x")))).rejects.toThrow("x");
    await expect(mutex.run(async () => 7)).resolves.toBe(7);
  });
});
