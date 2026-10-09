import { expect, test } from "vitest";
import { MENU_SORTS } from "@/lib/menu-params";
import { SORT_LABELS, pickActiveSection, sectionAnchor } from "@/lib/menu-view";

const tops = (...t: number[]) => t.map((top, i) => ({ key: `s${i}`, top }));

test("sectionAnchor prefixes the key", () => {
  expect(sectionAnchor("abc")).toBe("section-abc");
});

test.each([
  [[200, 900, 1500], 100, "s0"],
  [[-50, 300, 900], 100, "s0"],
  [[-800, -20, 600], 100, "s1"],
  [[-800, -400, -20], 100, "s2"],
  [[100, 600], 100, "s0"],
])("pickActiveSection(%j, %i) = %s", (t, offset, expected) => {
  expect(pickActiveSection(tops(...t), offset)).toBe(expected);
});

test("pickActiveSection of nothing is undefined", () => {
  expect(pickActiveSection([], 100)).toBeUndefined();
});

test("every sort has a label", () => {
  for (const s of MENU_SORTS) expect(SORT_LABELS[s]).toBeTruthy();
});
