<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChangePolicy extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'client_id',
        'created_by',
        'name',
        'change_type',
        'priority',
        'min_risk_score',
        'max_risk_score',
        'requires_client_approval',
        'requires_cab_approval',
        'requires_security_review',
        'auto_approve',
        'max_implementation_hours',
        'rules',
        'is_active',
    ];

    protected $casts = [
        'requires_client_approval' => 'boolean',
        'requires_cab_approval' => 'boolean',
        'requires_security_review' => 'boolean',
        'auto_approve' => 'boolean',
        'rules' => 'array',
        'is_active' => 'boolean',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
