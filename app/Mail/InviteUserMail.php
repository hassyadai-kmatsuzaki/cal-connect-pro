<?php

namespace App\Mail;

use App\Models\UserInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InviteUserMail extends Mailable
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
        $currentTenantId = tenant('id');
        
        // 現在のテナントIDからドメインを取得
        $tenant = \App\Models\Tenant::find($currentTenantId);
        if ($tenant && $tenant->domains()->exists()) {
            $domain = $tenant->domains()->first()->domain;
            return "https://{$domain}/invite/{$this->invitation->token}";
        }
        
        // フォールバック: セントラルドメイン経由
        return "https://anken.cloud/invite/{$currentTenantId}/{$this->invitation->token}";
    }
}