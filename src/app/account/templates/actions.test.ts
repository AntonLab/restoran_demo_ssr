import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { deleteTemplateAction, templateAction } from "@/app/account/templates/actions";
import { actionUser } from "@/server/auth/guards";
import { OrderTemplate } from "@/server/models/order-template";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

vi.mock("@/server/auth/guards", () => ({ actionUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeAll(async () => {
  await startTestDb();
  await OrderTemplate.init();
});
afterAll(stopTestDb);
beforeEach(async () => {
  vi.clearAllMocks();
  await clearTestDb();
});

const asUser = (id: string) =>
  vi.mocked(actionUser).mockResolvedValue({ sessionId: "s", user: { id, role: "user" } } as never);
const uid = () => String(new mongoose.Types.ObjectId());
const fd = (obj: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.set(k, v);
  return f;
};
const IDLE = { status: "idle" } as const;
const ok = { name: "Ann", phone: "+1 555 123 4567", address: "12 Main Street" };

describe("templateAction", () => {
  test("a signed-out caller gets the sign-in error", async () => {
    vi.mocked(actionUser).mockResolvedValue(null);
    expect(await templateAction(IDLE, fd(ok))).toMatchObject({ status: "error" });
  });
  test("creates, then updates by hidden id, and refreshes the list", async () => {
    const u = uid();
    asUser(u);
    expect(await templateAction(IDLE, fd(ok))).toEqual({
      status: "success",
      message: "Template saved.",
    });
    const [t] = await OrderTemplate.find({ userId: u }).lean();
    await templateAction(IDLE, fd({ ...ok, id: String(t._id), address: "99 New Street" }));
    expect((await OrderTemplate.findById(t._id).lean())!.address).toBe("99 New Street");
    expect(revalidatePath).toHaveBeenCalledWith("/account/templates");
  });
  test("invalid fields and the 6th template come back as errors", async () => {
    const u = uid();
    asUser(u);
    expect(await templateAction(IDLE, fd({ ...ok, address: "x" }))).toMatchObject({
      status: "error",
      fieldErrors: { address: [expect.any(String)] },
    });
    for (let i = 1; i <= 5; i++)
      await templateAction(IDLE, fd({ ...ok, address: `${i} Main Street` }));
    expect(await templateAction(IDLE, fd({ ...ok, address: "6 Main Street" }))).toMatchObject({
      status: "error",
    });
  });
});

describe("deleteTemplateAction", () => {
  test("deletes an own template; another User's is refused", async () => {
    const [u, other] = [uid(), uid()];
    asUser(u);
    await templateAction(IDLE, fd(ok));
    const [t] = await OrderTemplate.find({ userId: u }).lean();
    asUser(other);
    expect(await deleteTemplateAction(String(t._id))).toMatchObject({ ok: false });
    asUser(u);
    expect(await deleteTemplateAction(String(t._id))).toEqual({ ok: true });
    expect(await OrderTemplate.countDocuments()).toBe(0);
  });
});
