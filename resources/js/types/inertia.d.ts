// resources/js/types/inertia.d.ts

// Estas interfaces definen la forma de nuestros datos. Las exportamos para
// poder usarlas en otras partes de nuestra aplicación si es necesario.
export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Auth {
    user: User | null;
    permissions: string[];
}

// Este bloque es la clave. Le dice a TypeScript que en cualquier
// lugar del proyecto donde se encuentre con el módulo '@inertiajs/core',
// la interfaz PageProps TAMBIÉN incluye nuestras propiedades.
// NO la reemplaza, sino que FUSIONA las propiedades.
declare module '@inertiajs/core' {
    interface PageProps { // <-- Fíjate que aquí no usamos 'export'
        auth: Auth;
        // Aquí puedes agregar cualquier otra prop compartida globalmente
        // Por ejemplo, muchos añaden los datos de Ziggy para las rutas de Laravel:
        // ziggy: Ziggy;
    }
}

// OJO: No necesitamos el bloque "declare module '@inertiajs/react'"
// porque los tipos de React dependen de los de Core. Al arreglar Core,
// arreglamos todo lo demás.