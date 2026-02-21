<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ClientContact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class ClientMicrosoftController extends Controller
{
    /**
     * Redirect the user to the Microsoft authentication page.
     */
    public function redirect(): RedirectResponse
    {
        // Use common endpoint for multi-tenant (any Microsoft account)
        return Socialite::driver('microsoft')
            ->with([
                'tenant' => 'common',
            ])
            ->redirect();
    }

    /**
     * Obtain the user information from Microsoft.
     */
    public function callback(): RedirectResponse
    {
        try {
            $microsoftUser = Socialite::driver('microsoft')->user();
            
            Log::info('Client Microsoft SSO callback', [
                'email' => $microsoftUser->getEmail(),
            ]);

            // Find contact by Microsoft ID or email
            $contact = ClientContact::where('microsoft_id', $microsoftUser->getId())
                ->orWhere('email', $microsoftUser->getEmail())
                ->first();

            if ($contact) {
                // Update existing contact with Microsoft info
                $contact->update([
                    'microsoft_id' => $microsoftUser->getId(),
                    'provider' => 'microsoft',
                    'provider_subject' => $microsoftUser->getId(),
                    'last_login_at' => now(),
                ]);

                // Check if contact is active and approver
                if (!$contact->is_active || !$contact->is_approver) {
                    return redirect()->route('client.login')
                        ->withErrors(['microsoft' => 'Your account is not authorized to access the portal.']);
                }

                Auth::guard('client')->login($contact, true);
                
                return redirect()->intended(route('client.dashboard'));
            }

            // No matching contact found
            return redirect()->route('client.login')
                ->withErrors(['microsoft' => 'No portal account found for this Microsoft account. Please contact your MSP administrator.']);

        } catch (\Exception $e) {
            Log::error('Client Microsoft SSO error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('client.login')
                ->withErrors(['microsoft' => 'Unable to authenticate with Microsoft. Please try again.']);
        }
    }

    /**
     * Unlink Microsoft account from contact.
     */
    public function unlink(): RedirectResponse
    {
        /** @var ClientContact $contact */
        $contact = Auth::guard('client')->user();

        $contact->update([
            'microsoft_id' => null,
            'provider' => null,
            'provider_subject' => null,
        ]);

        return redirect()->back()
            ->with('message', 'Microsoft account unlinked successfully.');
    }
}
