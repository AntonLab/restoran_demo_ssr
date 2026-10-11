"use client";

import { ConfirmDialog } from "@/components/account/confirm-dialog";
import { useCancelDialog } from "@/components/account/use-cancel-dialog";
import { StatusBadge } from "@/components/site/status-badge";
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

const preOrder = (b: BookingTableRow) =>
  b.items.length === 0 ? "—" : `${formatItems(b.items)} · ${formatPrice(b.totalCents)}`;

export function BookingsTable({
  bookings,
  timezone,
}: {
  bookings: BookingTableRow[];
  timezone: string;
}) {
  const { target, error, pending, open, onOpenChange, confirm } = useCancelDialog(
    cancelBookingAction,
    bookingCancelFailureText,
    "Could not cancel the booking. Try again.",
  );

  const cancelButton = (b: BookingTableRow) =>
    b.cancellable && (
      <Button
        variant="outline"
        size="sm"
        aria-label={`Cancel booking #${b.number}`}
        onClick={() => open(b.number)}
      >
        Cancel
      </Button>
    );

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
                <StatusBadge>{BOOKING_STATUS_LABELS[b.status]}</StatusBadge>
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
              <StatusBadge>{BOOKING_STATUS_LABELS[b.status]}</StatusBadge>
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
        onOpenChange={onOpenChange}
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
