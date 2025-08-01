import { DataTable } from '@/components/data-table';
import { DataTableViewOptions } from '@/components/data-table-view-options';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import AppLayout from '@/layouts/app-layout';
import GeneralSettingsLayout from '@/layouts/general-settings-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem, type Filter, type Paginated } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { PlusCircle } from 'lucide-react';
import * as React from 'react';
import { EmailContact, getColumns } from './Columns';
import { EmailContactFormModal } from './EmailContactFormModal';

// Define the props for the page
interface IndexPageProps {
  contacts: Paginated<EmailContact>;
  filters: Filter & { sort?: string; direction?: 'asc' | 'desc' };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'General Settings',
    href: route('settings.machine-status.index'),
  },
  {
    title: 'Email Contacts',
    href: route('settings.email-contacts.index'),
    isCurrent: true,
  },
];

export default function Index({ contacts, filters }: IndexPageProps) {
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [contactToEdit, setContactToEdit] = React.useState<Partial<EmailContact> | null>(null);
  const [contactToDelete, setContactToDelete] = React.useState<EmailContact | null>(null);

  const [search, setSearch] = React.useState(filters.search || '');
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(
    filters.sort ? { id: filters.sort, desc: filters.direction === 'desc' } : null,
  );

  const isInitialMount = React.useRef(true);

  const form = useForm({
    name: '',
    email: '',
    department: '',
  });

  const can = {
    create: useCan('machines.edit'),
    edit: useCan('machines.edit'),
    delete: useCan('machines.edit'),
  };

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      router.get(
        route('settings.email-contacts.index'),
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

  const handleCreate = () => {
    form.reset();
    setContactToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (contact: EmailContact) => {
    form.setData({
      name: contact.name,
      email: contact.email,
      department: contact.department,
    });
    setContactToEdit(contact);
    setIsFormModalOpen(true);
  };

  const handleDelete = (contact: EmailContact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!contactToDelete) return;
    router.delete(route('settings.email-contacts.destroy', contactToDelete.id), {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const onSuccess = () => setIsFormModalOpen(false);
    if (contactToEdit && 'id' in contactToEdit) {
      form.put(route('settings.email-contacts.update', contactToEdit.id!), { onSuccess });
    } else {
      form.post(route('settings.email-contacts.store'), { onSuccess });
    }
  };

  const columns = React.useMemo(() => getColumns(handleEdit, handleDelete, handleSort, sort), [sort]);

  const table = useReactTable({
    data: contacts.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <GeneralSettingsLayout>
        <Head title="Email Contacts" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Email Contacts</h1>
              <p className="text-muted-foreground">Manage the contact list for email notifications.</p>
            </div>
          </div>

          <ListToolbar
            onSearch={setSearch}
            searchPlaceholder="Filter by name, email, or department..."
            createAction={
              can.create ? (
                <Button onClick={handleCreate}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              ) : null
            }
            viewOptionsAction={<DataTableViewOptions table={table} />}
          />

          <DataTable table={table} columns={columns} />

          <Pagination paginated={contacts} />
        </div>

        <EmailContactFormModal
          isOpen={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          onSubmit={handleSubmit}
          contact={contactToEdit}
          data={form.data}
          setData={form.setData}
          errors={form.errors}
          processing={form.processing}
        />
        <ConfirmDeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Delete Contact"
          description="Are you sure you want to delete this contact? This action cannot be undone."
        />
      </GeneralSettingsLayout>
    </AppLayout>
  );
}
