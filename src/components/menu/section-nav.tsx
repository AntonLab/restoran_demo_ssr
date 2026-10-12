"use client";

import { useEffect, useState } from "react";
import { sectionAnchor } from "@/lib/menu-view";
import { cn } from "@/lib/utils";

const OFFSET = 140;

export function SectionNav({ sections }: { sections: { key: string; title: string }[] }) {
  const [active, setActive] = useState<string | undefined>(sections[0]?.key);

  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    // The root is a 1px band at the sticky offset; the section crossing it is the active one.
    // A section's key is its anchor id minus the prefix, so map ids back through a lookup.
    const observe = () => {
      observer?.disconnect();
      const bottomInset = Math.max(0, window.innerHeight - OFFSET - 1);
      const byId = new Map(sections.map(({ key }) => [sectionAnchor(key), key]));
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const key = byId.get(e.target.id);
            if (e.isIntersecting && key) setActive(key);
          }
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
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", observe);
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
