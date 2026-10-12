import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Admin" };

export default async function Page() {
  await requireAdmin("/admin");
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Admin</h1>
      <p>Admin area coming soon</p>
    </div>
  );
}
