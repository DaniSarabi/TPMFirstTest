import { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// --- ACTION 1: Simplify the props ---
// The component now receives the current sort state and an onSort callback.
interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
  onSort: (columnId: string, direction: 'asc' | 'desc' | null) => void;
  currentSort: { id: string; desc: boolean } | null;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  onSort,
  currentSort,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const isSorted = currentSort?.id === column.id;
  const isDesc = isSorted && currentSort?.desc;

  // --- ACTION 2: Simplify the click handler ---
  // This now cycles through 'asc', 'desc', and 'none'.
  const handleClick = () => {
    if (!isSorted) {
        onSort(column.id, 'asc');
    } else if (!isDesc) {
        onSort(column.id, 'desc');
    } else {
        onSort(column.id, null); // Clear the sort
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
        {/* --- ACTION 3: Remove the DropdownMenu --- */}
        {/* The button now directly handles the sort click. */}
        <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent uppercase font-bold text-md tracking-wider"
            onClick={handleClick}
        >
            <span>{title}</span>
            {isDesc ? (
                <ArrowDown className="ml-2 h-4 w-4" />
            ) : isSorted ? (
                <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
        </Button>
    </div>
  )
}
