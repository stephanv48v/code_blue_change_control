<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ExternalAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'integration_connection_id',
        'client_id',
        'provider',
        'external_id',
        'external_type',
        'name',
        'hostname',
        'ip_address',
        'status',
        'metadata',
        'last_seen_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'last_seen_at' => 'datetime',
    ];

    public function connection(): BelongsTo
    {
        return $this->belongsTo(IntegrationConnection::class, 'integration_connection_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function changes(): BelongsToMany
    {
        return $this->belongsToMany(ChangeRequest::class, 'change_request_external_asset')
            ->withPivot('relationship_type')
            ->withTimestamps();
    }
}
