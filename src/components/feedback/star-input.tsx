"use client";

import { Star } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cn } from "cn";
import { starForKey } from "@/lib/ratings";

const STARS = [1, 2, 3, 4, 5];

export function StarInput({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  onChange(v: number): void;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const next = starForKey(e.key, value);
    if (next === null) return;
    e.preventDefault();
    onChange(next);
    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next - 1]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex">
      {STARS.map((n) => (
        <button
          key={n}
          type="button"
          // A native radio cannot be restyled as a 36 px star button.
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} stars`}
          tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
          onClick={() => onChange(n)}
          onKeyDown={onKeyDown}
          className="flex size-9 items-center justify-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Star
            aria-hidden
            className={cn(
              "size-6",
              n <= value ? "fill-primary text-primary" : "text-muted-foreground",
            )}
          />
        </button>
      ))}
      <input type="hidden" name={name} value={value || ""} />
    </div>
  );
}
