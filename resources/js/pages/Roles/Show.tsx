import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

// 1. We can reuse this interface. It describes the shape of the role object.
interface Role {
    id: number;
    name: string;
}

// 2. Define the specific props for this Show page.
interface ShowRolePageProps {
    role: Role;
    permissions: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Role Show',
        href: '/roles',
    },
];

export default function Show({ role, permissions } : ShowRolePageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles Show" />
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
                            key="{permission}"
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
