<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientContact;
use App\Notifications\MagicLinkNotification;
use App\Services\MagicLinkService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ClientPortalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        RateLimiter::clear('magic-link:*');
    }

    // ==================== Login Page Tests ====================

    public function test_client_login_page_is_accessible(): void
    {
        $response = $this->get('/portal/login');
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('ClientPortal/Login')
        );
    }

    public function test_authenticated_client_is_redirected_from_login(): void
    {
        $contact = ClientContact::factory()->create();
        
        $response = $this->actingAs($contact, 'client')
            ->get('/portal/login');
        
        // Authenticated client is redirected away from login
        $response->assertRedirect();
        $this->assertNotEquals('/portal/login', $response->headers->get('Location'));
    }

    // ==================== Magic Link Request Tests ====================

    public function test_magic_link_can_be_requested(): void
    {
        Notification::fake();
        
        $client = Client::factory()->create();
        $contact = ClientContact::factory()->create([
            'client_id' => $client->id,
            'email' => 'test@example.com',
            'is_active' => true,
            'is_approver' => true,
        ]);

        $response = $this->post('/portal/magic-link', [
            'email' => 'test@example.com',
        ]);

        $response->assertRedirect('/portal/login');
        $response->assertSessionHas('message');
        
        Notification::assertSentTo($contact, MagicLinkNotification::class);
    }

    public function test_magic_link_is_not_sent_to_non_approver(): void
    {
        Notification::fake();
        
        $client = Client::factory()->create();
        $contact = ClientContact::factory()->create([
            'client_id' => $client->id,
            'email' => 'test@example.com',
            'is_active' => true,
            'is_approver' => false,
        ]);

        $response = $this->post('/portal/magic-link', [
            'email' => 'test@example.com',
        ]);

        // Should still redirect with success message (to prevent email enumeration)
        $response->assertRedirect('/portal/login');
        $response->assertSessionHas('message');
        
        // But notification should NOT be sent
        Notification::assertNotSentTo($contact, MagicLinkNotification::class);
    }

    public function test_magic_link_is_not_sent_to_inactive_contact(): void
    {
        Notification::fake();
        
        $client = Client::factory()->create();
        $contact = ClientContact::factory()->create([
            'client_id' => $client->id,
            'email' => 'test@example.com',
            'is_active' => false,
            'is_approver' => true,
        ]);

        $response = $this->post('/portal/magic-link', [
            'email' => 'test@example.com',
        ]);

        $response->assertRedirect('/portal/login');
        Notification::assertNotSentTo($contact, MagicLinkNotification::class);
    }

    public function test_magic_link_rate_limiting(): void
    {
        $client = Client::factory()->create();
        $contact = ClientContact::factory()->create([
            'client_id' => $client->id,
            'email' => 'rate@test.com',
            'is_active' => true,
            'is_approver' => true,
        ]);

        // Make 3 requests (the limit)
        for ($i = 0; $i < 3; $i++) {
            $this->post('/portal/magic-link', ['email' => 'rate@test.com']);
        }

        // 4th request should be rate limited
        $response = $this->post('/portal/magic-link', ['email' => 'rate@test.com']);
        
        $response->assertSessionHasErrors(['email']);
    }

    public function test_magic_link_requires_valid_email(): void
    {
        $response = $this->post('/portal/magic-link', [
            'email' => 'not-an-email',
        ]);

        $response->assertSessionHasErrors(['email']);
    }

    // ==================== Magic Link Login Tests ====================

    public function test_contact_can_login_with_valid_magic_link(): void
    {
        $client = Client::factory()->create();
        $contact = ClientContact::factory()->create([
            'client_id' => $client->id,
            'email' => 'login@test.com',
            'is_active' => true,
            'is_approver' => true,
        ]);

        $service = new MagicLinkService();
        $token = $service->generateToken($contact);

        $response = $this->get("/portal/magic-link/verify?email=login%40test.com&token={$token}");

        $response->assertRedirect('/portal/dashboard');
        $this->assertAuthenticatedAs($contact, 'client');
    }

    public function test_magic_link_token_is_single_use(): void
    {
        $client = Client::factory()->create();
        $contact = ClientContact::factory()->create([
            'client_id' => $client->id,
            'email' => 'singleuse@test.com',
            'is_active' => true,
            'is_approver' => true,
        ]);

        $service = new MagicLinkService();
        $token = $service->generateToken($contact);

        // First use - should succeed and login
        $response = $this->get("/portal/magic-link/verify?email=singleuse%40test.com&token={$token}");
        $response->assertRedirect('/portal/dashboard');
        $this->assertAuthenticatedAs($contact, 'client');
        
        // Logout to test second use
        $this->post('/portal/logout');
        $this->assertGuest('client');
        
        // Second use should fail (token is consumed)
        $response = $this->get("/portal/magic-link/verify?email=singleuse%40test.com&token={$token}");
        $response->assertRedirect('/portal/login');
        $response->assertSessionHasErrors(['email']);
    }

    public function test_expired_magic_link_fails(): void
    {
        $client = Client::factory()->create();
        $contact = ClientContact::factory()->create([
            'client_id' => $client->id,
            'email' => 'expired@test.com',
            'is_active' => true,
            'is_approver' => true,
        ]);

        // Generate expired token
        $service = new MagicLinkService();
        $token = $service->generateToken($contact);
        
        // Manually expire the token
        $contact->update(['magic_link_expires_at' => now()->subHour()]);

        $response = $this->get("/portal/magic-link/verify?email=expired%40test.com&token={$token}");

        $response->assertRedirect('/portal/login');
        $response->assertSessionHasErrors(['email']);
        $this->assertGuest('client');
    }

    public function test_invalid_magic_link_fails(): void
    {
        $response = $this->get('/portal/magic-link/verify?email=test@test.com&token=invalid');

        $response->assertRedirect('/portal/login');
        $response->assertSessionHasErrors(['email']);
        $this->assertGuest('client');
    }

    public function test_missing_parameters_fail(): void
    {
        $response = $this->get('/portal/magic-link/verify?email=test@test.com');
        
        $response->assertRedirect('/portal/login');
        $response->assertSessionHasErrors(['email']);
    }

    // ==================== Protected Routes Tests ====================

    public function test_authenticated_contact_can_access_dashboard(): void
    {
        $contact = ClientContact::factory()->create();

        $response = $this->actingAs($contact, 'client')
            ->get('/portal/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('ClientPortal/Dashboard')
            ->has('contact')
        );
    }

    public function test_authenticated_contact_can_access_approvals(): void
    {
        $contact = ClientContact::factory()->create();

        $response = $this->actingAs($contact, 'client')
            ->get('/portal/approvals');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('ClientPortal/Approvals')
        );
    }

    public function test_guest_is_redirected_from_protected_routes(): void
    {
        $response = $this->get('/portal/dashboard');
        
        // Guest is redirected to login (either staff or client login)
        $response->assertRedirect();
        $this->assertStringContainsString('login', $response->headers->get('Location') ?? '');
    }

    public function test_staff_cannot_access_client_portal(): void
    {
        \App\Models\User::factory()->create();
        
        // Staff user (web guard) should not be able to access client portal
        $response = $this->get('/portal/dashboard');
        
        // Should be redirected to login
        $response->assertRedirect();
        $this->assertStringContainsString('login', $response->headers->get('Location') ?? '');
    }

    // ==================== Logout Tests ====================

    public function test_contact_can_logout(): void
    {
        $contact = ClientContact::factory()->create();

        $response = $this->actingAs($contact, 'client')
            ->post('/portal/logout');

        $response->assertRedirect('/portal/login');
        $this->assertGuest('client');
    }
}
