<?php

namespace App\Http\Controllers;

use App\Models\FormResponse;
use App\Models\FormResponseAnswer;
use App\Models\HearingForm;
use App\Models\LineUser;
use App\Services\FormSlackNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PublicFormController extends Controller
{
    private $slackService;

    public function __construct(FormSlackNotificationService $slackService)
    {
        $this->slackService = $slackService;
    }

    /**
     * フォーム情報を取得（公開API）
     */
    public function show($formKey)
    {
        $form = HearingForm::with('items')
            ->where('form_key', $formKey)
            ->where('is_active', true)
            ->first();

        if (!$form) {
            return response()->json([
                'message' => 'フォームが見つからないか、無効になっています',
            ], 404);
        }

        return response()->json([
            'data' => [
                'id' => $form->id,
                'name' => $form->name,
                'description' => $form->description,
                'items' => $form->items,
                'settings' => $form->settings,
            ],
        ]);
    }

    /**
     * フォーム送信（公開API）
     */
    public function submit(Request $request, $formKey)
    {
        $form = HearingForm::with('items')
            ->where('form_key', $formKey)
            ->where('is_active', true)
            ->first();

        if (!$form) {
            return response()->json([
                'message' => 'フォームが見つからないか、無効になっています',
            ], 404);
        }

        // バリデーション
        $rules = [
            'line_user_id' => 'nullable|string',
            'answers' => 'required|array',
        ];

        // 各項目のバリデーション
        foreach ($form->items as $item) {
            $rule = [];
            
            if ($item->required) {
                $rule[] = 'required';
            } else {
                $rule[] = 'nullable';
            }

            switch ($item->type) {
                case 'email':
                    $rule[] = 'email';
                    break;
                case 'number':
                    $rule[] = 'numeric';
                    break;
                case 'date':
                    $rule[] = 'date';
                    break;
                case 'tel':
                    $rule[] = 'string';
                    break;
                default:
                    $rule[] = 'string';
            }

            $rules["answers.{$item->id}"] = implode('|', $rule);
        }

        $validator = Validator::make($request->all(), $rules, [
            'answers.required' => '回答を入力してください',
            'answers.*.required' => 'この項目は必須です',
            'answers.*.email' => '有効なメールアドレスを入力してください',
            'answers.*.numeric' => '数値を入力してください',
            'answers.*.date' => '有効な日付を入力してください',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // LINEユーザー情報を取得または作成
            $lineUser = null;
            if ($request->line_user_id) {
                $lineUser = LineUser::where('line_user_id', $request->line_user_id)->first();
            }

            // 回答トークン生成
            $responseToken = 'resp_' . Str::random(48);
            while (FormResponse::where('response_token', $responseToken)->exists()) {
                $responseToken = 'resp_' . Str::random(48);
            }

            // フォーム回答を作成
            $formResponse = FormResponse::create([
                'hearing_form_id' => $form->id,
                'line_user_id' => $lineUser ? $lineUser->id : null,
                'response_token' => $responseToken,
                'status' => 'completed',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'submitted_at' => now(),
            ]);

            // 各回答を保存
            foreach ($request->answers as $itemId => $answerText) {
                // checkbox の場合は配列を文字列に変換
                if (is_array($answerText)) {
                    $answerText = implode(', ', $answerText);
                }

                FormResponseAnswer::create([
                    'form_response_id' => $formResponse->id,
                    'hearing_form_item_id' => $itemId,
                    'answer_text' => $answerText,
                ]);
            }

            // 総回答数を更新
            $form->increment('total_responses');

            DB::commit();

            // Slack通知を送信（非同期推奨だが、ここでは同期実行）
            if ($form->slack_notify && $form->slack_webhook) {
                $formResponse->load(['lineUser', 'answers.hearingFormItem']);
                $this->slackService->notifyFormResponse($formResponse);
            }

            // 完了メッセージ
            $completionMessage = $form->settings['completion_message'] ?? 
                'ご回答ありがとうございました。\n内容を確認後、ご連絡させていただきます。';

            return response()->json([
                'message' => '送信が完了しました',
                'data' => [
                    'response_token' => $responseToken,
                    'completion_message' => $completionMessage,
                ],
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to submit form response: ' . $e->getMessage(), [
                'form_key' => $formKey,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => '送信に失敗しました。もう一度お試しください。',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 下書き保存（公開API）
     */
    public function saveDraft(Request $request, $formKey)
    {
        $form = HearingForm::where('form_key', $formKey)
            ->where('is_active', true)
            ->first();

        if (!$form) {
            return response()->json([
                'message' => 'フォームが見つからないか、無効になっています',
            ], 404);
        }

        DB::beginTransaction();
        try {
            // LINEユーザー情報を取得
            $lineUser = null;
            if ($request->line_user_id) {
                $lineUser = LineUser::where('line_user_id', $request->line_user_id)->first();
            }

            // 既存の下書きがあるかチェック
            $existingDraft = FormResponse::where('hearing_form_id', $form->id)
                ->where('line_user_id', $lineUser ? $lineUser->id : null)
                ->where('status', 'draft')
                ->first();

            if ($existingDraft) {
                // 既存の下書きを更新
                $existingDraft->update([
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                // 既存の回答を削除
                $existingDraft->answers()->delete();

                $formResponse = $existingDraft;
            } else {
                // 新規下書きを作成
                $responseToken = 'draft_' . Str::random(48);
                while (FormResponse::where('response_token', $responseToken)->exists()) {
                    $responseToken = 'draft_' . Str::random(48);
                }

                $formResponse = FormResponse::create([
                    'hearing_form_id' => $form->id,
                    'line_user_id' => $lineUser ? $lineUser->id : null,
                    'response_token' => $responseToken,
                    'status' => 'draft',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }

            // 回答を保存
            foreach ($request->answers as $itemId => $answerText) {
                // checkbox の場合は配列を文字列に変換
                if (is_array($answerText)) {
                    $answerText = implode(', ', $answerText);
                }

                FormResponseAnswer::create([
                    'form_response_id' => $formResponse->id,
                    'hearing_form_item_id' => $itemId,
                    'answer_text' => $answerText,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => '下書きを保存しました',
                'data' => [
                    'response_token' => $formResponse->response_token,
                ],
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save draft: ' . $e->getMessage());
            
            return response()->json([
                'message' => '下書きの保存に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 下書き取得（公開API）
     */
    public function getDraft($formKey, $token)
    {
        $form = HearingForm::where('form_key', $formKey)->first();

        if (!$form) {
            return response()->json([
                'message' => 'フォームが見つかりません',
            ], 404);
        }

        $draft = FormResponse::with('answers.hearingFormItem')
            ->where('hearing_form_id', $form->id)
            ->where('response_token', $token)
            ->where('status', 'draft')
            ->first();

        if (!$draft) {
            return response()->json([
                'message' => '下書きが見つかりません',
            ], 404);
        }

        // 回答を整形
        $answers = [];
        foreach ($draft->answers as $answer) {
            $answers[$answer->hearing_form_item_id] = $answer->answer_text;
        }

        return response()->json([
            'data' => [
                'response_token' => $draft->response_token,
                'answers' => $answers,
                'updated_at' => $draft->updated_at,
            ],
        ]);
    }
}

