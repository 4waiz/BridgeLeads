import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-panel-2",
        className
      )}
    />
  );
}

export function LeadCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-border bg-panel space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="p-3"><Skeleton className="h-4 w-28" /></td>
      <td className="p-3"><Skeleton className="h-4 w-24" /></td>
      <td className="p-3"><Skeleton className="h-4 w-36" /></td>
      <td className="p-3"><Skeleton className="h-4 w-20" /></td>
      <td className="p-3"><Skeleton className="h-5 w-16 rounded-md" /></td>
    </tr>
  );
}
