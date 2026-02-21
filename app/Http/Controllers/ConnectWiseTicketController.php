<?php

namespace App\Http\Controllers;

use App\Integrations\Providers\ConnectWiseProvider;
use App\Models\IntegrationClientMapping;
use App\Models\IntegrationConnection;
use Illuminate\Http\JsonResponse;

class ConnectWiseTicketController extends Controller
{
    public function lookup(int $ticketNumber): JsonResponse
    {
        $connection = IntegrationConnection::active()
            ->where('provider', IntegrationConnection::PROVIDER_CONNECTWISE)
            ->first();

        if (! $connection) {
            return response()->json(['error' => 'No active ConnectWise connection found.'], 404);
        }

        try {
            $provider = new ConnectWiseProvider();
            $ticket = $provider->fetchTicket($connection, $ticketNumber);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Ticket not found or ConnectWise error: '.$e->getMessage()], 404);
        }

        if (empty($ticket) || ! isset($ticket['id'])) {
            return response()->json(['error' => 'Ticket not found.'], 404);
        }

        // Map ConnectWise company → internal client via IntegrationClientMapping
        $clientId = null;
        $companyId = (string) data_get($ticket, 'company.id', '');
        if ($companyId !== '') {
            $mapping = IntegrationClientMapping::where('integration_connection_id', $connection->id)
                ->where('external_client_id', $companyId)
                ->where('is_active', true)
                ->first();

            if ($mapping) {
                $clientId = $mapping->client_id;
            }
        }

        // Map ConnectWise priority → our priority values
        $priorityName = strtolower((string) data_get($ticket, 'priority.name', ''));
        $priority = match (true) {
            str_contains($priorityName, 'critical') || str_contains($priorityName, '1') => 'critical',
            str_contains($priorityName, 'high')     || str_contains($priorityName, '2') => 'high',
            str_contains($priorityName, 'low')      || str_contains($priorityName, '4') => 'low',
            default                                                                      => 'medium',
        };

        return response()->json([
            'ticket_number'  => $ticket['id'],
            'summary'        => $ticket['summary'] ?? '',
            'description'    => $ticket['initialDescription'] ?? $ticket['description'] ?? '',
            'company_id'     => $companyId ?: null,
            'company_name'   => data_get($ticket, 'company.name'),
            'client_id'      => $clientId,
            'priority'       => $priority,
            'status'         => data_get($ticket, 'status.name'),
            'type'           => data_get($ticket, 'type.name'),
            'contact_name'   => data_get($ticket, 'contactName'),
        ]);
    }
}
