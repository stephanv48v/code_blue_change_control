<?php

namespace App\Notifications;

use App\Models\Approval;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApprovalReminderNotification extends Notification implements ShouldQueue
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
            ->subject("Reminder: Approval Required — {$change->change_id}")
            ->greeting("Hello {$notifiable->first_name},")
            ->line("This is a reminder that your approval is required and the deadline is approaching.")
            ->line("**{$change->change_id}: {$change->title}**")
            ->when($dueAt, fn ($mail) => $mail->line("Response required by: **{$dueAt}**"))
            ->action('Review Now', $portalUrl)
            ->line('If you have already responded, please disregard this message.')
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
