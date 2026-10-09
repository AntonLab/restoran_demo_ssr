import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-start gap-4 px-4 py-12">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link
        href="/menu"
        className="rounded-md text-primary underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        Back to menu
      </Link>
    </div>
  );
}
