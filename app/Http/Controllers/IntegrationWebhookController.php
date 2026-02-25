<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessIntegrationWebhookEventJob;
use App\Models\IntegrationConnection;
use App\Models\IntegrationWebhookEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class IntegrationWebhookController extends Controller
{
    public function handle(Request $request, IntegrationConnection $integration): JsonResponse
    {
        $secret = $this->resolveWebhookSecret($integration);
        if (!$secret) {
            return response()->json([
                'message' => 'Webhook not enabled for this integration.',
            ], 403);
        }

        $incomingToken = $this->resolveIncomingToken($request);
        if (!$incomingToken || !hash_equals($secret, $incomingToken)) {
            return response()->json([
                'message' => 'Invalid webhook token.',
            ], 401);
        }

        $payload = $request->all();
        $headers = collect($request->headers->all())
            ->map(fn ($values) => is_array($values) ? implode(',', $values) : (string) $values)
            ->all();

        $event = IntegrationWebhookEvent::create([
            'integration_connection_id' => $integration->id,
            'provider' => $integration->provider,
            'event_type' => (string) (
                Arr::get($payload, 'event_type')
                ?? Arr::get($payload, 'eventType')
                ?? Arr::get($payload, 'type')
                ?? 'unknown'
            ),
            'external_event_id' => (string) (
                Arr::get($payload, 'event_id')
                ?? Arr::get($payload, 'eventId')
                ?? Arr::get($payload, 'id')
                ?? ''
            ),
            'headers' => $headers,
            'payload' => $payload,
            'status' => IntegrationWebhookEvent::STATUS_RECEIVED,
            'received_at' => now(),
        ]);

        ProcessIntegrationWebhookEventJob::dispatch($event->id);

        return response()->json([
            'message' => 'Webhook accepted.',
            'event_id' => $event->id,
        ], 202);
    }

    private function resolveWebhookSecret(IntegrationConnection $integration): ?string
    {
        $fromSettings = data_get($integration->settings, 'webhook_secret');

        return $integration->webhook_secret
            ?? (is_string($fromSettings) && $fromSettings !== '' ? $fromSettings : null);
    }

    private function resolveIncomingToken(Request $request): ?string
    {
        // Only accept tokens from headers to avoid secret exposure in server logs/URLs
        $token = $request->header('X-Webhook-Token')
            ?? $request->header('X-Integration-Token');

        if (!is_string($token) || $token === '') {
            return null;
        }

        return $token;
    }
}
