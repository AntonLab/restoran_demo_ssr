import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { cancelOrderAction } from "@/app/account/orders/actions";
import { actionUser } from "@/server/auth/guards";
import { Order } from "@/server/models/order";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

vi.mock("@/server/auth/guards", () => ({ actionUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeAll(async () => {
  await startTestDb();
  await Order.init();
});
afterAll(stopTestDb);
let seq = 0;
beforeEach(async () => {
  seq = 0;
  vi.clearAllMocks();
  await clearTestDb();
});

const asUser = (id: string) =>
  vi.mocked(actionUser).mockResolvedValue({ sessionId: "s", user: { id, role: "user" } } as never);
const oid = () => new mongoose.Types.ObjectId();
const uid = () => String(oid());
const mkOrder = (userId: string | null, patch: Record<string, unknown> = {}) =>
  Order.create({
    number: ++seq,
    userId,
    customer: { name: "Ann", phone: "+15551234567" },
    address: "12 Main Street",
    deliveryAt: new Date("2026-10-20T12:00:00Z"),
    items: [{ dishId: oid(), nameSnapshot: "Borscht", priceCentsSnapshot: 850, qty: 2 }],
    totalCents: 1700,
    status: "new",
    history: [{ status: "new", at: new Date() }],
    ...patch,
  });

describe("cancelOrderAction", () => {
  test("a signed-out or Admin caller is refused", async () => {
    vi.mocked(actionUser).mockResolvedValue(null);
    expect(await cancelOrderAction(1)).toMatchObject({ ok: false });
  });
  test("cancels a new Order of the User and refreshes the history", async () => {
    const u = uid();
    asUser(u);
    await mkOrder(u);
    expect(await cancelOrderAction(1)).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith("/account/orders");
  });
  test("an accepted Order stays, the fresh status comes back and the page still refreshes", async () => {
    const u = uid();
    asUser(u);
    await mkOrder(u, { status: "accepted" });
    expect(await cancelOrderAction(1)).toMatchObject({ ok: false, status: "accepted" });
    expect(revalidatePath).toHaveBeenCalledWith("/account/orders");
  });
  test("another User's Order is not found and nothing refreshes", async () => {
    asUser(uid());
    await mkOrder(uid());
    expect(await cancelOrderAction(1)).toEqual({ ok: false, error: "Order not found." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
