<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ClientContact;
use App\Notifications\MagicLinkNotification;
use App\Services\MagicLinkService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ClientPortalController extends Controller
{
    private MagicLinkService $magicLinkService;

    public function __construct()
    {
        $this->magicLinkService = new MagicLinkService();
    }

    /**
     * Show the client portal login page.
     */
    public function showLogin(): Response
    {
        return Inertia::render('ClientPortal/Login');
    }

    /**
     * Handle magic link request.
     */
    public function sendMagicLink(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = $validated['email'];

        // Rate limiting: 3 attempts per email per hour
        $rateLimitKey = 'magic-link:' . $email;
        
        if (RateLimiter::tooManyAttempts($rateLimitKey, 3)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            
            throw ValidationException::withMessages([
                'email' => "Too many attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        $contact = ClientContact::where('email', $email)
            ->where('is_active', true)
            ->where('is_approver', true)
            ->first();

        if ($contact) {
            // Send the magic link notification
            $contact->notify(new MagicLinkNotification());
        }

        // Increment rate limiter regardless of whether contact exists
        // This prevents email enumeration attacks
        RateLimiter::hit($rateLimitKey, 3600);

        return redirect()->route('client.login')
            ->with('message', 'If an account exists with this email, you will receive a login link shortly.');
    }

    /**
     * Handle magic link login.
     */
    public function magicLinkLogin(Request $request)
    {
        $email = $request->input('email');
        $token = $request->input('token');

        if (!$email || !$token) {
            return redirect()->route('client.login')
                ->withErrors(['email' => 'Invalid or expired login link.']);
        }

        $contact = $this->magicLinkService->validateToken($email, $token);

        if (!$contact) {
            return redirect()->route('client.login')
                ->withErrors(['email' => 'This login link has expired or is invalid. Please request a new one.']);
        }

        // Invalidate the token (single-use)
        $this->magicLinkService->invalidateToken($contact);

        // Update last login
        $contact->update(['last_login_at' => now()]);

        // Log the contact in using a custom guard
        Auth::guard('client')->login($contact);

        $request->session()->regenerate();

        return redirect()->intended(route('client.dashboard'));
    }

    /**
     * Show the client dashboard.
     */
    public function dashboard(): Response
    {
        /** @var ClientContact $contact */
        $contact = Auth::guard('client')->user();
        $contact->load('client');

        // Get dashboard stats
        $pendingCount = $contact->approvals()
            ->where('status', 'pending')
            ->count();

        $approvedThisMonth = $contact->approvals()
            ->where('status', 'approved')
            ->whereMonth('responded_at', now()->month)
            ->whereYear('responded_at', now()->year)
            ->count();

        $totalClientChanges = \App\Models\ChangeRequest::where('client_id', $contact->client_id)->count();

        $recentChanges = \App\Models\ChangeRequest::where('client_id', $contact->client_id)
            ->with('requester')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('ClientPortal/Dashboard', [
            'contact' => [
                'id' => $contact->id,
                'name' => $contact->name,
                'email' => $contact->email,
                'job_title' => $contact->job_title,
                'is_primary_contact' => $contact->is_primary_contact,
                'is_approver' => $contact->is_approver,
                'microsoft_id' => $contact->microsoft_id,
                'client' => $contact->client,
            ],
            'stats' => [
                'pending_approvals' => $pendingCount,
                'approved_this_month' => $approvedThisMonth,
                'total_changes' => $totalClientChanges,
            ],
            'recent_changes' => $recentChanges,
        ]);
    }

    /**
     * Show the My Approvals page.
     */
    public function approvals(): Response
    {
        /** @var ClientContact $contact */
        $contact = Auth::guard('client')->user();
        
        $approvals = $contact->approvals()
            ->with(['changeRequest.client'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('ClientPortal/Approvals', [
            'approvals' => $approvals,
        ]);
    }

    /**
     * Logout the client contact.
     */
    public function logout(Request $request)
    {
        Auth::guard('client')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('client.login');
    }
}
