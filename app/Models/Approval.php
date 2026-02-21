<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Approval extends Model
{
    use HasFactory;

    const TYPE_CLIENT = 'client';
    const TYPE_CAB = 'cab';

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'change_request_id',
        'type',
        'client_contact_id',
        'user_id',
        'status',
        'comments',
        'responded_at',
        'due_at',
        'reminder_sent_at',
        'escalated_at',
        'escalation_level',
        'notification_status',
    ];

    protected $casts = [
        'responded_at' => 'datetime',
        'due_at' => 'datetime',
        'reminder_sent_at' => 'datetime',
        'escalated_at' => 'datetime',
        'escalation_level' => 'integer',
    ];

    public function changeRequest(): BelongsTo
    {
        return $this->belongsTo(ChangeRequest::class);
    }

    public function clientContact(): BelongsTo
    {
        return $this->belongsTo(ClientContact::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approve(?string $comments = null): void
    {
        $this->update([
            'status' => self::STATUS_APPROVED,
            'comments' => $comments,
            'responded_at' => now(),
        ]);
    }

    public function reject(?string $comments = null): void
    {
        $this->update([
            'status' => self::STATUS_REJECTED,
            'comments' => $comments,
            'responded_at' => now(),
        ]);
    }
}
