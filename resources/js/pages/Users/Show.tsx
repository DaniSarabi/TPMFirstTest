import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User show',
        href: '/users',
    },
];

export default function Edit( {user}) {

    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users show" />
            <div className="p-6">
                <Link href={route('users.index')} className="btn px-3 py-2 btn-md btn-primary">
                    Back
                </Link>

                <div>
                    <p>
                        <strong>
                            Name: 
                        </strong>
                        {user.name}
                    </p>
                    <p>
                        <strong>
                            Email: 
                        </strong>
                        {user.email}
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
