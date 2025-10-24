<?php

namespace App\Mail;

use App\Models\UserInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InviteUserMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public UserInvitation $invitation
    ) {}

    public function envelope(): Envelope
    {
        $tenantName = tenant('company_name') ?? 'Cal Connect';
        
        return new Envelope(
            subject: "【{$tenantName}】アカウント招待のお知らせ",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invite-user',
            with: [
                'invitation' => $this->invitation,
                'tenantName' => tenant('company_name') ?? 'Cal Connect',
                'inviteUrl' => $this->getInviteUrl(),
                'inviterName' => $this->invitation->inviter->name,
                'roleText' => $this->invitation->role === 'admin' ? '管理者' : 'ユーザー',
            ],
        );
    }

    private function getInviteUrl(): string
    {
        $domain = request()->getHost();
        $subdomain = explode('.', $domain)[0];
        
        // テナントドメインの場合
        if (str_contains($domain, '.anken.cloud')) {
            return "https://{$subdomain}.anken.cloud/invite/{$this->invitation->token}";
        }
        
        // セントラルドメインの場合
        return "https://anken.cloud/invite/" . tenant('id') . "/{$this->invitation->token}";
    }
}