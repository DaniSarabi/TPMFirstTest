import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem, type Paginated, type Filter } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import * as React from 'react';
import { getColumns, Role } from './Columns';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { DataTableViewOptions } from '@/components/data-table-view-options';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

interface ShowRolePageProps {
  roles: Role[];
}
interface IndexPageProps {
    roles: Paginated<Role>;
    filters: Filter & { sort?: string; direction?: 'asc' | 'desc' };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Roles',
    href: '/roles',
  },
];

export default function Index({ roles, filters }: IndexPageProps) {
    const [search, setSearch] = React.useState(filters.search || '');
    const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(
        filters.sort ? { id: filters.sort, desc: filters.direction === 'desc' } : null
    );

    const isInitialMount = React.useRef(true);

    const can = {
        create: useCan('roles.create'),
        edit: useCan('roles.edit'),
        delete: useCan('roles.delete'),
    };

    function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this role?')) {
            router.delete(route('roles.destroy', id));
        }
    }

    React.useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const timeout = setTimeout(() => {
            router.get(
                route('roles.index'),
                {
                    search,
                    sort: sort?.id,
                    direction: sort?.desc ? 'desc' : 'asc',
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, sort]);

    const handleSort = (columnId: string, direction: 'asc' | 'desc' | null) => {
        if (direction === null) {
            setSort(null);
        } else {
            setSort({ id: columnId, desc: direction === 'desc' });
        }
    };

    const columns = React.useMemo(() => getColumns(can, handleDelete, handleSort, sort), [can, sort]);

    const table = useReactTable({
        data: roles.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <div className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Roles</h1>
                </div>

                <ListToolbar
                    onSearch={setSearch}
                    searchPlaceholder="Filter by name..."
                    createAction={
                        can.create ? (
                            <Button asChild className='drop-shadow-lg'>
                                <Link href={route('roles.create')}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create Role
                                </Link>
                            </Button>
                        ) : null
                    }
                    viewOptionsAction={<DataTableViewOptions table={table} />}
                />
                
                <DataTable table={table} columns={columns} />
                
                <Pagination paginated={roles} />
            </div>
        </AppLayout>
    );
}