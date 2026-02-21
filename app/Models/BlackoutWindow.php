<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BlackoutWindow extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'client_id',
        'created_by',
        'name',
        'starts_at',
        'ends_at',
        'timezone',
        'recurring_rule',
        'reason',
        'rules',
        'is_active',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
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

    public function overlaps(CarbonInterface $start, CarbonInterface $end): bool
    {
        return $start->lt($this->ends_at) && $end->gt($this->starts_at);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
