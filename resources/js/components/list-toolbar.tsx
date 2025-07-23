import { Input } from '@/components/ui/input';
import * as React from 'react';

// Define the props for the generic toolbar
interface ListToolbarProps {
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  createAction?: React.ReactNode;
  children?: React.ReactNode; // For any additional filter components
  viewOptionsAction?: React.ReactNode; // The new optional prop for the view options
}

export function ListToolbar({ onSearch, searchPlaceholder = 'Search...', createAction, children, viewOptionsAction }: ListToolbarProps) {
  return (
    <div className="flex items-center justify-between drop-shadow-lg">
      <div className="flex flex-1 items-center space-x-2 ">
        {/* Conditionally render the search input only if onSearch is provided */}
        {onSearch && <Input placeholder={searchPlaceholder} className="h-9  max-w-sm border-ring " onChange={(e) => onSearch(e.target.value)} />}
        {/* This is where we will render the status filter */}
        {children}
      </div>
      {/* This is where the "Create" button will go */}
      <div className="flex items-center space-x-2">
        {createAction}
        {viewOptionsAction}
      </div>
    </div>
  );
}
