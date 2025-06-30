import { User } from '@/lib/data';
import { HeaderContext } from '@tanstack/react-table';
import { ArrowDownNarrowWide, ArrowUpWideNarrow } from 'lucide-react';
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuTrigger } from './ui/context-menu';

interface DefaultHeaderProps<T> {
    info: HeaderContext<User, T>;
    name: string;
}

export function DefaultHeader<T>({ info, name }: DefaultHeaderProps<T>) {
    const sorted = info.column.getIsSorted();
    const { table } = info;
    return (
        <ContextMenu>
            <ContextMenuTrigger
                onPointerDown={(e) => {
                    e.preventDefault();
                    if (e.button == 2) return; // Right click
                    info.column.toggleSorting(info.column.getIsSorted() === 'asc');
                }}
                className="flex h-full w-full items-center justify-start gap-2"
            >
                {name}
                {sorted === 'asc' && <ArrowDownNarrowWide />}
                {sorted === 'desc' && <ArrowUpWideNarrow />}
            </ContextMenuTrigger>
            <ContextMenuContent onCloseAutoFocus={(e) => e.preventDefault()} 
            onContextMenu={(e) => e.preventDefault()}>
                {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                        <ContextMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                            {column.id}
                        </ContextMenuCheckboxItem>
                    ))}
            </ContextMenuContent>
        </ContextMenu>
    );
}

export default DefaultHeader;
