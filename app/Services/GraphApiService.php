<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\RequestException;

/**
 * Servicio para manejar todas las comunicaciones con la API de Microsoft Graph.
 * (El "Camión de Reparto" para SharePoint/Power Automate)
 */
class GraphApiService
{
    private string $clientId;
    private string $clientSecret;
    private string $tenantId;
    private string $siteId;
    private string $listId;

    public function __construct()
    {
        $this->clientId = config('services.microsoft_graph.client_id');
        $this->clientSecret = config('services.microsoft_graph.client_secret');
        $this->tenantId = config('services.microsoft_graph.tenant_id');
        $this->siteId = config('services.microsoft_graph.site_id');
        $this->listId = config('services.microsoft_graph.list_id');
    }

    /**
     * Crea un item en la lista de SharePoint para disparar el Flow de Power Automate.
     */
    public function createNotification(string $title, string $message, string $userEmail): bool
    {
        $url = "https://graph.microsoft.com/v1.0/sites/{$this->siteId}/lists/{$this->listId}/items";
        $payload = [
            'fields' => [
                'Title' => $title,
                'Message' => $message,
                'UserEmail' => $userEmail,
                'Status' => 'New',
            ]
        ];

        try {
            // Intento 1: Usar el token de la caché
            $token = $this->getAccessToken();
            if (!$token) return false; // No se pudo obtener el token

            $response = Http::withToken($token)->post($url, $payload);
            $response->throw(); // Lanza una excepción si no es 2xx

            return $response->successful();
        } catch (RequestException $e) {

            // --- ¡TU LÓGICA DE REINTENTO (Retry)! ---
            // Si el error fue '401 Unauthorized', el token expiró.
            if ($e->response->status() == 401) {
                Log::warning('Graph API token expired. Forgetting cache and retrying ONCE.');

                // 1. Borramos el token viejo de la caché
                Cache::forget('ms_graph_access_token');

                // 2. Pedimos uno nuevo (forzando la regeneración)
                $newToken = $this->getAccessToken();
                if (!$newToken) return false; // Falló al obtener el nuevo token

                try {
                    // 3. Reintentamos la llamada UNA SOLA VEZ
                    $retryResponse = Http::withToken($newToken)->post($url, $payload);
                    $retryResponse->throw();
                    return $retryResponse->successful();
                } catch (RequestException $e2) {
                    // Si falla en el reintento, ya no hay nada que hacer.
                    Log::error('Graph API Error (on retry): ' . $e2->getMessage());
                    return false;
                }
            }

            // Fue un error diferente a 401 (ej. 404, 500, etc.)
            Log::error('Graph API Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtiene un token de acceso de la API de Graph, usando la caché.
     */
    public function getAccessToken(): ?string
    {
        // --- ¡TU LÓGICA DE CACHÉ INTELIGENTE! ---
        // Pedimos un token de 1h (3600s) pero lo guardamos solo 3500s.
        return Cache::remember('ms_graph_access_token', 3500, function () {

            $url = "https://login.microsoftonline.com/{$this->tenantId}/oauth2/v2.0/token";

            try {
                $response = Http::asForm()->post($url, [
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'scope' => 'https://graph.microsoft.com/.default',
                    'grant_type' => 'client_credentials',
                ]);

                $response->throw(); // Lanza error si falla

                return $response->json('access_token');
            } catch (\Exception $e) {
                Log::error('Error fetching Graph API token: ' . $e->getMessage());
                return null;
            }
        });
    }
}
