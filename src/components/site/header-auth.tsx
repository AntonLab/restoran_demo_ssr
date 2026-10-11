import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { CartLink } from "@/components/site/cart-link";
import { navLinkClass } from "@/components/site/nav-link-class";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/auth/session";

// Icon below sm: the signed-in actions overflow 360 px with the text label.
// The pseudo-element grows the hit area to 44 px without adding layout width;
// its 12 px inset equals the header's gap-3, so it does not reach the next link.
function ReserveLink() {
  return (
    <Link
      href="/booking"
      className={`${navLinkClass} relative after:absolute after:-inset-3 after:content-[''] sm:after:hidden`}
    >
      <CalendarPlus className="size-5 sm:hidden" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">Reserve a table</span>
    </Link>
  );
}

export async function HeaderAuth() {
  const session = await getSession();
  if (!session) {
    return (
      <>
        <ReserveLink />
        <CartLink />
        <Link href="/login" className={navLinkClass}>
          Sign in
        </Link>
      </>
    );
  }
  const admin = session.user.role === "admin";
  return (
    <>
      {!admin && <ReserveLink />}
      <CartLink />
      <Link href={admin ? "/admin" : "/account"} className={navLinkClass}>
        {admin ? "Admin" : "Account"}
      </Link>
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" size="sm">
          Sign out
        </Button>
      </form>
    </>
  );
}
