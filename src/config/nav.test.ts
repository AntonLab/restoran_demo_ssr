import { expect, test } from "vitest";
import { ACCOUNT_NAV } from "@/config/nav";

test("the Account nav lists Details, Orders, Templates, Favorites in that order", () => {
  expect(ACCOUNT_NAV).toEqual([
    { label: "Details", href: "/account" },
    { label: "Orders", href: "/account/orders" },
    { label: "Templates", href: "/account/templates" },
    { label: "Favorites", href: "/account/favorites" },
  ]);
});
