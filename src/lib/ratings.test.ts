import { expect, test } from "vitest";
import { roundRating } from "@/lib/ratings";

test.each([
  [4.25, 4.3],
  [4.24, 4.2],
  [5, 5],
  [3.333333, 3.3],
])("roundRating(%s) = %s", (input, expected) => {
  expect(roundRating(input)).toBe(expected);
});
