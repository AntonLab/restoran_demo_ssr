import { cookies } from "next/headers";
import { beforeEach, expect, test, vi } from "vitest";
import {
  ensureShopper,
  NEW_GUEST_CARTS_PER_HOUR,
  newCartLimiter,
} from "@/server/auth/shopper-cookie";

const CID = "11111111-1111-4111-8111-111111111111";
const jar = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => jar),
  headers: vi.fn(async () => new Headers()),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getSession: vi.fn(async () => null) }));

beforeEach(() => {
  vi.mocked(cookies).mockResolvedValue(jar as never);
  jar.get.mockReset();
  jar.set.mockReset();
});

test("the (N+1)th new Guest Cart from one IP is refused and sets no cookie", async () => {
  // Same IP as the mocked request ("local"): leave one slot, then take it.
  for (let i = 0; i < NEW_GUEST_CARTS_PER_HOUR - 1; i++) newCartLimiter.hit("local");
  expect(await ensureShopper()).toMatchObject({ ownerKey: expect.stringMatching(/^guest:/) });
  jar.set.mockClear();
  expect(await ensureShopper()).toEqual({
    error: expect.stringMatching(/^Too many attempts\. Try again in \d+ minutes?\.$/),
  });
  expect(jar.set).not.toHaveBeenCalled();
});

test("a Guest with a Cart cookie is not limited, even after the limit is spent", async () => {
  jar.get.mockReturnValue({ value: CID });
  for (let i = 0; i < NEW_GUEST_CARTS_PER_HOUR + 5; i++) {
    expect(await ensureShopper()).toMatchObject({ ownerKey: `guest:${CID}` });
  }
});
