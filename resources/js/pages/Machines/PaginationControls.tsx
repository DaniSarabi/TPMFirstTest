import { cn } from '@/lib/utils';
import { type Link as LinkType } from '@/types';
import { Link } from '@inertiajs/react';

// Define the props for the pagination component
interface PaginationControlsProps {
  links: LinkType[];
}

export function PaginationControls({ links }: PaginationControlsProps) {
  // If there are only "Previous", "Next", and one page number, no need to render.
  if (links.length <= 3) {
    return null;
  }

  return (
    <div className="flex items-center justify-end space-x-1 py-4">
      {links.map((link, index) => (
        // --- ACTION: Use Inertia's <Link> component for each button ---
        // This is the standard and most robust way to handle pagination.
        <Link
          key={index}
          href={link.url || '#'}
          className={cn(
            'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
            link.active ? 'bg-primary text-primary-foreground shadow' : 'hover:bg-accent hover:text-accent-foreground',
            !link.url ? 'cursor-not-allowed opacity-50' : '',
          )}
          // The `as="button"` prop is for accessibility, but the element is a link.
          as="button"
          disabled={!link.url}
          // This is needed to correctly render the "«" and "»" symbols
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      ))}
    </div>
  );
}
