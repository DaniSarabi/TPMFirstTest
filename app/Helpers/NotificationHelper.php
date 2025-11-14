<?php

namespace App\Helpers;

use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\URL;

class NotificationHelper
{
    /**
     * Genera una URL correcta para una notificación, 
     * detectando si está corriendo en la consola (queue) o en la web.
     *
     * @param string $name El nombre de la ruta (ej. 'tickets.show')
     * @param mixed $parameters Los parámetros (ej. $ticket->id)
     * @return string La URL absoluta y correcta.
     */
    public static function route(string $name, $parameters = []): string
    {
        // 1. Checa si estamos en la terminal (ej. 'php artisan queue:work')
        if (App::runningInConsole()) {

            if (App::environment(['staging', 'production'])) {

                // --- ¡LA VALIDACIÓN QUE PEDISTE! ---

                // 1. Generamos la URL base desde el APP_URL (ej. https://192.168.1.52/tpm-project-dev)
                $baseUrl = rtrim(config('app.url'), '/');

                // 2. Generamos la ruta relativa (ej. /tickets/18)
                $relativePath = route($name, $parameters, false);

                // 3. Revisamos si el APP_URL *ya* termina en /public (por un error de config)
                if (str_ends_with($baseUrl, '/public')) {
                    // Si ya lo tiene, solo pegamos el path
                    return $baseUrl . $relativePath;
                }

                // 4. Si no, lo añadimos nosotros
                return $baseUrl . '/public' . $relativePath;
            }

            // 5. Si es 'local' (tu compu/Herd), 
            // usamos el route() normal, que jala el APP_URL (maintenance.test).
            return route($name, $parameters);
        }

        // 4. Si NO estamos en la terminal (es una visita web normal),
        // usamos el 'route()' de siempre.
        return route($name, $parameters);
    }
}
