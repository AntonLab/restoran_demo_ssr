import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { postLoginPath } from "@/server/auth/next-path";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page({ searchParams }: PageProps<"/login">) {
  const { next: rawNext, reset } = await searchParams;
  const next = Array.isArray(rawNext) ? rawNext[0] : rawNext;
  const session = await getSession();
  if (session) redirect(postLoginPath(next, session.user.role));

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <section className="rounded-xl border bg-card p-6">
        <h1 className="mb-4 text-2xl font-bold">Sign in</h1>
        {reset === "1" && (
          <output className="mb-4 block text-sm">
            Password changed. Sign in with your new password.
          </output>
        )}
        <LoginForm next={next ?? ""} />
        <p className="mt-4 flex flex-col gap-1 text-sm">
          <Link href="/register" className="underline">
            Create an account
          </Link>
          <Link href="/forgot-password" className="underline">
            Forgot your password?
          </Link>
        </p>
      </section>
    </div>
  );
}
