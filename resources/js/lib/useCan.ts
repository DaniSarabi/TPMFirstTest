// resources/js/lib/useCan.ts

import { usePage } from '@inertiajs/react';

export function useCan(permissionName: string): boolean {
    // ELIMINAMOS el <PageProps> y dejamos que TypeScript infiera el tipo.
    // Gracias a nuestro archivo inertia.d.ts, TypeScript ya sabe que
    // '.props' contiene un objeto 'auth' con 'permissions'.
    const { auth } = usePage().props;

    // Si pasas el cursor sobre 'auth', VS Code debería mostrarte
    // el tipo correcto: la interface Auth que definimos.
    return auth.permissions.includes(permissionName);
}

export default useCan;