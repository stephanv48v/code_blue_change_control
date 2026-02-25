<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientContact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClientContactController extends Controller
{
    /**
     * Ensure the contact belongs to the given client.
     */
    private function ensureContactBelongsToClient(Client $client, ClientContact $contact): void
    {
        abort_unless($contact->client_id === $client->id, 404);
    }

    /**
     * Display a listing of contacts for a client.
     */
    public function index(Client $client): Response
    {
        $contacts = $client->contacts()
            ->orderBy('is_primary_contact', 'desc')
            ->orderBy('last_name')
            ->get();

        return Inertia::render('Clients/Contacts/Index', [
            'client' => $client,
            'contacts' => $contacts,
        ]);
    }

    /**
     * Show the form for creating a new contact.
     */
    public function create(Client $client): Response
    {
        return Inertia::render('Clients/Contacts/Create', [
            'client' => $client->only('id', 'name', 'code'),
        ]);
    }

    /**
     * Store a newly created contact.
     */
    public function store(Request $request, Client $client)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:client_contacts'],
            'phone' => ['nullable', 'string', 'max:50'],
            'mobile' => ['nullable', 'string', 'max:50'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'is_primary_contact' => ['boolean'],
            'is_approver' => ['boolean'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['client_id'] = $client->id;

        $contact = DB::transaction(function () use ($client, $validated) {
            // If setting as primary contact, unset others atomically
            if ($validated['is_primary_contact'] ?? false) {
                $client->contacts()->update(['is_primary_contact' => false]);
            }

            return ClientContact::create($validated);
        });

        return redirect()->route('clients.show', $client)
            ->with('message', 'Contact created successfully.');
    }

    /**
     * Display the specified contact.
     */
    public function show(Client $client, ClientContact $contact): Response
    {
        $this->ensureContactBelongsToClient($client, $contact);
        $contact->load('client');

        return Inertia::render('Clients/Contacts/Show', [
            'client' => $client->only('id', 'name', 'code'),
            'contact' => $contact,
        ]);
    }

    /**
     * Show the form for editing the specified contact.
     */
    public function edit(Client $client, ClientContact $contact): Response
    {
        $this->ensureContactBelongsToClient($client, $contact);
        return Inertia::render('Clients/Contacts/Edit', [
            'client' => $client->only('id', 'name', 'code'),
            'contact' => $contact,
        ]);
    }

    /**
     * Update the specified contact.
     */
    public function update(Request $request, Client $client, ClientContact $contact)
    {
        $this->ensureContactBelongsToClient($client, $contact);
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('client_contacts')->ignore($contact->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'mobile' => ['nullable', 'string', 'max:50'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'is_primary_contact' => ['boolean'],
            'is_approver' => ['boolean'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($client, $contact, $validated) {
            // If setting as primary contact, unset others atomically
            if (($validated['is_primary_contact'] ?? false) && !$contact->is_primary_contact) {
                $client->contacts()->where('id', '!=', $contact->id)
                       ->update(['is_primary_contact' => false]);
            }

            $contact->update($validated);
        });

        return redirect()->route('clients.show', $client)
            ->with('message', 'Contact updated successfully.');
    }

    /**
     * Remove the specified contact (soft delete).
     */
    public function destroy(Client $client, ClientContact $contact)
    {
        $this->ensureContactBelongsToClient($client, $contact);
        $contact->delete();

        return redirect()->route('clients.show', $client)
            ->with('message', 'Contact deleted successfully.');
    }

    /**
     * Show invite placeholder for a contact.
     */
    public function invite(Client $client, ClientContact $contact): Response
    {
        $this->ensureContactBelongsToClient($client, $contact);
        return Inertia::render('Clients/Contacts/Invite', [
            'client' => $client->only('id', 'name', 'code'),
            'contact' => $contact,
        ]);
    }
}
