import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { DishCard } from "@/components/menu/dish-card";
import { MenuFilters } from "@/components/menu/menu-filters";
import { SectionNav } from "@/components/menu/section-nav";
import { VenueBlock } from "@/components/menu/venue-block";
import { buttonVariants } from "@/components/ui/button";
import { hasActiveFilters, parseMenuParams } from "@/lib/menu-params";
import { sectionAnchor } from "@/lib/menu-view";
import { getMenuSections } from "@/server/queries/menu";
import { getSettings } from "@/server/queries/settings";

export const metadata: Metadata = { title: "Menu" };

export default async function Page({ searchParams }: PageProps<"/menu">) {
  await connection();
  const filters = parseMenuParams(await searchParams);
  const [sections, settings] = await Promise.all([getMenuSections(filters), getSettings()]);
  const navItems = sections.map(({ key, title }) => ({ key, title }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-4xl font-bold">Menu</h1>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)_16rem]">
        <aside className="bg-background/95 sticky top-14 z-30 -mx-4 overflow-x-auto px-4 py-2 backdrop-blur lg:top-20 lg:z-auto lg:mx-0 lg:self-start lg:overflow-visible lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <SectionNav sections={navItems} />
        </aside>
        <div className="lg:col-start-3 lg:row-start-1 lg:sticky lg:top-20 lg:self-start">
          <MenuFilters filters={filters} />
          <div className="mt-6 hidden lg:block">
            <VenueBlock settings={settings} />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-10 lg:col-start-2 lg:row-start-1">
          {sections.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <h2 className="text-2xl font-semibold">No dishes match</h2>
              <p className="text-muted-foreground">
                Try a different search or widen the price range.
              </p>
              {hasActiveFilters(filters) && (
                <Link href="/menu" className={buttonVariants({ variant: "outline" })}>
                  Reset filters
                </Link>
              )}
            </div>
          ) : (
            sections.map(({ key, title, dishes }) => (
              <section key={key} id={sectionAnchor(key)} className="scroll-mt-32">
                <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {dishes.map((dish) => (
                    <li key={dish.id}>
                      <DishCard dish={dish} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
        <div className="lg:hidden">
          <VenueBlock settings={settings} />
        </div>
      </div>
    </div>
  );
}
