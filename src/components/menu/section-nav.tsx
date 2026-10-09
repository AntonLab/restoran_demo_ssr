"use client";

import { useEffect, useState } from "react";
import { pickActiveSection, sectionAnchor } from "@/lib/menu-view";
import { cn } from "@/lib/utils";

export function SectionNav({ sections }: { sections: { key: string; title: string }[] }) {
  const [active, setActive] = useState<string | undefined>(sections[0]?.key);

  useEffect(() => {
    const update = () => {
      const tops = sections.flatMap(({ key }) => {
        const el = document.getElementById(sectionAnchor(key));
        return el ? [{ key, top: el.getBoundingClientRect().top }] : [];
      });
      setActive(pickActiveSection(tops, 140));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
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
