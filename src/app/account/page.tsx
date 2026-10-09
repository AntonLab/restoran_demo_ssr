import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";
import { ContactsForm } from "@/components/account/contacts-form";
import { EmailForm } from "@/components/account/email-form";
import { PasswordForm } from "@/components/account/password-form";
import { requireUser } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Account" };

const section = "rounded-xl border bg-card p-6";

export default async function Page() {
  const { user } = await requireUser("/account");
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">Account</h1>
      <AccountNav />
      <section className={section}>
        <h2 className="mb-4 text-lg font-semibold">Contact details</h2>
        <ContactsForm name={user.name} phone={user.phone ?? ""} />
      </section>
      <section className={section}>
        <h2 className="mb-4 text-lg font-semibold">Email</h2>
        <EmailForm email={user.email} />
      </section>
      <section className={section}>
        <h2 className="mb-4 text-lg font-semibold">Change password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
