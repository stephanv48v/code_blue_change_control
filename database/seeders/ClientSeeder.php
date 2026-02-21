<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\ClientContact;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get an account manager
        $accountManager = User::role(['Super Admin', 'MSP Admin'])->first();

        // Create sample clients
        $clients = [
            [
                'name' => 'Acme Corporation',
                'industry' => 'Manufacturing',
                'city' => 'Auckland',
                'country' => 'NZ',
                'phone' => '+64 9 123 4567',
                'website' => 'https://acme.example.com',
                'is_active' => true,
            ],
            [
                'name' => 'TechStart NZ',
                'industry' => 'Technology',
                'city' => 'Wellington',
                'country' => 'NZ',
                'phone' => '+64 4 234 5678',
                'website' => 'https://techstart.example.com',
                'is_active' => true,
            ],
            [
                'name' => 'HealthCare Plus',
                'industry' => 'Healthcare',
                'city' => 'Christchurch',
                'country' => 'NZ',
                'phone' => '+64 3 345 6789',
                'is_active' => true,
            ],
            [
                'name' => 'Global Logistics Ltd',
                'industry' => 'Logistics',
                'city' => 'Hamilton',
                'country' => 'NZ',
                'phone' => '+64 7 456 7890',
                'is_active' => false,
            ],
        ];

        foreach ($clients as $clientData) {
            $client = Client::create(array_merge($clientData, [
                'account_manager_id' => $accountManager?->id,
            ]));

            // Create contacts for each client
            $this->createContactsForClient($client);
        }

        $this->command->info('Sample clients and contacts seeded successfully.');
    }

    /**
     * Create sample contacts for a client.
     */
    private function createContactsForClient(Client $client): void
    {
        $contacts = [
            [
                'first_name' => 'John',
                'last_name' => 'Smith',
                'email' => 'john.smith@example.com',
                'job_title' => 'IT Manager',
                'department' => 'Information Technology',
                'is_primary_contact' => true,
                'is_approver' => true,
                'is_active' => true,
            ],
            [
                'first_name' => 'Sarah',
                'last_name' => 'Johnson',
                'email' => 'sarah.johnson@example.com',
                'job_title' => 'Operations Director',
                'department' => 'Operations',
                'is_primary_contact' => false,
                'is_approver' => true,
                'is_active' => true,
            ],
            [
                'first_name' => 'Michael',
                'last_name' => 'Brown',
                'email' => 'michael.brown@example.com',
                'job_title' => 'Network Administrator',
                'department' => 'IT Support',
                'is_primary_contact' => false,
                'is_approver' => false,
                'is_active' => true,
            ],
        ];

        foreach ($contacts as $contactData) {
            // Generate unique email for each client
            $contactData['email'] = strtolower(
                $contactData['first_name'] . '.' . $contactData['last_name'] . 
                '@' . Str::slug($client->name) . '.example.com'
            );

            ClientContact::create(array_merge($contactData, [
                'client_id' => $client->id,
            ]));
        }
    }
}
