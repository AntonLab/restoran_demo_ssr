import Link from "next/link";
import type { ReactNode } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { buttonVariants } from "@/components/ui/button";

type Empty = { title: string; href: string; label: string };

export function AccountList({
  toolbar,
  noun,
  empty,
  total,
  shown,
  page,
  pageCount,
  prev,
  next,
  children,
}: {
  toolbar: ReactNode;
  noun: string;
  empty: Empty;
  total: number;
  shown: number;
  page: number;
  pageCount: number;
  prev?: string;
  next?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Account</h1>
      <AccountNav />
      {toolbar}
      {total === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <h2 className="text-xl font-semibold">{empty.title}</h2>
          <Link href={empty.href} className={buttonVariants({ variant: "outline" })}>
            {empty.label}
          </Link>
        </div>
      ) : shown === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <h2 className="text-xl font-semibold">No {noun} on this page</h2>
          {prev && (
            <Link href={prev} className={buttonVariants({ variant: "outline" })}>
              Back to the last page
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {children}
          {pageCount > 1 && (
            <nav aria-label="Pages" className="flex items-center justify-between gap-2 text-sm">
              {prev ? (
                <Link href={prev} className={buttonVariants({ variant: "outline" })}>
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span>
                Page {page} of {pageCount}
              </span>
              {next ? (
                <Link href={next} className={buttonVariants({ variant: "outline" })}>
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
