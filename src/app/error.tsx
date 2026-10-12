"use client";

import { Button } from "@/components/ui/button";

// retry() re-fetches the segment; Next 16 prefers it over reset().
export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-4xl flex-col items-start gap-4 px-4 py-12"
    >
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">We could not load this page. Please try again.</p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
