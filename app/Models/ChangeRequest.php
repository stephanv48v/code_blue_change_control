<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ChangeRequest extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_UNDER_REVIEW = 'under_review';
    public const STATUS_PENDING_APPROVAL = 'pending_approval';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    public const CAB_CONDITIONS_PENDING = 'pending';
    public const CAB_CONDITIONS_CONFIRMED = 'confirmed';

    protected $fillable = [
        'change_id',
        'client_id',
        'requester_id',
        'title',
        'description',
        'status',
        'priority',
        'change_type',
        'risk_level',
        'risk_score',
        'form_schema_id',
        'requires_cab_approval',
        'policy_decision',
        'form_data',
        'requested_date',
        'scheduled_start_date',
        'scheduled_end_date',
        'actual_start_date',
        'actual_end_date',
        'implementation_plan',
        'backout_plan',
        'test_plan',
        'business_justification',
        'assigned_engineer_id',
        'approved_by',
        'approved_at',
        'cab_approver_id',
        'cab_approved_at',
        'cab_conditions',
        'cab_conditions_status',
        'cab_conditions_confirmed_at',
        'cab_conditions_confirmed_by',
        'rejection_reason',
    ];

    protected $casts = [
        'form_data' => 'array',
        'policy_decision' => 'array',
        'requires_cab_approval' => 'boolean',
        'requested_date' => 'datetime',
        'scheduled_start_date' => 'datetime',
        'scheduled_end_date' => 'datetime',
        'actual_start_date' => 'datetime',
        'actual_end_date' => 'datetime',
        'approved_at' => 'datetime',
        'cab_approved_at' => 'datetime',
        'cab_conditions_confirmed_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($changeRequest) {
            if (empty($changeRequest->change_id)) {
                $changeRequest->change_id = self::generateChangeId();
            }
        });
    }

    /**
     * Generate a unique change ID.
     */
    protected static function generateChangeId(): string
    {
        $year = now()->year;
        $prefix = "CR-{$year}-";

        // Order by primary key (always monotonically increasing) so we reliably
        // get the highest-sequence record even when timestamps are identical.
        $latest = self::where('change_id', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($latest) {
            $number = (int) substr($latest->change_id, strlen($prefix)) + 1;
        } else {
            $number = 1;
        }

        return $prefix . str_pad((string) $number, 4, '0', STR_PAD_LEFT);
    }

    // ==================== Relationships ====================

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function formSchema(): BelongsTo
    {
        return $this->belongsTo(FormSchema::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function assignedEngineer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_engineer_id');
    }

    public function cabApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cab_approver_id');
    }

    public function cabConditionsConfirmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cab_conditions_confirmed_by');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function cabVotes(): HasMany
    {
        return $this->hasMany(CabVote::class);
    }

    public function runbookSteps(): HasMany
    {
        return $this->hasMany(ChangeRunbookStep::class)->orderBy('step_order');
    }

    public function communications(): HasMany
    {
        return $this->hasMany(ChangeCommunication::class)->orderByDesc('created_at');
    }

    public function postImplementationReview(): HasOne
    {
        return $this->hasOne(PostImplementationReview::class);
    }

    public function workflowEvents(): HasMany
    {
        return $this->hasMany(WorkflowEvent::class)->orderByDesc('created_at');
    }

    public function cabMeetings(): BelongsToMany
    {
        return $this->belongsToMany(CabMeeting::class, 'cab_meeting_change_request')
            ->withPivot(['decision', 'decision_notes', 'discussed_at'])
            ->withTimestamps();
    }

    public function externalAssets(): BelongsToMany
    {
        return $this->belongsToMany(ExternalAsset::class, 'change_request_external_asset')
            ->withPivot('relationship_type')
            ->withTimestamps();
    }

    public function auditEvents(): MorphMany
    {
        return $this->morphMany(AuditEvent::class, 'auditable');
    }

    // ==================== Scopes ====================

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [
            self::STATUS_SUBMITTED,
            self::STATUS_UNDER_REVIEW,
            self::STATUS_PENDING_APPROVAL,
        ]);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeForClient($query, int $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    // ==================== Status Helpers ====================

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isPending(): bool
    {
        return in_array($this->status, [
            self::STATUS_SUBMITTED,
            self::STATUS_UNDER_REVIEW,
            self::STATUS_PENDING_APPROVAL,
        ], true);
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function canEdit(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_SUBMITTED], true);
    }

    public function hasPendingCabConditions(): bool
    {
        return $this->cab_conditions_status === self::CAB_CONDITIONS_PENDING
            && !empty($this->cab_conditions);
    }

    // ==================== Audit Logging ====================

    public function logEvent(
        string $event,
        ?string $comment = null,
        ?int $userId = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): void
    {
        AuditEvent::create([
            'auditable_type' => self::class,
            'auditable_id' => $this->id,
            'event' => $event,
            'user_id' => $userId ?? auth()->id(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
            'comment' => $comment,
        ]);
    }
}
