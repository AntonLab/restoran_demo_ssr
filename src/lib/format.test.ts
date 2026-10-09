import { expect, test } from "vitest";
import { formatPrice, telHref } from "@/lib/format";

test.each([
  [1250, "$12.50"],
  [5, "$0.05"],
  [100000, "$1,000.00"],
  [0, "$0.00"],
])("formatPrice(%i) = %s", (cents, text) => {
  expect(formatPrice(cents)).toBe(text);
});

test.each([
  ["+1 555 010 2030", "tel:+15550102030"],
  ["(555) 010-2030", "tel:5550102030"],
  ["", "tel:"],
])("telHref(%j) = %s", (phone, href) => {
  expect(telHref(phone)).toBe(href);
});
