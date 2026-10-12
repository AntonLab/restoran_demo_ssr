import { revalidatePath } from "next/cache";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { bookingAction } from "@/app/booking/actions";
import { WEEKDAYS } from "@/lib/weekdays";
import { ensureShopper } from "@/server/auth/shopper-cookie";
import { guestCartKey } from "@/server/cart";
import { Booking } from "@/server/models/booking";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";
import { formOf } from "@/server/test/form";

vi.mock("@/server/queries/settings", () => ({
  getSettings: async () => ({
    timezone: "UTC",
    maxConcurrentBookings: 1,
    schedule: WEEKDAYS.map((day) => ({ day, open: "09:00", close: "22:00", closed: false })),
  }),
}));
vi.mock("@/server/auth/shopper-cookie", () => ({ ensureShopper: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

beforeAll(async () => {
  await startTestDb();
  await Booking.init();
});
afterAll(stopTestDb);
beforeEach(async () => {
  await clearTestDb();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-12T10:07:00Z") });
});
afterEach(() => vi.useRealTimers());

const guest = { role: "guest", userId: null, ownerKey: guestCartKey("abc") } as const;
const fd = (patch: Record<string, string> = {}) =>
  formOf({
    name: "Ann",
    phone: "+1 555 123 4567",
    guests: "2",
    date: "2026-10-13",
    time: "12:00",
    ...patch,
  });

describe("bookingAction", () => {
  test("a Guest Booking redirects to the confirmation and revalidates the layout", async () => {
    vi.mocked(ensureShopper).mockResolvedValue(guest);
    await expect(bookingAction({ status: "idle" }, fd())).rejects.toThrow(
      /^NEXT_REDIRECT:\/booking\/done\?number=1&t=[0-9a-f-]{36}$/,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(await Booking.countDocuments()).toBe(1);
  });
  test("invalid fields come back as a form state, with no redirect", async () => {
    vi.mocked(ensureShopper).mockResolvedValue(guest);
    const state = await bookingAction({ status: "idle" }, fd({ guests: "0" }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { guests: [expect.any(String)] } });
    expect(await Booking.countDocuments()).toBe(0);
  });
  test("a full Slot is a field error on time", async () => {
    vi.mocked(ensureShopper).mockResolvedValue(guest);
    await expect(bookingAction({ status: "idle" }, fd())).rejects.toThrow("NEXT_REDIRECT");
    const state = await bookingAction({ status: "idle" }, fd());
    expect(state).toMatchObject({
      status: "error",
      fieldErrors: { time: ["This time is fully booked, pick another"] },
    });
  });
  test("a new-cart rate limit error is shown and books nothing", async () => {
    vi.mocked(ensureShopper).mockResolvedValue({ error: "Too many attempts." });
    expect(await bookingAction({ status: "idle" }, fd())).toEqual({
      status: "error",
      error: "Too many attempts.",
    });
    expect(await Booking.countDocuments()).toBe(0);
  });
  test("an Admin (no shopper) is refused", async () => {
    vi.mocked(ensureShopper).mockResolvedValue(null);
    expect(await bookingAction({ status: "idle" }, fd())).toEqual({
      status: "error",
      error: "Admins cannot book a table.",
    });
    expect(await Booking.countDocuments()).toBe(0);
  });
});
