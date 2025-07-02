import { DataTable } from '@/components/data-table'; // Your reusable component
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import * as React from 'react';
import { getColumns, User } from './columns'; // The new user-specific columns function

// Define the props for the Index page
interface IndexPageProps {
  users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Users',
    href: route('users.index'),
  },
];

export default function Index({ users }: IndexPageProps) {
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

  // Generate the columns array by calling the function
  // This allows us to pass the permissions and delete handler to the columns
  const columns = React.useMemo(() => getColumns(can, handleDelete), [can]);

  // This variable will hold the "Create User" button if the user has permission,
  // otherwise it will be null.
  const toolbarAction = can.create ? (
    <Button asChild variant="secondary" className='text-white' size="lg">
      {/* 2. Add flex utilities to the Link to align and space its content */}
      <Link href={route('users.create')} className="flex items-center gap-2">
        <PlusCircle className="h-4 w-4" /> {/* 3. Add the icon... */}
        Create User {/* 4. ...and the text */}
      </Link>
    </Button>
  ) : null;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Users" />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users</h1>
        </div>

        {/* Render the DataTable component */}
        <DataTable columns={columns} data={users} filterColumnId="email" filterPlaceholder="Filter by email..." toolbarAction={toolbarAction} />
      </div>
    </AppLayout>
  );
}
