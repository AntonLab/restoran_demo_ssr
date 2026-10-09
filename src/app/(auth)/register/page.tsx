import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { postLoginPath } from "@/server/auth/next-path";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Create account" };

export default async function Page({ searchParams }: PageProps<"/register">) {
  const { next: rawNext } = await searchParams;
  const next = Array.isArray(rawNext) ? rawNext[0] : rawNext;
  const session = await getSession();
  if (session) redirect(postLoginPath(next, session.user.role));

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <section className="rounded-xl border bg-card p-6">
        <h1 className="mb-4 text-2xl font-bold">Create account</h1>
        <RegisterForm next={next ?? ""} />
        <p className="mt-4 text-sm">
          <Link href="/login" className="underline">
            Already have an account? Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}
