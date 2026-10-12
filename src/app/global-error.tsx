"use client";

// Replaces the root layout, so it brings its own document and cannot rely on globals.css.
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "sans-serif",
          padding: "3rem 1rem",
          maxWidth: "56rem",
          margin: "0 auto",
        }}
      >
        <div role="alert">
          <h1>Something went wrong</h1>
          <p>The site could not be loaded. Please try again.</p>
          <button type="button" onClick={() => retry()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
