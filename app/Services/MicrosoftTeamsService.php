<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class MicrosoftTeamsService
{
    public function sendMessage(string $teamsUserId, string $message)
    {
        $accessToken = $this->getAccessToken();

        $payload = [
            "topic" => [
                "source" => "text",
                "value" => "TPM Notification",
            ],
            "activityType" => "event",
            "previewText" => [
                "content" => $message,
            ],
            "recipient" => [
                "@odata.type" => "microsoft.graph.aadUserNotificationRecipient",
                "userId" => $teamsUserId,
            ],
        ];

        return Http::withToken($accessToken)
            ->post("https://graph.microsoft.com/v1.0/users/$teamsUserId/teamwork/sendActivityNotification", $payload)
            ->throw()
            ->json();
    }

    private function getAccessToken(): string
    {
        $response = Http::asForm()->post(
            "https://login.microsoftonline.com/" . env('MICROSOFT_TENANT_ID') . "/oauth2/v2.0/token",
            [
                "client_id" => env('MICROSOFT_BOT_APP_ID'),
                "client_secret" => env('MICROSOFT_BOT_APP_PASSWORD'),
                "scope" => "https://graph.microsoft.com/.default",
                "grant_type" => "client_credentials",
            ]
        );

        return $response->json()['access_token'];
    }
}
