import { expect, test } from "vitest";
import { MENU_SORTS } from "@/lib/menu-params";
import { SORT_LABELS, sectionAnchor } from "@/lib/menu-view";

test("sectionAnchor prefixes the key", () => {
  expect(sectionAnchor("abc")).toBe("section-abc");
});

test("every sort has a label", () => {
  for (const s of MENU_SORTS) expect(SORT_LABELS[s]).toBeTruthy();
});
