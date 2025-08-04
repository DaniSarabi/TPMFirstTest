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
  const { props: pageProps } = usePage();
  const flash = pageProps.flash as { success?: string; error?: string };

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]); // This hook runs whenever the success or error messages change

  return (
    <>
      <Toaster expand={false} position="top-center" richColors closeButton />
      <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
      </AppLayoutTemplate>
    </>
  );
}
