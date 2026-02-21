<?php

namespace App\Models;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class ClientContact extends Model implements Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'client_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'mobile',
        'job_title',
        'department',
        'is_primary_contact',
        'is_approver',
        'is_active',
        'email_verified_at',
        'last_login_at',
        'microsoft_id',
        'provider',
        'provider_subject',
        'magic_link_token',
        'magic_link_expires_at',
        'remember_token',
        'notes',
    ];

    protected $casts = [
        'is_primary_contact' => 'boolean',
        'is_approver' => 'boolean',
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'magic_link_expires_at' => 'datetime',
    ];

    /**
     * Get the client this contact belongs to.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the approvals for this contact.
     */
    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class, 'client_contact_id');
    }

    /**
     * Get the full name attribute.
     */
    public function getNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Get the initials attribute.
     */
    public function getInitialsAttribute(): string
    {
        return strtoupper(substr($this->first_name, 0, 1) . substr($this->last_name, 0, 1));
    }

    /**
     * Scope for active contacts only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for approvers only.
     */
    public function scopeApprovers($query)
    {
        return $query->where('is_approver', true);
    }

    /**
     * Scope for primary contacts.
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary_contact', true);
    }

    /**
     * Check if contact can authenticate via magic link.
     */
    public function canUseMagicLink(): bool
    {
        return $this->is_active && 
               $this->magic_link_token && 
               $this->magic_link_expires_at && 
               $this->magic_link_expires_at->isFuture();
    }

    /**
     * Check if contact is linked to Microsoft account.
     */
    public function isMicrosoftLinked(): bool
    {
        return !empty($this->microsoft_id) && $this->provider === 'microsoft';
    }

    // ==================== Authenticatable Interface Methods ====================

    public function getAuthIdentifierName(): string
    {
        return 'id';
    }

    public function getAuthIdentifier(): mixed
    {
        return $this->id;
    }

    public function getAuthPassword(): ?string
    {
        // Magic link authentication doesn't use passwords
        return null;
    }

    public function getRememberToken(): ?string
    {
        return $this->remember_token;
    }

    public function setRememberToken($value): void
    {
        $this->remember_token = $value;
    }

    public function getRememberTokenName(): string
    {
        return 'remember_token';
    }

    public function getAuthPasswordName(): string
    {
        return 'password';
    }
}
