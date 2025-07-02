
import { DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { data } from '@/lib/data';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { columns } from './columns';


// Define the breadcrumbs for your page layout
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Test',
    href: '/TestTable',
  },
];




// The main page component
export default function TestTable() {


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Users" />
      <div className="p-6">
        
        <div>
          <DataTable columns={columns} data={data} filterColumnId='email' filterPlaceholder='Filter by email...' />
        </div>





      </div>
    </AppLayout>
  );
}
