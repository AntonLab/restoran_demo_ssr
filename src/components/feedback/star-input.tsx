"use client";

import { Star } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cn } from "cn";

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
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -1
          : 0;
    if (!step) return;
    e.preventDefault();
    const next = Math.min(5, Math.max(1, value + step));
    onChange(next);
    e.currentTarget.querySelectorAll<HTMLButtonElement>("button")[next - 1]?.focus();
  }

  return (
    <div role="radiogroup" tabIndex={-1} aria-label={label} onKeyDown={onKeyDown} className="flex">
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
