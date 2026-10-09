import { Star } from "lucide-react";

// Pure display, kept out of the "use client" reviews list so the server page does not ship it as client JS.
export function RatingRow({ label, value }: { label?: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {label && <span className="w-14 text-muted-foreground">{label}</span>}
      <span className="flex">
        <span className="sr-only">{value} out of 5</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden
            className={
              n <= value ? "size-4 fill-primary text-primary" : "size-4 text-muted-foreground"
            }
          />
        ))}
      </span>
    </div>
  );
}
