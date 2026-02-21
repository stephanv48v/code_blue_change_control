<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'auditable_type',
        'auditable_id',
        'event',
        'user_id',
        'client_contact_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'comment',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function clientContact(): BelongsTo
    {
        return $this->belongsTo(ClientContact::class);
    }

    /**
     * Log an audit event.
     */
    public static function log(
        Model $auditable,
        string $event,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $comment = null
    ): self {
        $user = auth('web')->user();
        $contact = auth('client')->user();

        return self::create([
            'auditable_type' => get_class($auditable),
            'auditable_id' => $auditable->id,
            'event' => $event,
            'user_id' => $user?->id,
            'client_contact_id' => $contact?->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'comment' => $comment,
        ]);
    }
}
