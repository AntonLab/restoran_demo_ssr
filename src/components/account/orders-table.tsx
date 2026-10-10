import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatItems } from "@/lib/order-view";
import type { OrderRow } from "@/server/orders";

const badge = "rounded-md bg-muted px-2 py-0.5 text-xs";

export function OrdersTable({ orders, timezone }: { orders: OrderRow[]; timezone: string }) {
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
          </li>
        ))}
      </ul>
    </>
  );
}
