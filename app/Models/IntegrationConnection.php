<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class IntegrationConnection extends Model
{
    use HasFactory, SoftDeletes;

    public const PROVIDER_CONNECTWISE = 'connectwise';
    public const PROVIDER_IT_GLUE = 'it_glue';
    public const PROVIDER_KASEYA = 'kaseya';
    public const PROVIDER_AUVIK = 'auvik';
    public const PROVIDER_CUSTOM = 'custom';

    protected $fillable = [
        'client_id',
        'created_by',
        'name',
        'slug',
        'provider',
        'auth_type',
        'base_url',
        'credentials',
        'settings',
        'webhook_secret',
        'sync_frequency_minutes',
        'last_synced_at',
        'is_active',
    ];

    protected $casts = [
        'credentials' => 'array',
        'settings' => 'array',
        'webhook_secret' => 'encrypted',
        'last_synced_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $connection): void {
            if (empty($connection->slug)) {
                $connection->slug = Str::slug($connection->name.'-'.$connection->provider);
            }
        });
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function syncRuns(): HasMany
    {
        return $this->hasMany(IntegrationSyncRun::class);
    }

    public function assets(): HasMany
    {
        return $this->hasMany(ExternalAsset::class);
    }

    public function clientMappings(): HasMany
    {
        return $this->hasMany(IntegrationClientMapping::class);
    }

    public function webhookEvents(): HasMany
    {
        return $this->hasMany(IntegrationWebhookEvent::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
