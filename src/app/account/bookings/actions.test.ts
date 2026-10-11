import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { cancelBookingAction } from "@/app/account/bookings/actions";
import { actionUser } from "@/server/auth/guards";
import { Booking } from "@/server/models/booking";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

vi.mock("@/server/auth/guards", () => ({ actionUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeAll(async () => {
  await startTestDb();
  await Booking.init();
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
const uid = () => String(new mongoose.Types.ObjectId());
const mk = (userId: string, patch: Record<string, unknown> = {}) =>
  Booking.create({
    number: ++seq,
    userId,
    contact: { name: "Ann", phone: "+15551234567" },
    startsAt: new Date("2099-01-01T12:00:00Z"),
    guests: 2,
    items: [],
    totalCents: 0,
    status: "new",
    history: [{ status: "new", at: new Date() }],
    ...patch,
  });

describe("cancelBookingAction", () => {
  test("refuses when there is no signed-in User", async () => {
    vi.mocked(actionUser).mockResolvedValue(null);
    expect(await cancelBookingAction(1)).toMatchObject({ ok: false });
  });
  test("cancels a new Booking of the User and refreshes the list", async () => {
    const u = uid();
    asUser(u);
    await mk(u);
    expect(await cancelBookingAction(1)).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith("/account/bookings");
  });
  test("a confirmed Booking stays, the fresh status comes back and the list still refreshes", async () => {
    const u = uid();
    asUser(u);
    await mk(u, { status: "confirmed" });
    expect(await cancelBookingAction(1)).toMatchObject({ ok: false, status: "confirmed" });
    expect(revalidatePath).toHaveBeenCalledWith("/account/bookings");
  });
  test("another User's Booking is not found and nothing refreshes", async () => {
    asUser(uid());
    await mk(uid());
    expect(await cancelBookingAction(1)).toEqual({ ok: false, error: "Booking not found." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
