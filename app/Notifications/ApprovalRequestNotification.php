<?php

namespace App\Notifications;

use App\Models\Approval;
use App\Notifications\Channels\MicrosoftTeamsChannel;
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
        return static::channels();
    }

    public static function channels(): array
    {
        return array_filter([
            'mail',
            'database',
            config('services.microsoft.teams_webhook_url') ? MicrosoftTeamsChannel::class : null,
        ]);
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

    public function toTeams(object $notifiable): array
    {
        $change = $this->approval->changeRequest;

        return [
            'type' => 'message',
            'attachments' => [[
                'contentType' => 'application/vnd.microsoft.card.adaptive',
                'content' => [
                    '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
                    'type' => 'AdaptiveCard',
                    'version' => '1.4',
                    'body' => [
                        ['type' => 'TextBlock', 'size' => 'Medium', 'weight' => 'Bolder', 'text' => "Approval Requested: {$change->change_id}"],
                        ['type' => 'TextBlock', 'text' => $change->title, 'wrap' => true],
                        ['type' => 'FactSet', 'facts' => [
                            ['title' => 'Priority', 'value' => ucfirst($change->priority)],
                            ['title' => 'Risk', 'value' => ucfirst($change->risk_level ?? 'unspecified')],
                        ]],
                    ],
                ],
            ]],
        ];
    }

    public function toArray(object $notifiable): array
    {
        $change = $this->approval->changeRequest;

        return [
            'type' => 'approval_requested',
            'approval_id' => $this->approval->id,
            'change_id' => $change?->change_id,
            'title' => $change?->title,
            'priority' => $change?->priority,
            'message' => "Approval requested for {$change?->change_id}: {$change?->title}",
        ];
    }
}
