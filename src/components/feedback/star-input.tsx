"use client";

import { Star } from "lucide-react";
import type { KeyboardEvent } from "react";
import { FieldError, errorId } from "@/components/feedback/field";
import { cn } from "@/lib/utils";
import { starForKey } from "@/lib/ratings";

const STARS = [1, 2, 3, 4, 5];

export function StarInput({
  name,
  label,
  value,
  onChange,
  error,
}: {
  name: string;
  label: string;
  value: number;
  onChange(v: number): void;
  error?: string;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const next = starForKey(e.key, value);
    if (next === null) return;
    e.preventDefault();
    onChange(next);
    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next - 1]?.focus();
  }

  return (
    <>
      <div role="radiogroup" aria-label={label} className="flex">
        {STARS.map((n) => {
          const tabStop = value === n || (value === 0 && n === 1);
          return (
            <button
              key={n}
              type="button"
              // A native radio cannot be restyled as a 36 px star button.
              // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} stars`}
              tabIndex={tabStop ? 0 : -1}
              // useFocusFirstError can only focus the radio that holds the tab stop, not the group div.
              // oxlint-disable-next-line jsx-a11y/role-supports-aria-props
              aria-invalid={tabStop && error ? true : undefined}
              aria-describedby={tabStop && error ? errorId(name) : undefined}
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
          );
        })}
        <input type="hidden" name={name} value={value || ""} />
      </div>
      <FieldError id={errorId(name)} message={error} />
    </>
  );
}
