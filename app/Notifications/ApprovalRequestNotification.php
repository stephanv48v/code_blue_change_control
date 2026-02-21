<?php

namespace App\Notifications;

use App\Models\Approval;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApprovalRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Approval $approval) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $change = $this->approval->changeRequest;
        $portalUrl = url('/portal/approvals/' . $this->approval->id);
        $dueAt = $this->approval->due_at?->format('D, d M Y H:i T');

        return (new MailMessage)
            ->subject("Action Required: Change Request Approval — {$change->change_id}")
            ->greeting("Hello {$notifiable->first_name},")
            ->line("A change request from your MSP requires your approval.")
            ->line("**{$change->change_id}: {$change->title}**")
            ->line("Priority: " . ucfirst($change->priority) . " | Risk: " . ucfirst($change->risk_level ?? 'unspecified'))
            ->when($dueAt, fn ($mail) => $mail->line("Response required by: {$dueAt}"))
            ->action('Review & Approve', $portalUrl)
            ->line('If you have any questions, please contact your MSP administrator.')
            ->salutation('Regards,' . "\n" . config('app.name'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'approval_id' => $this->approval->id,
            'change_id' => $this->approval->changeRequest?->change_id,
        ];
    }
}
