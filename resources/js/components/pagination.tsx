import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Paginated } from '@/types';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// Define the props for the pagination component
// It now expects the full paginated object from Laravel
interface PaginationProps {
  paginated: Paginated<any>;
}

export function Pagination({ paginated }: PaginationProps) {
  // A function to handle changing the number of items per page
  const onPerPageChange = (perPage: string) => {
    router.get(
      paginated.path,
      { per_page: perPage },
      {
        preserveState: true,
        replace: true,
      },
    );
  };

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        Showing {paginated.from} to {paginated.to} of {paginated.total} results.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select value={`${paginated.per_page}`} onValueChange={(value) => onPerPageChange(value)}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={paginated.per_page} />
            </SelectTrigger>
            <SelectContent side="top">
              {[12, 24, 36, 48].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {paginated.current_page} of {paginated.last_page}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => router.get(paginated.first_page_url)}
            disabled={!paginated.prev_page_url}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-8 w-8 p-0" onClick={() => router.get(paginated.prev_page_url)} disabled={!paginated.prev_page_url}>
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-8 w-8 p-0" onClick={() => router.get(paginated.next_page_url)} disabled={!paginated.next_page_url}>
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => router.get(paginated.last_page_url)}
            disabled={!paginated.next_page_url}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
