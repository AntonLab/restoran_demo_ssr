import Link from "next/link";
import { connection } from "next/server";
import { PopularCarousel } from "@/components/menu/popular-carousel";
import { buttonVariants } from "@/components/ui/button";
import { telHref } from "@/lib/format";
import { getViewer } from "@/server/auth/get-viewer";
import { getPopularDishes } from "@/server/queries/menu";
import { getSettings } from "@/server/queries/settings";

export default async function Home() {
  await connection();
  const [settings, popular, viewer] = await Promise.all([
    getSettings(),
    getPopularDishes(),
    getViewer(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="flex flex-col items-start gap-4">
        <h1 className="text-4xl font-bold">{settings.name}</h1>
        <p className="max-w-2xl text-muted-foreground">{settings.description}</p>
        <Link href="/menu" className={buttonVariants({ size: "lg" })}>
          View menu
        </Link>
      </section>
      <section className="flex flex-col gap-1 text-sm">
        <p>{settings.address}</p>
        <a href={telHref(settings.contacts.phone)} className="text-primary hover:underline">
          {settings.contacts.phone}
        </a>
      </section>
      {popular.length > 0 && (
        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-2xl font-semibold">Popular</h2>
          <PopularCarousel dishes={popular} viewer={viewer} />
        </section>
      )}
    </div>
  );
}
