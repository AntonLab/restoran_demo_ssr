import { describe, expect, test } from "vitest";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  canTransition,
  canUserCancel,
} from "@/lib/order-status";

const ALLOWED = new Set([
  "new>accepted",
  "accepted>delivery",
  "delivery>completed",
  "new>cancelled",
  "accepted>cancelled",
  "delivery>cancelled",
]);

describe("canTransition", () => {
  for (const from of ORDER_STATUSES) {
    for (const to of ORDER_STATUSES) {
      test(`${from} to ${to}`, () => {
        expect(canTransition(from, to)).toBe(ALLOWED.has(`${from}>${to}`));
      });
    }
  }
});

test("a User may cancel only a new Order", () => {
  expect(ORDER_STATUSES.filter(canUserCancel)).toEqual(["new"]);
});

test("labels cover every status", () => {
  expect(ORDER_STATUS_LABELS.delivery).toBe("Delivery");
  expect(Object.keys(ORDER_STATUS_LABELS).toSorted()).toEqual(ORDER_STATUSES.toSorted());
});
