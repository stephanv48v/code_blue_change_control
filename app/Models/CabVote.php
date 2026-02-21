<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CabVote extends Model
{
    use HasFactory;

    const VOTE_APPROVE = 'approve';
    const VOTE_REJECT = 'reject';
    const VOTE_ABSTAIN = 'abstain';

    protected $fillable = [
        'change_request_id',
        'user_id',
        'vote',
        'comments',
        'conditional_terms',
    ];

    public function changeRequest(): BelongsTo
    {
        return $this->belongsTo(ChangeRequest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
