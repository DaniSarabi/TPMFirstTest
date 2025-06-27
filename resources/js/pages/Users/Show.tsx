import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
}

// 2. Define the props for this page. It receives the user object
//    and a list of the roles assigned to that user.
interface ShowUserProps {
    user: User;
    roles: string[]; // Let's assume you pass the user's roles as a string array
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User show',
        href: '/users',
    },
];

export default function Show({ user, roles }: ShowUserProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users show" />
            <div className="p-6">
                <Link href={route('users.index')} className="btn px-3 py-2 btn-md btn-primary">
                    Back
                </Link>

                <div>
                    <p>
                        <strong>Name:</strong>
                        {user.name}
                    </p>
                    <p>
                        <strong>Email:</strong>
                        {user.email}
                    </p>
                    <div className="mt-4">
                        <strong className="mb-2 block">Roles:</strong>
                        <div>
                            {roles.length > 0 ? (
                                roles.map((role) => (
                                    <span
                                        key={role} // Using the unique role name as the key
                                        className="mr-2 inline-block rounded bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                                    >
                                        {role}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">No roles assigned.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
