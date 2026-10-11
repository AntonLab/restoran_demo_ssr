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
import { cancelOrderAction } from "@/app/account/orders/actions";
import { formatDateTime, formatPrice } from "@/lib/format";
import { canUserCancel, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { cancelFailureText, formatItems } from "@/lib/order-view";
import type { OrderRow } from "@/server/orders";

export function OrdersTable({ orders, timezone }: { orders: OrderRow[]; timezone: string }) {
  const { target, error, pending, open, onOpenChange, confirm } = useCancelDialog(
    cancelOrderAction,
    cancelFailureText,
    "Could not cancel the order. Try again.",
  );

  const cancelButton = (o: OrderRow) =>
    canUserCancel(o.status) && (
      <Button
        variant="outline"
        size="sm"
        aria-label={`Cancel order #${o.number}`}
        onClick={() => open(o.number)}
      >
        Cancel
      </Button>
    );

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
                <StatusBadge>{ORDER_STATUS_LABELS[o.status]}</StatusBadge>
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
              <StatusBadge>{ORDER_STATUS_LABELS[o.status]}</StatusBadge>
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
        onOpenChange={onOpenChange}
        title={target === null ? "" : `Cancel order #${target}?`}
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
