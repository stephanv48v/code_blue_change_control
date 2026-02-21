<?php

namespace App\Policies;

use App\Models\ChangeRequest;
use App\Models\User;

class ChangeRequestPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('changes.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ChangeRequest $changeRequest): bool
    {
        return $user->can('changes.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('changes.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ChangeRequest $changeRequest): bool
    {
        if (!$user->can('changes.edit')) {
            return false;
        }

        // Can only edit if in draft or submitted status
        return $changeRequest->canEdit();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ChangeRequest $changeRequest): bool
    {
        if (!$user->can('changes.delete')) {
            return false;
        }

        // Archive is allowed for any non-archived change request.
        return !$changeRequest->trashed();
    }

    /**
     * Determine whether the user can submit the change request.
     */
    public function submit(User $user, ChangeRequest $changeRequest): bool
    {
        return $user->can('changes.edit') && $changeRequest->isDraft();
    }

    /**
     * Determine whether the user can approve/reject a change request.
     */
    public function approve(User $user, ChangeRequest $changeRequest): bool
    {
        return $user->can('changes.approve');
    }

    /**
     * Determine whether the user can vote on CAB approval.
     */
    public function voteCab(User $user, ChangeRequest $changeRequest): bool
    {
        return $user->hasRole('CAB Member') && $changeRequest->status === ChangeRequest::STATUS_PENDING_APPROVAL;
    }

    /**
     * Determine whether the user can schedule the change request.
     */
    public function schedule(User $user, ChangeRequest $changeRequest): bool
    {
        return $user->can('changes.edit') && in_array($changeRequest->status, ['approved', 'scheduled']);
    }

    /**
     * Determine whether the user can assign an engineer.
     */
    public function assignEngineer(User $user, ChangeRequest $changeRequest): bool
    {
        return $user->can('changes.edit') && in_array($changeRequest->status, ['approved', 'scheduled', 'in_progress']);
    }

    /**
     * Determine whether the user can transition the change request status.
     */
    public function transition(User $user, ChangeRequest $changeRequest): bool
    {
        return $user->can('changes.edit');
    }

    /**
     * Determine whether the requester can confirm CAB conditions.
     */
    public function confirmCabConditions(User $user, ChangeRequest $changeRequest): bool
    {
        return $changeRequest->requester_id === $user->id
            && $changeRequest->hasPendingCabConditions();
    }
}
