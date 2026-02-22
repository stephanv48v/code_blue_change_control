<?php

namespace App\Notifications;

use App\Models\ChangeRequest;
use App\Notifications\Channels\MicrosoftTeamsChannel;
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

    public function toTeams(object $notifiable): array
    {
        return [
            'type' => 'message',
            'attachments' => [[
                'contentType' => 'application/vnd.microsoft.card.adaptive',
                'content' => [
                    '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
                    'type' => 'AdaptiveCard',
                    'version' => '1.4',
                    'body' => [
                        ['type' => 'TextBlock', 'size' => 'Medium', 'weight' => 'Bolder', 'text' => "Approval Bypassed: {$this->change->change_id}"],
                        ['type' => 'TextBlock', 'text' => $this->change->title, 'wrap' => true],
                        ['type' => 'TextBlock', 'text' => "Bypassed by: {$this->bypassedByName}", 'isSubtle' => true],
                        ['type' => 'TextBlock', 'text' => "Reason: {$this->reason}", 'wrap' => true],
                    ],
                ],
            ]],
        ];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'approval_bypassed',
            'change_id' => $this->change->change_id,
            'title' => $this->change->title,
            'reason' => $this->reason,
            'bypassed_by' => $this->bypassedByName,
            'message' => "Approval bypassed for {$this->change->change_id} by {$this->bypassedByName}",
        ];
    }
}
