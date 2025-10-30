<?php

namespace App\Services;

use App\Models\FormResponse;
use App\Models\HearingForm;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class FormSlackNotificationService
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    /**
     * フォーム回答をSlackに通知
     */
    public function notifyFormResponse(FormResponse $formResponse): bool
    {
        $hearingForm = $formResponse->hearingForm;

        // Slack通知が無効な場合はスキップ
        if (!$hearingForm->slack_notify || !$hearingForm->slack_webhook) {
            return false;
        }

        try {
            $message = $this->buildSlackMessage($formResponse);
            
            $response = $this->client->post($hearingForm->slack_webhook, [
                'json' => [
                    'text' => $message,
                    'mrkdwn' => true,
                ],
                'timeout' => 10,
            ]);

            Log::info('Form response Slack notification sent successfully', [
                'form_id' => $hearingForm->id,
                'response_id' => $formResponse->id,
                'status_code' => $response->getStatusCode(),
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to send form response Slack notification: ' . $e->getMessage(), [
                'form_id' => $hearingForm->id,
                'response_id' => $formResponse->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Slackメッセージを構築
     */
    private function buildSlackMessage(FormResponse $formResponse): string
    {
        $hearingForm = $formResponse->hearingForm;
        $lineUser = $formResponse->lineUser;
        
        // ユーザー名取得
        $userName = $lineUser ? $lineUser->display_name : '不明なユーザー';
        
        // 回答日時フォーマット
        $submittedAt = $formResponse->submitted_at 
            ? $formResponse->submitted_at->format('Y年m月d日 H:i')
            : '不明';

        $message = "📝 *新しいフォーム回答を受け付けました*\n\n";
        $message .= "*フォーム名:* {$hearingForm->name}\n";
        $message .= "*回答者:* {$userName}\n";
        $message .= "*回答日時:* {$submittedAt}\n\n";
        $message .= "*【回答内容】*\n";

        // 回答内容を追加
        $answers = $formResponse->answers()->with('hearingFormItem')->get();
        
        foreach ($answers as $index => $answer) {
            $item = $answer->hearingFormItem;
            $questionNumber = $index + 1;
            
            $message .= "\n*Q{$questionNumber}. {$item->label}*";
            
            if ($item->required) {
                $message .= " _(必須)_";
            }
            
            $message .= "\n";
            
            // 回答内容
            $answerText = $answer->answer_text ?: '（未回答）';
            
            // チェックボックスの場合は改行を調整
            if ($item->type === 'checkbox') {
                $answerText = str_replace(',', ', ', $answerText);
            }
            
            // 複数行の場合はインデント
            if (str_contains($answerText, "\n")) {
                $lines = explode("\n", $answerText);
                $answerText = implode("\n> ", $lines);
                $message .= "> {$answerText}\n";
            } else {
                $message .= "A. {$answerText}\n";
            }
        }

        // 詳細URLを追加
        $detailUrl = $this->getDetailUrl($hearingForm->id, $formResponse->id);
        $message .= "\n────────────────────────────\n";
        $message .= "📊 <{$detailUrl}|回答詳細を見る>";

        return $message;
    }

    /**
     * 詳細ページのURLを取得
     */
    private function getDetailUrl(int $formId, int $responseId): string
    {
        // テナントのドメインを取得
        $tenant = tenant();
        if ($tenant && isset($tenant->domains[0])) {
            $domain = $tenant->domains[0]->domain;
            return "https://{$domain}/hearing-forms/{$formId}/responses/{$responseId}";
        }

        // フォールバック
        return config('app.url') . "/hearing-forms/{$formId}/responses/{$responseId}";
    }

    /**
     * フォーム回答通知を送信（notifyFormResponseのエイリアス）
     */
    public function sendFormResponseNotification($formResponse, $form, $lineUser): bool
    {
        // FormResponseオブジェクトの場合はそのまま使用
        if ($formResponse instanceof FormResponse) {
            return $this->notifyFormResponse($formResponse);
        }
        
        // 引数が別々の場合は組み立てて通知
        return $this->notifyFormResponse($formResponse);
    }

    /**
     * テスト通知を送信
     */
    public function sendTestNotification(HearingForm $hearingForm): bool
    {
        if (!$hearingForm->slack_webhook) {
            return false;
        }

        try {
            $message = "🔔 *テスト通知*\n\n";
            $message .= "フォーム「{$hearingForm->name}」のSlack通知設定が正常に動作しています。\n";
            $message .= "フォーム回答があった際に、このチャンネルに通知が送信されます。";

            $response = $this->client->post($hearingForm->slack_webhook, [
                'json' => [
                    'text' => $message,
                    'mrkdwn' => true,
                ],
                'timeout' => 10,
            ]);

            Log::info('Test Slack notification sent successfully', [
                'form_id' => $hearingForm->id,
                'status_code' => $response->getStatusCode(),
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to send test Slack notification: ' . $e->getMessage(), [
                'form_id' => $hearingForm->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}

