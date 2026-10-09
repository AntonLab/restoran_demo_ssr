"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export function DishModal({ label, children }: { label: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        // back() (not push) restores the menu filters and scroll position
        if (!open) router.back();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Popup
          aria-label={label}
          className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-4 text-card-foreground outline-none md:p-6"
        >
          <Dialog.Close
            aria-label="Close"
            className="absolute top-3 right-3 z-10 rounded-md p-1 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X aria-hidden className="size-5" />
          </Dialog.Close>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
