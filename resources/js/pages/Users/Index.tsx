import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {can} from '@/lib/can';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
];

export default function Index({ users }) {
    function handleDelete(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(route('users.destroy', id));
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="p-6">
                {can('users.create') && <Link href={route('users.create')} className="btn px-3 py-2 btn-md btn-primary">
                    Create
                    {/* //TODO: Pass the create logic to a modal > example: https://flowbite.com/blocks/application/crud/ */}
                </Link>}
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
                                    Email
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Roles
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(({ id, name, email, roles }) => (
                                <tr className="border-b border-gray-200 odd:bg-white even:bg-gray-50 dark:border-gray-700 odd:dark:bg-gray-900 even:dark:bg-gray-800">
                                    <td className="px-6 py-2 font-medium text-gray-900 dark:text-white">{id}</td>
                                    <td className="px-6 py-2 text-gray-600 dark:text-gray-300">{name}</td>
                                    <td className="px-6 py-2 text-gray-600 dark:text-gray-300">{email}</td>
                                    <td className="px-6 py-2 text-gray-600 dark:text-gray-300">
                                        {roles.map((role)=>
                                        <span
                                            key="1"
                                            className="mr-1 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300"
                                        >
                                            {role.name}
                                        </span>
                                        )}
                                    </td>
                                    <td className="flex justify-normal gap-x-4 px-6 py-2">
                                        {/** //TODO Actions buttons to dropdown menu  */}
                                        <Link href={route('users.show', id)} className="btn px-3 py-2 btn-md btn-neutral">
                                            Show
                                        </Link>

                                        {can('users.edit') && <Link href={route('users.edit', id)} className="btn px-3 py-2 btn-md btn-primary">
                                            Edit
                                        </Link>}
                                        {can('users.delete') && <button onClick={() => handleDelete(id)} className="btn px-3 py-2 btn-md btn-secondary">
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
