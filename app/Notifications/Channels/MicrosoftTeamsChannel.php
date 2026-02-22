<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MicrosoftTeamsChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        $webhookUrl = config('services.microsoft.teams_webhook_url');

        if (empty($webhookUrl)) {
            return;
        }

        if (!method_exists($notification, 'toTeams')) {
            return;
        }

        $card = $notification->toTeams($notifiable);

        try {
            Http::post($webhookUrl, $card);
        } catch (\Throwable $e) {
            Log::warning('Failed to send Microsoft Teams notification', [
                'notification' => get_class($notification),
                'error' => $e->getMessage(),
            ]);
        }
    }
}
