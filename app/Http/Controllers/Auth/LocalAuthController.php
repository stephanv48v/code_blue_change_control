<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LocalAuthController extends Controller
{
    /**
     * Show the local login form (break-glass only).
     */
    public function showLogin(): Response|RedirectResponse
    {
        // Check if local login is enabled
        if (! config('app.enable_local_login')) {
            return redirect()->route('login')
                ->withErrors(['local' => 'Local login is disabled.']);
        }

        return Inertia::render('auth/LocalLogin');
    }

    /**
     * Handle local login request.
     */
    public function login(Request $request): RedirectResponse
    {
        // Check if local login is enabled
        if (! config('app.enable_local_login')) {
            throw ValidationException::withMessages([
                'email' => 'Local login is disabled.',
            ]);
        }

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Find user and verify password
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! $user->password || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'The provided credentials do not match our records.',
            ]);
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Log the user out.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
