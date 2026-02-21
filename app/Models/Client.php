<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'code',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'phone',
        'website',
        'industry',
        'notes',
        'is_active',
        'contract_start_date',
        'contract_end_date',
        'account_manager_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'contract_start_date' => 'datetime',
        'contract_end_date' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($client) {
            if (empty($client->slug)) {
                $client->slug = Str::slug($client->name);
            }
            if (empty($client->code)) {
                $client->code = self::generateUniqueCode($client->name);
            }
        });

        static::updating(function ($client) {
            if ($client->isDirty('name') && empty($client->slug)) {
                $client->slug = Str::slug($client->name);
            }
        });
    }

    /**
     * Generate a unique client code from name.
     */
    protected static function generateUniqueCode(string $name): string
    {
        // Take first 3 letters of each word, uppercase
        $words = explode(' ', $name);
        $code = '';
        foreach ($words as $word) {
            $code .= strtoupper(substr($word, 0, 3));
        }
        $code = substr($code, 0, 6);
        
        // Add number if exists
        $baseCode = $code;
        $counter = 1;
        while (self::where('code', $code)->exists()) {
            $code = $baseCode . str_pad((string)$counter, 2, '0', STR_PAD_LEFT);
            $counter++;
        }
        
        return $code;
    }

    /**
     * Get the account manager for this client.
     */
    public function accountManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'account_manager_id');
    }

    /**
     * Get the contacts for this client.
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(ClientContact::class);
    }

    /**
     * Get active contacts only.
     */
    public function activeContacts(): HasMany
    {
        return $this->hasMany(ClientContact::class)->where('is_active', true);
    }

    /**
     * Get change requests for this client.
     */
    public function changeRequests(): HasMany
    {
        return $this->hasMany(ChangeRequest::class);
    }

    /**
     * Get integration connections scoped to this client.
     */
    public function integrationConnections(): HasMany
    {
        return $this->hasMany(IntegrationConnection::class);
    }

    /**
     * Get integration external-client mapping rows for this client.
     */
    public function integrationClientMappings(): HasMany
    {
        return $this->hasMany(IntegrationClientMapping::class);
    }

    /**
     * Get change policies scoped to this client.
     */
    public function changePolicies(): HasMany
    {
        return $this->hasMany(ChangePolicy::class);
    }

    /**
     * Get blackout windows scoped to this client.
     */
    public function blackoutWindows(): HasMany
    {
        return $this->hasMany(BlackoutWindow::class);
    }

    /**
     * Get the full address as a formatted string.
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->city,
            $this->state,
            $this->postal_code,
            $this->country,
        ]);
        
        return implode(', ', $parts);
    }
}
