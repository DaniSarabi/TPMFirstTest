import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface EditUserProps {
    user: User;
    userRoles: string[];
    roles: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User edit',
        href: '/users',
    },
];

export default function Edit({ user, userRoles, roles }: EditUserProps) {
    
    const { data, setData, errors, put } = useForm<{
        name: string;
        email: string;
        password: string; // Password can be empty, so it's a string
        roles: string[];
    }>({
        name: user.name || '',
        email: user.email || '',
        password: '',
        roles: userRoles || [],
    });
    function handleCheckboxChange(roleName: string, checked: boolean) {
        if (checked) {
            setData('roles', [...data.roles, roleName]);
        } else {
            setData(
                'roles',
                data.roles.filter((name) => name !== roleName),
            );
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('users.update', user.id));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users edit" />
            <div className="p-6">
                <Link href={route('users.index')} className="btn px-3 py-2 btn-md btn-primary">
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
                            placeholder="Enter your name"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    {/*//* *********Input Email*********  */}

                    <div className="grid gap-2">
                        <label
                            htmlFor="email"
                            className="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                        >
                            Email:
                        </label>
                        <input
                            id="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            name="email"
                            type="email"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Enter your email"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                    </div>

                    {/*//* *********Input Password*********  */}

                    <div className="grid gap-2">
                        <label
                            htmlFor="password"
                            className="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                        >
                            Password:
                        </label>
                        <input
                            id="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            name="password"
                            type="password"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Enter your password"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                    </div>
                    {/*//* *********Input roles*********  */}

                    <div className="grid gap-2">
                        <label
                            htmlFor="roles"
                            className="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                        >
                            Roles:
                        </label>
                        {roles.map((role) => (
                            <label key={role} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value={role}
                                    checked={data.roles.includes(role)}
                                    onChange={(e) => handleCheckboxChange(role, e.target.checked)}
                                    id={role}
                                    className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-800 capitalize">{role}</span>
                            </label>
                        ))}
                        {errors.roles && <p className="mt-1 text-sm text-red-500">{errors.roles}</p>}
                    </div>

                    {/*//* *********End Input roles*********  */}
                    <button type="submit" className="rounded-md bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700">
                        Submit
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}
