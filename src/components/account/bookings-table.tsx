"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/account/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cancelBookingAction } from "@/app/account/bookings/actions";
import { BOOKING_STATUS_LABELS } from "@/lib/booking-status";
import { bookingCancelFailureText, type BookingTableRow } from "@/lib/booking-view";
import { formatDateTime, formatPrice } from "@/lib/format";
import { formatItems } from "@/lib/order-view";

const badge = "rounded-md bg-muted px-2 py-0.5 text-xs";

const preOrder = (b: BookingTableRow) =>
  b.items.length === 0 ? "—" : `${formatItems(b.items)} · ${formatPrice(b.totalCents)}`;

export function BookingsTable({
  bookings,
  timezone,
}: {
  bookings: BookingTableRow[];
  timezone: string;
}) {
  // One dialog for the list: a failed cancel revalidates and drops the row's Cancel button, which would unmount a per-row dialog before the error shows.
  const [target, setTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cancelButton = (b: BookingTableRow) =>
    b.cancellable && (
      <Button
        variant="outline"
        size="sm"
        aria-label={`Cancel booking #${b.number}`}
        onClick={() => {
          setError(null);
          setTarget(b.number);
        }}
      >
        Cancel
      </Button>
    );

  const confirm = () => {
    if (target === null) return;
    startTransition(async () => {
      try {
        const r = await cancelBookingAction(target);
        if (r.ok) setTarget(null);
        else setError(bookingCancelFailureText(r.error, r.status));
      } catch {
        setError("Could not cancel the booking. Try again.");
      }
    });
  };

  return (
    <>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead>Booking</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Guests</TableHead>
            <TableHead>Pre-order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-medium">#{b.number}</TableCell>
              <TableCell>{formatDateTime(b.startsAt, timezone)}</TableCell>
              <TableCell>{b.guests}</TableCell>
              <TableCell className="break-words whitespace-normal">{preOrder(b)}</TableCell>
              <TableCell>
                <span className={badge}>{BOOKING_STATUS_LABELS[b.status]}</span>
              </TableCell>
              <TableCell>{cancelButton(b)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ul className="flex flex-col gap-3 md:hidden">
        {bookings.map((b) => (
          <li key={b.id} className="flex flex-col gap-1 rounded-lg border p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">#{b.number}</span>
              <span className={badge}>{BOOKING_STATUS_LABELS[b.status]}</span>
            </div>
            <span className="text-muted-foreground">{formatDateTime(b.startsAt, timezone)}</span>
            <span>Guests: {b.guests}</span>
            <span className="break-words">Pre-order: {preOrder(b)}</span>
            {b.cancellable && <div className="pt-1">{cancelButton(b)}</div>}
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (open) return;
          setTarget(null);
          setError(null);
        }}
        title={target === null ? "" : `Cancel booking #${target}?`}
        description="The booking will be cancelled. This cannot be undone."
        confirmLabel="Cancel booking"
        keepLabel="Keep booking"
        pending={pending}
        error={error}
        onConfirm={confirm}
      />
    </>
  );
}
