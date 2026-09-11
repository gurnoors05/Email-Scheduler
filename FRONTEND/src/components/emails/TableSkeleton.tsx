import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

const WIDTHS = ["w-48", "w-64", "w-32", "w-24"];

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {WIDTHS.map((w) => (
            <TableCell key={w}>
              <Skeleton className={`h-4 ${w} max-w-full`} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
