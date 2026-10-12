import { expect, test } from "vitest";
import { MENU_SORTS } from "@/lib/menu-params";
import { SORT_LABELS, pickActive, sectionAnchor } from "@/lib/menu-view";

test("pickActive: every top below the offset gives the first section", () => {
  expect(pickActive([300, 900, 1500], 140)).toBe(0);
});

test("pickActive: an offset between two tops gives the earlier section", () => {
  expect(pickActive([-800, 100, 700], 140)).toBe(1);
});

test("pickActive: an offset past the last top gives the last section", () => {
  expect(pickActive([-1500, -900, -50], 140)).toBe(2);
});

test("sectionAnchor prefixes the key", () => {
  expect(sectionAnchor("abc")).toBe("section-abc");
});

test("every sort has a label", () => {
  for (const s of MENU_SORTS) expect(SORT_LABELS[s]).toBeTruthy();
});
