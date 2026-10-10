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
import { cancelOrderAction } from "@/app/account/orders/actions";
import { formatDateTime, formatPrice } from "@/lib/format";
import { canUserCancel, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { cancelFailureText, formatItems } from "@/lib/order-view";
import type { OrderRow } from "@/server/orders";

const badge = "rounded-md bg-muted px-2 py-0.5 text-xs";

export function OrdersTable({ orders, timezone }: { orders: OrderRow[]; timezone: string }) {
  // One dialog for the list: a failed cancel revalidates the page and the row loses its
  // Cancel button, so a dialog inside the row would unmount before the message is read.
  const [target, setTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cancelButton = (o: OrderRow) =>
    canUserCancel(o.status) && (
      <Button
        variant="outline"
        size="sm"
        aria-label={`Cancel order #${o.number}`}
        onClick={() => {
          setError(null);
          setTarget(o.number);
        }}
      >
        Cancel
      </Button>
    );

  const confirm = () => {
    if (target === null) return;
    startTransition(async () => {
      try {
        const r = await cancelOrderAction(target);
        if (r.ok) setTarget(null);
        else setError(cancelFailureText(r.error, r.status));
      } catch {
        setError("Could not cancel the order. Try again.");
      }
    });
  };

  return (
    <>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Placed</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">#{o.number}</TableCell>
              <TableCell>{formatDateTime(o.createdAt, timezone)}</TableCell>
              <TableCell className="break-words whitespace-normal">
                {formatItems(o.items)}
              </TableCell>
              <TableCell>{formatPrice(o.totalCents)}</TableCell>
              <TableCell>
                <span className={badge}>{ORDER_STATUS_LABELS[o.status]}</span>
              </TableCell>
              <TableCell>{cancelButton(o)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ul className="flex flex-col gap-3 md:hidden">
        {orders.map((o) => (
          <li key={o.id} className="flex flex-col gap-1 rounded-lg border p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">#{o.number}</span>
              <span className={badge}>{ORDER_STATUS_LABELS[o.status]}</span>
            </div>
            <span className="text-muted-foreground">{formatDateTime(o.createdAt, timezone)}</span>
            <span className="break-words">{formatItems(o.items)}</span>
            <span className="font-medium">{formatPrice(o.totalCents)}</span>
            {canUserCancel(o.status) && <div className="pt-1">{cancelButton(o)}</div>}
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
        title={`Cancel order #${target}?`}
        description="The order will be cancelled. This cannot be undone."
        confirmLabel="Cancel order"
        keepLabel="Keep order"
        pending={pending}
        error={error}
        onConfirm={confirm}
      />
    </>
  );
}
