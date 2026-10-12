import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";
import { TemplatesList } from "@/components/account/templates-list";
import { requireUser } from "@/server/auth/guards";
import { listTemplates, TEMPLATE_LIMIT } from "@/server/order-templates";

export const metadata: Metadata = { title: "Templates" };

export default async function Page() {
  const session = await requireUser("/account/templates");
  const templates = await listTemplates(session.user.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Account</h1>
      <AccountNav />
      <div className="mt-6">
        <TemplatesList
          templates={templates.map(({ id, name, phone, address }) => ({
            id,
            name,
            phone,
            address,
          }))}
          atLimit={templates.length >= TEMPLATE_LIMIT}
          limit={TEMPLATE_LIMIT}
        />
      </div>
    </div>
  );
}
