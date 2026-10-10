import Link from "next/link";
import { navLinkClass } from "@/components/site/nav-link-class";
import { getShopper } from "@/server/auth/shopper-cookie";
import { cartCount } from "@/server/cart";

export async function CartLink() {
  const shopper = await getShopper();
  if (!shopper) return null;
  const count = shopper.ownerKey ? await cartCount(shopper.ownerKey) : 0;
  return (
    <Link
      href="/cart"
      className={navLinkClass}
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
    >
      Cart
      {count > 0 && (
        <span className="bg-primary text-primary-foreground ml-1.5 rounded-full px-1.5 text-xs">
          {count}
        </span>
      )}
    </Link>
  );
}
