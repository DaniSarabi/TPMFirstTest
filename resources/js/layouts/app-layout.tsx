import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { type ReactNode, useEffect } from 'react';
import { Toaster, toast } from 'sonner';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

// We convert this to a standard function component to use hooks
export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    // --- ACTION 1: Get flash messages from the usePage hook ---
    const { props: pageProps } = usePage();
    // Provide a default empty object for flash to prevent the error
    const { success, error } = (pageProps.flash || {}) as { success?: string; error?: string };

    // --- ACTION 2: Use useEffect to watch for new messages and show toasts ---
    useEffect(() => {
        if (success) {
            toast.success(success);
        }
        if (error) {
            toast.error(error);
        }
    }, [success, error]); // This hook runs whenever the success or error messages change

    return (
        // We use a React Fragment (<>) to return multiple components
        <>
            {/* --- ACTION 3: Add the Toaster component --- */}
            {/* This component listens for toast() calls and displays the notifications */}
            <Toaster position="top-right" richColors closeButton />

            {/* Your original layout template remains unchanged */}
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
            </AppLayoutTemplate>
        </>
    );
}
