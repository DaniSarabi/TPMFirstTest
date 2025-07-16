import * as React from 'react';

// Define the props for the generic grid component
// It uses a generic type 'T' to be able to handle any kind of data (machines, inspections, etc.)
interface CardGridProps<T> {
  items: T[];
  renderCard: (item: T) => React.ReactNode;
}

export function CardGrid<T extends { id: number | string }>({ items, renderCard }: CardGridProps<T>) {
  // Display a message if no items are found
  if (!items || items.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>No items found.</p>
        <p className="text-sm">Try adjusting your search or filters.</p>
      </div>
    );
  }

  // Render the grid and use the renderCard function for each item
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <React.Fragment key={item.id}>{renderCard(item)}</React.Fragment>
      ))}
    </div>
  );
}
