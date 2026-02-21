<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientContact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $engineer;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
        
        $this->admin = User::factory()->create();
        $this->admin->assignRole('Super Admin');
        
        $this->engineer = User::factory()->create();
        $this->engineer->assignRole('Engineer');
    }

    // ==================== Authorization Tests ====================

    public function test_admin_can_access_clients_index(): void
    {
        $response = $this->actingAs($this->admin)->get('/clients');
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Clients/Index')
        );
    }

    public function test_engineer_cannot_access_clients_index(): void
    {
        $response = $this->actingAs($this->engineer)->get('/clients');
        
        $response->assertStatus(403);
    }

    public function test_guest_is_redirected_to_login_when_accessing_clients(): void
    {
        $response = $this->get('/clients');
        
        $response->assertRedirect('/login');
    }

    // ==================== Client CRUD Tests ====================

    public function test_admin_can_create_client(): void
    {
        $response = $this->actingAs($this->admin)->post('/clients', [
            'name' => 'Test Client Inc',
            'industry' => 'Technology',
            'city' => 'Auckland',
            'country' => 'NZ',
            'is_active' => true,
        ]);
        
        $response->assertRedirect();
        $this->assertDatabaseHas('clients', [
            'name' => 'Test Client Inc',
            'industry' => 'Technology',
        ]);
    }

    public function test_client_code_is_auto_generated(): void
    {
        $response = $this->actingAs($this->admin)->post('/clients', [
            'name' => 'Alpha Beta Gamma',
            'is_active' => true,
        ]);
        
        $response->assertRedirect();
        $this->assertDatabaseHas('clients', [
            'name' => 'Alpha Beta Gamma',
        ]);
        
        $client = Client::where('name', 'Alpha Beta Gamma')->first();
        $this->assertNotNull($client->code);
        $this->assertEquals(6, strlen($client->code)); // Codes are exactly 6 chars
        $this->assertStringStartsWith('ALPBET', $client->code); // ALPha BETa...
    }

    public function test_admin_can_update_client(): void
    {
        $client = Client::factory()->create(['name' => 'Old Name']);
        
        $response = $this->actingAs($this->admin)->put("/clients/{$client->id}", [
            'name' => 'New Name',
            'code' => $client->code,
            'industry' => $client->industry,
            'is_active' => true,
        ]);
        
        $response->assertRedirect();
        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
            'name' => 'New Name',
        ]);
    }

    public function test_admin_can_delete_client(): void
    {
        $client = Client::factory()->create();
        
        $response = $this->actingAs($this->admin)->delete("/clients/{$client->id}");
        
        $response->assertRedirect('/clients');
        $this->assertSoftDeleted('clients', ['id' => $client->id]);
    }

    public function test_client_validation_requires_name(): void
    {
        $response = $this->actingAs($this->admin)->post('/clients', [
            'industry' => 'Technology',
        ]);
        
        $response->assertSessionHasErrors(['name']);
    }

    public function test_client_code_must_be_unique(): void
    {
        Client::factory()->create(['code' => 'UNIQUE']);
        
        $response = $this->actingAs($this->admin)->post('/clients', [
            'name' => 'Another Client',
            'code' => 'UNIQUE',
            'is_active' => true,
        ]);
        
        $response->assertSessionHasErrors(['code']);
    }

    // ==================== Contact CRUD Tests ====================

    public function test_admin_can_create_contact_for_client(): void
    {
        $client = Client::factory()->create();
        
        $response = $this->actingAs($this->admin)->post("/clients/{$client->id}/contacts", [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'job_title' => 'IT Manager',
            'is_primary_contact' => true,
            'is_approver' => true,
            'is_active' => true,
        ]);
        
        $response->assertRedirect();
        $this->assertDatabaseHas('client_contacts', [
            'client_id' => $client->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'is_approver' => true,
        ]);
    }

    public function test_creating_primary_contact_unsets_others(): void
    {
        $client = Client::factory()->create();
        $existingContact = ClientContact::factory()->create([
            'client_id' => $client->id,
            'is_primary_contact' => true,
        ]);
        
        $response = $this->actingAs($this->admin)->post("/clients/{$client->id}/contacts", [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane.smith@example.com',
            'is_primary_contact' => true,
            'is_approver' => false,
            'is_active' => true,
        ]);
        
        $response->assertRedirect();
        $this->assertDatabaseHas('client_contacts', [
            'id' => $existingContact->id,
            'is_primary_contact' => false,
        ]);
        $this->assertDatabaseHas('client_contacts', [
            'email' => 'jane.smith@example.com',
            'is_primary_contact' => true,
        ]);
    }

    public function test_admin_can_update_contact(): void
    {
        $client = Client::factory()->create();
        $contact = ClientContact::factory()->create([
            'client_id' => $client->id,
            'first_name' => 'Old',
        ]);
        
        $response = $this->actingAs($this->admin)->put(
            "/clients/{$client->id}/contacts/{$contact->id}",
            [
                'first_name' => 'New',
                'last_name' => $contact->last_name,
                'email' => $contact->email,
                'is_primary_contact' => false,
                'is_approver' => true,
                'is_active' => true,
            ]
        );
        
        $response->assertRedirect();
        $this->assertDatabaseHas('client_contacts', [
            'id' => $contact->id,
            'first_name' => 'New',
        ]);
    }

    public function test_admin_can_delete_contact(): void
    {
        $client = Client::factory()->create();
        $contact = ClientContact::factory()->create(['client_id' => $client->id]);
        
        $response = $this->actingAs($this->admin)->delete(
            "/clients/{$client->id}/contacts/{$contact->id}"
        );
        
        $response->assertRedirect();
        $this->assertSoftDeleted('client_contacts', ['id' => $contact->id]);
    }

    public function test_contact_email_must_be_unique(): void
    {
        $client = Client::factory()->create();
        ClientContact::factory()->create(['email' => 'duplicate@example.com']);
        
        $response = $this->actingAs($this->admin)->post("/clients/{$client->id}/contacts", [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'duplicate@example.com',
            'is_primary_contact' => false,
            'is_approver' => false,
            'is_active' => true,
        ]);
        
        $response->assertSessionHasErrors(['email']);
    }

    public function test_contact_requires_first_and_last_name(): void
    {
        $client = Client::factory()->create();
        
        $response = $this->actingAs($this->admin)->post("/clients/{$client->id}/contacts", [
            'email' => 'test@example.com',
            'is_primary_contact' => false,
            'is_approver' => false,
            'is_active' => true,
        ]);
        
        $response->assertSessionHasErrors(['first_name', 'last_name']);
    }

    // ==================== Invite Page Tests ====================

    public function test_admin_can_view_invite_page(): void
    {
        $client = Client::factory()->create();
        $contact = ClientContact::factory()->create([
            'client_id' => $client->id,
            'is_approver' => true,
        ]);
        
        $response = $this->actingAs($this->admin)->get(
            "/clients/{$client->id}/contacts/{$contact->id}/invite"
        );
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Clients/Contacts/Invite')
        );
    }
}
