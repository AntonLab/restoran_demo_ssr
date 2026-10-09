import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/auth/session";

const linkClass =
  "hover:text-primary text-foreground rounded-sm py-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export async function HeaderAuth() {
  const session = await getSession();
  if (!session) {
    return (
      <Link href="/login" className={linkClass}>
        Sign in
      </Link>
    );
  }
  const admin = session.user.role === "admin";
  return (
    <>
      <Link href={admin ? "/admin" : "/account"} className={linkClass}>
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
