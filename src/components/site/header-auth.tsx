import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { CartLink } from "@/components/site/cart-link";
import { navLinkClass } from "@/components/site/nav-link-class";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/auth/session";

export async function HeaderAuth() {
  const session = await getSession();
  if (!session) {
    return (
      <>
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
