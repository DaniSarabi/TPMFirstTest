import AppLayout from '@/layouts/app-layout';
import { can } from '@/lib/can';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: '/roles',
    },
];

export default function Index({ roles }) {
    function handleDelete(id) {
        if (confirm('Are you sure you want to delete this role?')) {
            router.delete(route('roles.destroy', id));
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <div className="p-6">
                {can('roles.create') && (
                    <Link href={route('roles.create')} className="btn px-3 py-2 btn-md btn-primary">
                        Create
                        {/* //TODO: Pass the create logic to a modal > example: https://flowbite.com/blocks/application/crud/ */}
                    </Link>
                )}
                <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 rtl:text-right dark:text-gray-400">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    ID
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Permissions
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(({ id, name, permissions }) => (
                                <tr className="border-b border-gray-200 odd:bg-white even:bg-gray-50 dark:border-gray-700 odd:dark:bg-gray-900 even:dark:bg-gray-800">
                                    <td className="px-6 py-2 font-medium text-gray-900 dark:text-white">{id}</td>
                                    <td className="px-6 py-2 text-gray-600 dark:text-gray-300">{name}</td>
                                    {/* {//* ************** BADGES **************} */}
                                    <td className="px-6 py-2 text-gray-600 dark:text-gray-300">
                                        {permissions.map((permission) => (
                                            <span
                                                key="1"
                                                className="mr-1 rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300"
                                            >
                                                {permission.name}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="flex justify-normal gap-x-4 px-6 py-2">
                                        {/** //TODO Actions buttons to dropdown menu  */}
                                        <Link href={route('roles.show', id)} className="btn px-3 py-2 btn-md btn-neutral">
                                            Show
                                        </Link>

                                        {can('roles.edit') && (
                                            <Link href={route('roles.edit', id)} className="btn px-3 py-2 btn-md btn-primary">
                                                Edit
                                            </Link>
                                        )}
                                        {can('roles.delete') && <button onClick={() => handleDelete(id)} className="btn px-3 py-2 btn-md btn-secondary">
                                            Delete
                                        </button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
