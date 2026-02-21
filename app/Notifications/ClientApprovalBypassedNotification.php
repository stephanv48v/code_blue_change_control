<?php

namespace App\Notifications;

use App\Models\ChangeRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClientApprovalBypassedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly ChangeRequest $change,
        private readonly string $reason,
        private readonly string $bypassedByName
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Change Request Approval Bypassed — {$this->change->change_id}")
            ->greeting("Hello {$notifiable->first_name},")
            ->line("Your approval request for the following change has been bypassed by {$this->bypassedByName}.")
            ->line("**{$this->change->change_id}: {$this->change->title}**")
            ->line("**Reason for bypass:**")
            ->line($this->reason)
            ->line("This is for your records. No action is required from you.")
            ->salutation('Regards,' . "\n" . config('app.name'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'change_id' => $this->change->change_id,
            'reason' => $this->reason,
        ];
    }
}
