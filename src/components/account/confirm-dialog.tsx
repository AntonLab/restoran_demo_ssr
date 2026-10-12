"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  keepLabel: string;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title: titleProp,
  description: descriptionProp,
  confirmLabel,
  keepLabel,
  pending,
  error,
  onConfirm,
}: ConfirmDialogProps) {
  // Dialog closes after target is null; keep the last value so the text doesn't flash empty.
  const [last, setLast] = useState({ title: titleProp, description: descriptionProp });
  const title = titleProp || last.title;
  const description = descriptionProp || last.description;
  if (title !== last.title || description !== last.description) setLast({ title, description });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          {error ? (
            // Hiding confirm after a failure stops an accidental retry of a stale action.
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
                {keepLabel}
              </Button>
              <Button variant="destructive" disabled={pending} onClick={onConfirm}>
                {pending ? "Working…" : confirmLabel}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
