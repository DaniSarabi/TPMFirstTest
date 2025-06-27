import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';

interface Role{
    id: number;
    name: string;
}

interface EditRolePageProps {
    role: Role;
    rolePermissions: string[];
    permissions: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Role Edit',
        href: '/roles',
    },
];

export default function Edit({role,rolePermissions, permissions }:EditRolePageProps ) {
    const { data, setData, errors, put } = useForm({
        name: role.name || "",
        permissions: rolePermissions || [],
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('roles.update', role.id));
    }

    function handleCheckboxChange(permissionName: string, checked: boolean): void {
        if(checked){
            setData("permissions",[...data.permissions, permissionName]);
        }
        else{
            setData("permissions", data.permissions.filter(name=> name!== permissionName));
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles Edit" />
            <div className="p-6">
                <Link href={route('roles.index')} className="btn px-3 py-2 btn-md btn-primary">
                    Back
                </Link>

                <form onSubmit={submit} className="mx-auto mt-4 max-w-md space-y-6">
                    {/*//* *********Input Name*********  */}
                    <div className="grid gap-2">
                        <label
                            htmlFor="name"
                            className="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                        >
                            Name:
                        </label>
                        <input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            name="name"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Enter role name"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    {/*//* *********Input Check Permissions*********  */}
                    <div className="grid gap-2">
                        <label
                            htmlFor="permissions"
                            className="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                        >
                            Permissions:
                        </label>
                        {permissions.map((permission) => (
                            <label key={permission} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value={permission}
                                    checked={data.permissions.includes(permission)}
                                    onChange={(e) => handleCheckboxChange(permission,e.target.checked)}
                                    id={permission}
                                    className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-800 capitalize">{permission}</span>
                            </label>
                        ))}
                        {errors.permissions && <p className="mt-1 text-sm text-red-500">{errors.permissions}</p>}
                    </div>

                    <button type="submit" className="rounded-md bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700">
                        Submit
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}
