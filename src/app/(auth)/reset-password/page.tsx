import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isResetTokenValid } from "@/server/password-reset";

export const metadata: Metadata = { title: "Change password" };

export default async function Page({ searchParams }: PageProps<"/reset-password">) {
  const { token: rawToken } = await searchParams;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  const valid = token !== undefined && (await isResetTokenValid(token));

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <section className="rounded-xl border bg-card p-6">
        <h1 className="mb-4 text-2xl font-bold">Change password</h1>
        {valid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p>
            This link is invalid or expired.{" "}
            <Link href="/forgot-password" className="underline">
              Request a new link
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
