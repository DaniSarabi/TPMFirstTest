import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import React from 'react';
import { getColumns, Role } from './Columns'; // The new user-specific columns function

interface ShowRolePageProps {
  roles: Role[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Roles',
    href: '/roles',
  },
];

export default function Index({ roles }: ShowRolePageProps) {
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

  // Generate the columns array by calling the function
  // This allows us to pass the permissions and delete handler to the columns
  const columns = React.useMemo(() => getColumns(can, handleDelete), [can]);

  // This variable will hold the "Create User" button if the user has permission,
  // otherwise it will be null.
  const toolbarAction = can.create ? (
    <Button asChild variant="default" className="" size="lg">
      {/* 2. Add flex utilities to the Link to align and space its content */}
      <Link href={route('roles.create')} className="flex items-center gap-2">
        <PlusCircle className="h-4 w-4" /> {/* 3. Add the icon... */}
        Create Role {/* 4. ...and the text */}
      </Link>
    </Button>
  ) : null;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Roles" />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Roles</h1>
        </div>
        {/* Render the DataTable component */}
        <DataTable columns={columns} data={roles} filterColumnId="name" filterPlaceholder="Filter by name..." toolbarAction={toolbarAction} />
      </div>
    </AppLayout>
  );
}
