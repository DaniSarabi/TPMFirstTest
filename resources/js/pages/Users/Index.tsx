import { DataTable } from '@/components/data-table';
import { DataTableViewOptions } from '@/components/data-table-view-options';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem, type Filter, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { PlusCircle } from 'lucide-react';
import * as React from 'react';
import { getColumns, User } from './columns';

// Define the props for the Index page
interface IndexPageProps {
  users: Paginated<User>;
  filters: Filter & { sort?: string; direction?: 'asc' | 'desc' };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Users',
    href: route('users.index'),
    isCurrent: true,
  },
];

export default function Index({ users, filters }: IndexPageProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  // --- Add state for sorting ---
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(
    filters.sort ? { id: filters.sort, desc: filters.direction === 'desc' } : null,
  );

  const isInitialMount = React.useRef(true);

  const can = {
    create: useCan('users.create'),
    edit: useCan('users.edit'),
    delete: useCan('users.delete'),
  };

  function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      router.delete(route('users.destroy', id));
    }
  }

  // --- Update the useEffect to handle sorting ---
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      router.get(
        route('users.index'),
        {
          search,
          sort: sort?.id,
          direction: sort?.desc ? 'desc' : 'asc',
        },
        { preserveState: true, replace: true },
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
    data: users.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Users" />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between ">
          <h1 className="text-2xl font-bold">Users</h1>
        </div>

        <ListToolbar
          onSearch={setSearch}
          searchPlaceholder="Filter by name or email..."
          createAction={
            can.create ? (
              <Button asChild>
                <Link href={route('users.create')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create User
                </Link>
              </Button>
            ) : null
          }
          viewOptionsAction={<DataTableViewOptions table={table} />}
        />
        <DataTable table={table} columns={columns} />
        <Pagination paginated={users} />
      </div>
    </AppLayout>
  );
}
