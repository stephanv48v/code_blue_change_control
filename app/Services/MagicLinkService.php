<?php

namespace App\Services;

use App\Models\ClientContact;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MagicLinkService
{
    /**
     * Token expiration time in minutes.
     */
    public const TOKEN_EXPIRY_MINUTES = 60;

    /**
     * Generate a new magic link token for a contact.
     */
    public function generateToken(ClientContact $contact): string
    {
        $token = Str::random(64);
        
        $contact->update([
            'magic_link_token' => Hash::make($token),
            'magic_link_expires_at' => now()->addMinutes(self::TOKEN_EXPIRY_MINUTES),
        ]);
        
        return $token;
    }

    /**
     * Validate a magic link token.
     */
    public function validateToken(string $email, string $token): ?ClientContact
    {
        $contact = ClientContact::where('email', $email)
            ->whereNotNull('magic_link_token')
            ->whereNotNull('magic_link_expires_at')
            ->where('magic_link_expires_at', '>', now())
            ->where('is_active', true)
            ->first();

        if (!$contact) {
            return null;
        }

        if (!Hash::check($token, $contact->magic_link_token)) {
            return null;
        }

        return $contact;
    }

    /**
     * Invalidate (consume) a magic link token.
     */
    public function invalidateToken(ClientContact $contact): void
    {
        $contact->update([
            'magic_link_token' => null,
            'magic_link_expires_at' => null,
        ]);
    }

    /**
     * Check if a contact has a valid magic link token.
     */
    public function hasValidToken(ClientContact $contact): bool
    {
        return $contact->magic_link_token !== null
            && $contact->magic_link_expires_at !== null
            && $contact->magic_link_expires_at->isFuture();
    }

    /**
     * Generate the magic link URL.
     */
    public function generateUrl(ClientContact $contact, string $token): string
    {
        return route('client.magic-link.login', [
            'email' => $contact->email,
            'token' => $token,
        ]);
    }
}
