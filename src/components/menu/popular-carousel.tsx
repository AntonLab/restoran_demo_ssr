"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { DishCard } from "@/components/menu/dish-card";
import { Button } from "@/components/ui/button";
import type { DishCardData } from "@/server/queries/menu";

export function PopularCarousel({ dishes }: { dishes: DishCardData[] }) {
  const scroller = useRef<HTMLElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <section
        ref={scroller}
        // Scrollable region must be keyboard focusable (WCAG 2.1.1).
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label="Popular dishes"
        className="snap-x snap-mandatory overflow-x-auto pb-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ul className="flex w-max gap-4">
          {dishes.map((dish) => (
            <li key={dish.id} className="w-64 snap-start">
              <DishCard dish={dish} />
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-2 hidden justify-end gap-2 md:flex">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous dishes"
          onClick={() => scroll(-1)}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button variant="outline" size="icon" aria-label="Next dishes" onClick={() => scroll(1)}>
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}
