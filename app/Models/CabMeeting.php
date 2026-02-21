<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CabMeeting extends Model
{
    use HasFactory;

    public const STATUS_PLANNED = 'planned';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'meeting_date',
        'status',
        'agenda_notes',
        'minutes',
        'created_by',
        'completed_by',
        'completed_at',
    ];

    protected $casts = [
        'meeting_date' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function completer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function changeRequests(): BelongsToMany
    {
        return $this->belongsToMany(ChangeRequest::class, 'cab_meeting_change_request')
            ->withPivot(['decision', 'decision_notes', 'discussed_at'])
            ->withTimestamps();
    }
}
