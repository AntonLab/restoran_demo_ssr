import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <section className="rounded-xl border bg-card p-6">
        <h1 className="mb-4 text-2xl font-bold">Reset password</h1>
        <ForgotPasswordForm />
        <p className="mt-4 text-sm">
          <Link href="/login" className="underline">
            Back to sign in
          </Link>
        </p>
      </section>
    </div>
  );
}
