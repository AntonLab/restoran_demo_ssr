import { describe, expect, test } from "vitest";
import {
  checkoutSchema,
  parseOrderFilters,
  sameContact,
  serializeOrderFilters,
  templateSchema,
} from "@/lib/order-schemas";

const valid = {
  name: " Ann ",
  phone: "+1 (555) 123-4567",
  address: "12 Main St",
  deliveryDate: "2026-10-12",
  deliveryTime: "18:30",
  expectedTotalCents: "1700",
  saveTemplate: "on",
};

describe("checkoutSchema", () => {
  test("normalizes a valid submission", () => {
    expect(checkoutSchema.parse(valid)).toEqual({
      name: "Ann",
      phone: "+15551234567",
      address: "12 Main St",
      deliveryDate: "2026-10-12",
      deliveryTime: "18:30",
      expectedTotalCents: 1700,
      saveTemplate: true,
    });
  });
  test("saveTemplate defaults to false", () => {
    const { saveTemplate: _, ...rest } = valid;
    expect(checkoutSchema.parse(rest).saveTemplate).toBe(false);
  });
  test.each([
    ["name", "   "],
    ["address", "  abc  "],
    ["address", "x".repeat(201)],
    ["phone", "12"],
    ["deliveryTime", "9:00"],
    ["deliveryTime", "25:00"],
    ["deliveryDate", "2026-1-5"],
    ["expectedTotalCents", ""],
    ["expectedTotalCents", "abc"],
    ["expectedTotalCents", "-5"],
    ["expectedTotalCents", "1.5"],
  ])("rejects %s = %j", (field, value) => {
    const result = checkoutSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual([field]);
  });
});

describe("templateSchema", () => {
  test("accepts and normalizes", () => {
    expect(
      templateSchema.parse({ name: "Ann", phone: "555 123 4567", address: "12 Main St" }),
    ).toEqual({
      name: "Ann",
      phone: "5551234567",
      address: "12 Main St",
    });
  });
  test("rejects a short address", () => {
    expect(
      templateSchema.safeParse({ name: "Ann", phone: "5551234567", address: "abc" }).success,
    ).toBe(false);
  });
});

test("sameContact compares normalized values", () => {
  const a = { name: "Ann", phone: "+15551234567", address: "12 Main St" };
  expect(sameContact(a, { ...a, phone: "+1 555 123 4567", name: " Ann " })).toBe(true);
  expect(sameContact(a, { ...a, address: "13 Main St" })).toBe(false);
});

describe("parseOrderFilters", () => {
  test("defaults", () => {
    expect(parseOrderFilters({})).toEqual({
      from: null,
      to: null,
      status: null,
      dish: "",
      page: 1,
    });
  });
  test("drops invalid values and takes the first of arrays", () => {
    expect(
      parseOrderFilters({
        from: "2026-02-30",
        to: "nope",
        status: "bogus",
        page: ["0", "3"],
        dish: ["  borsch  "],
      }),
    ).toEqual({ from: null, to: null, status: null, dish: "borsch", page: 1 });
  });
  test("swaps an inverted range and keeps a valid page", () => {
    expect(
      parseOrderFilters({ from: "2026-10-20", to: "2026-10-01", status: "new", page: "3" }),
    ).toEqual({
      from: "2026-10-01",
      to: "2026-10-20",
      status: "new",
      dish: "",
      page: 3,
    });
  });
  test("caps dish at 80 chars and rejects negative or fractional pages", () => {
    expect(parseOrderFilters({ dish: "x".repeat(200) }).dish).toHaveLength(80);
    expect(parseOrderFilters({ page: "-2" }).page).toBe(1);
    expect(parseOrderFilters({ page: "1.5" }).page).toBe(1);
  });
  test("serialize omits defaults and round-trips", () => {
    expect(serializeOrderFilters(parseOrderFilters({}))).toBe("");
    const f = { from: "2026-10-01", to: null, status: "new" as const, dish: "soup", page: 2 };
    expect(
      parseOrderFilters(Object.fromEntries(new URLSearchParams(serializeOrderFilters(f)))),
    ).toEqual(f);
  });
});
