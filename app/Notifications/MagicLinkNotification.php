<?php

namespace App\Notifications;

use App\Models\ClientContact;
use App\Services\MagicLinkService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MagicLinkNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private MagicLinkService $magicLinkService;

    /**
     * Create a new notification instance.
     */
    public function __construct()
    {
        $this->magicLinkService = new MagicLinkService();
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        /** @var ClientContact $notifiable */
        $token = $this->magicLinkService->generateToken($notifiable);
        $magicLink = $this->magicLinkService->generateUrl($notifiable, $token);

        return (new MailMessage)
            ->subject('Your Login Link - MSP Change Control')
            ->greeting("Hello {$notifiable->first_name},")
            ->line('You requested a secure login link for the MSP Change Control portal.')
            ->line('Click the button below to log in. This link is single-use and expires in 1 hour.')
            ->action('Log In to Portal', $magicLink)
            ->line('If you did not request this link, please ignore this email or contact your MSP administrator.')
            ->line('For security, do not forward this email to anyone else.')
            ->salutation('Regards,' . "\n" . config('app.name'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'contact_id' => $notifiable->id,
            'email' => $notifiable->email,
        ];
    }
}
