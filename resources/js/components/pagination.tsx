import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Paginated } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import * as React from 'react';

// Define the props for the pagination component
interface PaginationProps {
    paginated: Paginated<any>;
    perPageKey?: string;
}

export function Pagination({ paginated, perPageKey = 'per_page' }: PaginationProps) {
    const { url } = usePage();
    
    const getUrlWithPreservedQuery = (newUrl: string) => {
        const currentUrl = new URL(window.location.href);
        const nextUrl = new URL(newUrl);
        currentUrl.searchParams.forEach((value, key) => {
            if (key !== 'page') {
                nextUrl.searchParams.set(key, value);
            }
        });
        return nextUrl.href;
    };

    const handleVisit = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const onPerPageChange = (perPage: string) => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set(perPageKey, perPage);
        currentUrl.searchParams.delete('page'); // Go back to page 1
        handleVisit(currentUrl.href);
    };

    return (
        <div className="flex items-center justify-between px-2 mt-2">
            <div className="flex-1 text-sm text-muted-foreground">
                Showing {paginated.from} to {paginated.to} of {paginated.total} results.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select value={`${paginated.per_page}`} onValueChange={onPerPageChange}>
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={paginated.per_page} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[12, 24, 36, 48].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {paginated.current_page} of {paginated.last_page}
                </div>
                <div className="flex items-center space-x-2">
                    {/* ACTION: Cast URLs to string to satisfy TypeScript */}
                    <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => handleVisit(String(paginated.first_page_url))} disabled={!paginated.prev_page_url}>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => handleVisit(String(paginated.prev_page_url))} disabled={!paginated.prev_page_url}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => handleVisit(String(paginated.next_page_url))} disabled={!paginated.next_page_url}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => handleVisit(String(paginated.last_page_url))} disabled={!paginated.next_page_url}>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

