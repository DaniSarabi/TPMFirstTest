import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Role Show',
        href: '/roles',
    },
];

export default function Edit({ role, permissions }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles Edit" />
            <div className="p-6">
                <Link href={route('roles.index')} className="btn px-3 py-2 btn-md btn-primary">
                    Back
                </Link>

                <div>
                    <p>
                        <strong>Name:</strong>
                        {role.name}
                    </p>
                    <p>
                        <strong>Permissions:</strong>
                    </p>
                    {permissions.map((permission) => (
                        <span
                            key="1"
                            className="mr-1 rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300"
                        >
                            {permission}
                        </span>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
