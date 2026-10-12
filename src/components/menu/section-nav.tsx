"use client";

import { useEffect, useState } from "react";
import { pickActive, sectionAnchor } from "@/lib/menu-view";
import { cn } from "@/lib/utils";

const OFFSET = 140;

export function SectionNav({ sections }: { sections: { key: string; title: string }[] }) {
  const [picked, setActive] = useState<string | undefined>(sections[0]?.key);
  // `sections` can change under a kept `picked`; fall back to the first one.
  const active = sections.some((s) => s.key === picked) ? picked : sections[0]?.key;

  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    // The root is a 1px band at the sticky offset; the section crossing it is the active one.
    // A section's key is its anchor id minus the prefix, so map ids back through a lookup.
    const byId = new Map(sections.map(({ key }) => [sectionAnchor(key), key]));
    const repick = () => {
      const found = [...byId].flatMap(([id, key]) => {
        const el = document.getElementById(id);
        return el ? [{ key, top: el.getBoundingClientRect().top }] : [];
      });
      const i = pickActive(
        found.map((f) => f.top),
        OFFSET,
      );
      if (found[i]) setActive(found[i].key);
    };
    const observe = () => {
      observer?.disconnect();
      const bottomInset = Math.max(0, window.innerHeight - OFFSET - 1);
      observer = new IntersectionObserver(
        (entries) => {
          let crossed = false;
          for (const e of entries) {
            const key = byId.get(e.target.id);
            if (e.isIntersecting && key) {
              crossed = true;
              setActive(key);
            }
          }
          // A jump (scrollTo, long wheel) can skip the 1px band; recompute from positions.
          if (!crossed) repick();
        },
        { rootMargin: `-${OFFSET}px 0px -${bottomInset}px 0px` },
      );
      for (const id of byId.keys()) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    };
    observe();
    window.addEventListener("resize", observe);
    // A jump can leap past the band, or land in a gap between sections, with no
    // intersection change, so the observer never fires and the highlight goes stale.
    window.addEventListener("scrollend", repick);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", observe);
      window.removeEventListener("scrollend", repick);
    };
  }, [sections]);

  return (
    <nav aria-label="Menu sections">
      <ul className="flex gap-1 lg:flex-col">
        {sections.map(({ key, title }) => (
          <li key={key} className="shrink-0">
            <a
              href={`#${sectionAnchor(key)}`}
              aria-current={active === key ? "true" : undefined}
              className={cn(
                "block rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active === key
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
