<?php

namespace App\Notifications;

use App\Models\Approval;
use App\Notifications\Channels\MicrosoftTeamsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApprovalEscalatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Approval $approval
    ) {}

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
        $level = $this->approval->escalation_level;

        return (new MailMessage)
            ->subject("ESCALATION (Level {$level}): Overdue Approval — {$change->change_id}")
            ->greeting('Attention,')
            ->line("An approval for the following change request is overdue and has been escalated to level {$level}.")
            ->line("**{$change->change_id}: {$change->title}**")
            ->line("Priority: " . ucfirst($change->priority) . " | Risk: " . ucfirst($change->risk_level ?? 'unspecified'))
            ->line("Original deadline: " . ($this->approval->due_at?->format('D, d M Y H:i T') ?? 'Not set'))
            ->line('Please take immediate action to resolve this overdue approval.')
            ->salutation('Regards,' . "\n" . config('app.name'));
    }

    public function toTeams(object $notifiable): array
    {
        $change = $this->approval->changeRequest;
        $level = $this->approval->escalation_level;

        return [
            'type' => 'message',
            'attachments' => [[
                'contentType' => 'application/vnd.microsoft.card.adaptive',
                'content' => [
                    '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
                    'type' => 'AdaptiveCard',
                    'version' => '1.4',
                    'body' => [
                        ['type' => 'TextBlock', 'size' => 'Medium', 'weight' => 'Bolder', 'color' => 'Attention', 'text' => "ESCALATION (Level {$level}): Overdue Approval"],
                        ['type' => 'TextBlock', 'text' => "{$change->change_id} — {$change->title}", 'wrap' => true],
                        ['type' => 'FactSet', 'facts' => [
                            ['title' => 'Priority', 'value' => ucfirst($change->priority)],
                            ['title' => 'Risk', 'value' => ucfirst($change->risk_level ?? 'unspecified')],
                            ['title' => 'Deadline', 'value' => $this->approval->due_at?->format('D, d M Y H:i T') ?? 'Not set'],
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
            'type' => 'approval_escalated',
            'approval_id' => $this->approval->id,
            'change_id' => $change?->change_id,
            'title' => $change?->title,
            'escalation_level' => $this->approval->escalation_level,
            'message' => "Approval overdue for {$change?->change_id} (escalation level {$this->approval->escalation_level})",
        ];
    }
}
