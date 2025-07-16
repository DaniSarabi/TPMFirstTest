import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, User } from 'lucide-react';
import * as React from 'react';

// --- ACTION 1: Update the props to accept the new showUserFilter prop ---
interface InspectionFiltersProps {
    showUserFilter: boolean;
}

export function InspectionFilters({ showUserFilter }: InspectionFiltersProps) {
    return (
        <div className="flex items-center space-x-2">
            {/* Placeholder for Date Range Filter */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 border-dashed">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Filter by date
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    {/* A date picker component will go here in the future */}
                    <p className="p-4 text-sm text-muted-foreground">Date picker coming soon.</p>
                </PopoverContent>
            </Popover>

            {/* --- ACTION 2: Conditionally render the user filter button --- */}
            {/* This button will only be shown if the user has the correct permission. */}
            {showUserFilter && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 border-dashed">
                            <User className="mr-2 h-4 w-4" />
                            Filter by user
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        {/* A user selector component will go here in the future */}
                        <p className="p-4 text-sm text-muted-foreground">User filter coming soon.</p>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}
