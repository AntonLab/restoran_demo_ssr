import { expect, test } from "vitest";
import { roundRating, starForKey } from "@/lib/ratings";

test.each([
  [4.25, 4.3],
  [4.24, 4.2],
  [5, 5],
  [3.333333, 3.3],
])("roundRating(%s) = %s", (input, expected) => {
  expect(roundRating(input)).toBe(expected);
});

test.each([
  ["ArrowRight", 2, 3],
  ["ArrowUp", 5, 5],
  ["ArrowLeft", 1, 1],
  ["ArrowDown", 3, 2],
  ["Home", 4, 1],
  ["End", 2, 5],
  ["ArrowRight", 0, 1],
  ["a", 3, null],
])("starForKey(%s, %s) = %s", (key, value, expected) => {
  expect(starForKey(key, value)).toBe(expected);
});
