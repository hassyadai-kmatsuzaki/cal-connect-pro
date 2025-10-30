<?php

namespace App\Services;

use App\Models\FormSubmission;
use App\Models\HearingForm;
use App\Models\MessageTemplate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FormSubmissionService
{
    protected $lineMessagingService;
    protected $slackNotificationService;

    public function __construct(
        LineMessagingService $lineMessagingService,
        SlackNotificationService $slackNotificationService
    ) {
        $this->lineMessagingService = $lineMessagingService;
        $this->slackNotificationService = $slackNotificationService;
    }

    /**
     * フォームを送信
     */
    public function submit(HearingForm $form, array $data): FormSubmission
    {
        return DB::transaction(function () use ($form, $data) {
            // フォーム送信を作成
            $submission = FormSubmission::create([
                'hearing_form_id' => $form->id,
                'line_user_id' => $data['line_user_id'] ?? null,
                'inflow_source_id' => $data['inflow_source_id'] ?? null,
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'ip_address' => $data['ip_address'] ?? null,
                'user_agent' => $data['user_agent'] ?? null,
                'submitted_at' => now(),
            ]);

            // 回答を保存
            if (isset($data['answers']) && is_array($data['answers'])) {
                foreach ($data['answers'] as $answer) {
                    $submission->answers()->create([
                        'hearing_form_item_id' => $answer['hearing_form_item_id'],
                        'answer_text' => $answer['answer_text'],
                    ]);
                }
            }

            // 自動返信を送信
            if ($form->enable_auto_reply && $data['line_user_id']) {
                $this->sendAutoReply($submission);
            }

            // Slack通知を送信
            if ($form->slack_notify && $form->slack_webhook) {
                $this->sendSlackNotification($submission);
            }

            return $submission->load(['answers.hearingFormItem', 'lineUser', 'inflowSource']);
        });
    }

    /**
     * 自動返信メッセージを送信
     */
    private function sendAutoReply(FormSubmission $submission): void
    {
        try {
            $lineUser = $submission->lineUser;
            if (!$lineUser || !$lineUser->line_user_id) {
                Log::warning('Cannot send auto reply: LineUser not found', [
                    'submission_id' => $submission->id
                ]);
                return;
            }

            $form = $submission->hearingForm;
            
            // テンプレートを探す
            $template = $form->messageTemplates()
                ->where('message_type', 'form_submitted')
                ->where('is_active', true)
                ->first();

            if ($template) {
                // テンプレートを使用
                $data = $this->prepareTemplateData($submission);
                $this->lineMessagingService->sendTemplate(
                    $lineUser->line_user_id,
                    $template,
                    $data
                );
            } else {
                // デフォルトメッセージ
                $message = $this->getDefaultAutoReplyMessage($submission);
                $this->lineMessagingService->sendMessage(
                    $lineUser->line_user_id,
                    $message
                );
            }

            Log::info('Auto reply sent successfully', [
                'submission_id' => $submission->id,
                'line_user_id' => $lineUser->line_user_id,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send auto reply: ' . $e->getMessage(), [
                'submission_id' => $submission->id,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Slack通知を送信
     */
    private function sendSlackNotification(FormSubmission $submission): void
    {
        try {
            $form = $submission->hearingForm;
            
            $this->slackNotificationService->sendFormSubmission(
                $form->slack_webhook,
                $submission,
                $form->slack_message
            );

            $submission->update([
                'slack_notified_at' => now(),
            ]);

            Log::info('Slack notification sent successfully', [
                'submission_id' => $submission->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send Slack notification: ' . $e->getMessage(), [
                'submission_id' => $submission->id,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * テンプレート用のデータを準備
     */
    private function prepareTemplateData(FormSubmission $submission): array
    {
        $form = $submission->hearingForm;
        
        return [
            'customer_name' => $submission->customer_name,
            'customer_email' => $submission->customer_email,
            'customer_phone' => $submission->customer_phone,
            'form_name' => $form->name,
            'company_name' => tenant()->name ?? '',
        ];
    }

    /**
     * デフォルトの自動返信メッセージを取得
     */
    private function getDefaultAutoReplyMessage(FormSubmission $submission): string
    {
        $form = $submission->hearingForm;
        
        $message = "✅ フォームを送信しました\n\n";
        $message .= "【{$form->name}】\n";
        $message .= "お名前: {$submission->customer_name} 様\n\n";
        $message .= "ご回答ありがとうございました。\n";
        $message .= "内容を確認の上、担当者よりご連絡させていただきます。";

        return $message;
    }
}

