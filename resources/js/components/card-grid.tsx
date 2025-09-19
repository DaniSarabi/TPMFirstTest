import { cn } from '@/lib/utils';
import * as React from 'react';

// Define the props for the generic grid component
// It now accepts an optional 'gridCols' prop to control the number of columns on extra-large screens.
interface CardGridProps<T> {
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  gridCols?: 2 | 3 | 4 | 5; // The number of columns for the 'xl' breakpoint
}

export function CardGrid<T extends { id: number | string }>({ items, renderCard, gridCols = 4 }: CardGridProps<T>) {
  // Display a message if no items are found
  if (!items || items.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>No items found.</p>
        <p className="text-sm">Try adjusting your search or filters.</p>
      </div>
    );
  }

  // ACTION: Dynamically determine the grid column class for the 'xl' breakpoint.
  // This approach is safe for Tailwind's PurgeCSS because the full class names are present in the code.
  const gridColClass = {
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    5: 'xl:grid-cols-5',
  }[gridCols];

  // Render the grid and use the renderCard function for each item
  return (
    <div className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-3', gridColClass)}>
      {items.map((item) => (
        <React.Fragment key={item.id}>{renderCard(item)}</React.Fragment>
      ))}
    </div>
  );
}
