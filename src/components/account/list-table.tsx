import type { ReactNode } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ListTable({
  headings,
  rows,
  cards,
}: {
  headings: string[];
  rows: ReactNode;
  cards: ReactNode;
}) {
  return (
    <>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            {headings.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{rows}</TableBody>
      </Table>
      <ul className="flex flex-col gap-3 md:hidden">{cards}</ul>
    </>
  );
}
