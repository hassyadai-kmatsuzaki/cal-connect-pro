<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\HearingForm;
use App\Models\HearingFormItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class HearingFormController extends Controller
{
    /**
     * ヒアリングフォーム一覧を取得
     */
    public function index(Request $request)
    {
        $query = HearingForm::withCount('items');
        
        // 検索フィルター
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        // アクティブ状態フィルター
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }
        
        $forms = $query->orderBy('created_at', 'desc')->get();
        
        // 各フォームがカレンダーで使用中かチェック
        foreach ($forms as $form) {
            $form->is_used_in_active_calendar = \App\Models\Calendar::where('hearing_form_id', $form->id)->where('is_active', true)->exists();
        }
        
        return response()->json([
            'data' => $forms,
        ]);
    }

    /**
     * ヒアリングフォーム詳細を取得
     */
    public function show($id)
    {
        $form = HearingForm::with(['items' => function($query) {
            $query->orderBy('order');
        }])->find($id);
        
        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }
        
        return response()->json([
            'data' => $form,
        ]);
    }

    /**
     * ヒアリングフォームを作成
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.label' => 'required|string|max:255',
            'items.*.type' => 'required|in:text,textarea,email,tel,number,select,radio,checkbox,date,time',
            'items.*.required' => 'boolean',
            'items.*.options' => 'nullable|array',
            'items.*.options.*' => 'string',
            'items.*.placeholder' => 'nullable|string|max:255',
            'items.*.help_text' => 'nullable|string|max:500',
            'settings' => 'nullable|array',
            'settings.completion_message' => 'nullable|string',
            'slack_notify' => 'boolean',
            'slack_webhook' => 'nullable|string|url',
        ], [
            'name.required' => 'フォーム名は必須です',
            'items.required' => 'フォーム項目は必須です',
            'items.min' => '最低1つの項目が必要です',
            'items.*.label.required' => '項目ラベルは必須です',
            'items.*.type.required' => '項目タイプは必須です',
            'items.*.type.in' => '無効な項目タイプです',
            'slack_webhook.url' => 'Slack Webhook URLの形式が正しくありません',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // フォームキーを生成
            $formKey = \Illuminate\Support\Str::random(32);
            while (HearingForm::where('form_key', $formKey)->exists()) {
                $formKey = \Illuminate\Support\Str::random(32);
            }

            // フォーム作成
            $form = HearingForm::create([
                'name' => $request->name,
                'description' => $request->description,
                'form_key' => $formKey,
                'settings' => $request->settings,
                'slack_notify' => $request->slack_notify ?? false,
                'slack_webhook' => $request->slack_webhook,
                'is_active' => true,
            ]);

            // LIFF URLを更新
            $form->updateLiffUrl();

            // 項目作成
            foreach ($request->items as $index => $item) {
                HearingFormItem::create([
                    'hearing_form_id' => $form->id,
                    'label' => $item['label'],
                    'type' => $item['type'],
                    'required' => $item['required'] ?? false,
                    'options' => $item['options'] ?? null,
                    'placeholder' => $item['placeholder'] ?? null,
                    'help_text' => $item['help_text'] ?? null,
                    'order' => $index,
                ]);
            }

            DB::commit();

            $form->load('items');

            return response()->json([
                'data' => $form,
                'message' => 'ヒアリングフォームを作成しました',
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create hearing form: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'ヒアリングフォームの作成に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ヒアリングフォームを更新
     */
    public function update(Request $request, $id)
    {
        $form = HearingForm::find($id);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.label' => 'required|string|max:255',
            'items.*.type' => 'required|in:text,textarea,email,tel,number,select,radio,checkbox,date,time',
            'items.*.required' => 'boolean',
            'items.*.options' => 'nullable|array',
            'items.*.options.*' => 'string',
            'items.*.placeholder' => 'nullable|string|max:255',
            'items.*.help_text' => 'nullable|string|max:500',
            'settings' => 'nullable|array',
            'settings.completion_message' => 'nullable|string',
            'slack_notify' => 'boolean',
            'slack_webhook' => 'nullable|string|url',
        ], [
            'name.required' => 'フォーム名は必須です',
            'items.required' => 'フォーム項目は必須です',
            'items.min' => '最低1つの項目が必要です',
            'slack_webhook.url' => 'Slack Webhook URLの形式が正しくありません',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // フォーム更新
            $form->update([
                'name' => $request->name,
                'description' => $request->description,
                'settings' => $request->settings,
                'slack_notify' => $request->slack_notify ?? false,
                'slack_webhook' => $request->slack_webhook,
            ]);

            // 既存の項目を削除
            $form->items()->delete();

            // 新しい項目を作成
            foreach ($request->items as $index => $item) {
                HearingFormItem::create([
                    'hearing_form_id' => $form->id,
                    'label' => $item['label'],
                    'type' => $item['type'],
                    'required' => $item['required'] ?? false,
                    'options' => $item['options'] ?? null,
                    'placeholder' => $item['placeholder'] ?? null,
                    'help_text' => $item['help_text'] ?? null,
                    'order' => $index,
                ]);
            }

            DB::commit();

            $form->load('items');

            return response()->json([
                'data' => $form,
                'message' => 'ヒアリングフォームを更新しました',
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to update hearing form: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'ヒアリングフォームの更新に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ヒアリングフォームを削除
     */
    public function destroy($id)
    {
        $form = HearingForm::find($id);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        // カレンダーで使用されているかチェック
        $calendarsCount = \App\Models\Calendar::where('hearing_form_id', $id)->count();
        
        if ($calendarsCount > 0) {
            return response()->json([
                'message' => "このフォームは{$calendarsCount}個のカレンダーで使用されているため、削除できません",
            ], 400);
        }

        DB::beginTransaction();
        try {
            // 項目も一緒に削除（カスケード）
            $form->items()->delete();
            $form->delete();

            DB::commit();

            return response()->json([
                'message' => 'ヒアリングフォームを削除しました',
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to delete hearing form: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'ヒアリングフォームの削除に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ヒアリングフォームの有効/無効を切り替え
     */
    public function toggle($id)
    {
        $form = HearingForm::find($id);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        // 無効にしようとする場合、カレンダーで使用中かチェック
        if ($form->is_active) {
            $calendarsCount = \App\Models\Calendar::where('hearing_form_id', $id)->where('is_active', true)->count();
            
            if ($calendarsCount > 0) {
                return response()->json([
                    'message' => "このフォームは{$calendarsCount}個のアクティブなカレンダーで使用されているため、無効にできません",
                ], 400);
            }
        }

        $form->update([
            'is_active' => !$form->is_active,
        ]);

        return response()->json([
            'data' => $form,
            'message' => $form->is_active ? 'フォームを有効にしました' : 'フォームを無効にしました',
        ]);
    }

    /**
     * フォームを複製
     */
    public function duplicate($id)
    {
        $form = HearingForm::with('items')->find($id);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        DB::beginTransaction();
        try {
            // フォームキーを生成
            $formKey = \Illuminate\Support\Str::random(32);
            while (HearingForm::where('form_key', $formKey)->exists()) {
                $formKey = \Illuminate\Support\Str::random(32);
            }

            // フォーム複製
            $newForm = HearingForm::create([
                'name' => $form->name . ' (コピー)',
                'description' => $form->description,
                'form_key' => $formKey,
                'settings' => $form->settings,
                'slack_notify' => $form->slack_notify,
                'slack_webhook' => $form->slack_webhook,
                'is_active' => false, // 複製したフォームは無効状態で作成
            ]);

            // LIFF URLを更新
            $newForm->updateLiffUrl();

            // 項目も複製
            foreach ($form->items as $item) {
                HearingFormItem::create([
                    'hearing_form_id' => $newForm->id,
                    'label' => $item->label,
                    'type' => $item->type,
                    'required' => $item->required,
                    'options' => $item->options,
                    'placeholder' => $item->placeholder,
                    'help_text' => $item->help_text,
                    'order' => $item->order,
                ]);
            }

            DB::commit();

            $newForm->load('items');

            return response()->json([
                'data' => $newForm,
                'message' => 'フォームを複製しました',
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to duplicate hearing form: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'フォームの複製に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * LIFF URLを取得
     */
    public function getLiffUrl($id)
    {
        $form = HearingForm::find($id);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        return response()->json([
            'data' => [
                'liff_url' => $form->getLiffUrl(),
                'form_key' => $form->form_key,
            ],
        ]);
    }

    /**
     * フォームキーを再生成
     */
    public function regenerateKey($id)
    {
        $form = HearingForm::find($id);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        try {
            $formKey = $form->generateFormKey();
            $form->update([
                'form_key' => $formKey,
            ]);
            $form->updateLiffUrl();

            return response()->json([
                'data' => [
                    'form_key' => $formKey,
                    'liff_url' => $form->liff_url,
                ],
                'message' => 'フォームキーを再生成しました',
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to regenerate form key: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'フォームキーの再生成に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 統計情報を取得
     */
    public function statistics($id)
    {
        $form = HearingForm::find($id);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        $now = \Carbon\Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfWeek = $now->copy()->startOfWeek();
        $startOfDay = $now->copy()->startOfDay();

        // 総回答数
        $totalResponses = $form->formResponses()->where('status', 'completed')->count();

        // 今月の回答数
        $thisMonth = $form->formResponses()
            ->where('status', 'completed')
            ->where('submitted_at', '>=', $startOfMonth)
            ->count();

        // 今週の回答数
        $thisWeek = $form->formResponses()
            ->where('status', 'completed')
            ->where('submitted_at', '>=', $startOfWeek)
            ->count();

        // 今日の回答数
        $today = $form->formResponses()
            ->where('status', 'completed')
            ->where('submitted_at', '>=', $startOfDay)
            ->count();

        // 過去7日間の日別回答数
        $responseRateByDay = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $count = $form->formResponses()
                ->where('status', 'completed')
                ->whereDate('submitted_at', $date->toDateString())
                ->count();
            
            $responseRateByDay[] = [
                'date' => $date->toDateString(),
                'count' => $count,
            ];
        }

        // 平均回答時間（秒）
        $averageCompletionTime = 150; // TODO: 実装予定

        // タイプ別回答数
        $responseByType = [
            'standalone' => $totalResponses,
            'calendar' => \App\Models\ReservationAnswer::whereHas('reservation', function($q) use ($form) {
                $q->whereHas('calendar', function($q2) use ($form) {
                    $q2->where('hearing_form_id', $form->id);
                });
            })->distinct('reservation_id')->count(),
        ];

        return response()->json([
            'data' => [
                'total_responses' => $totalResponses,
                'this_month' => $thisMonth,
                'this_week' => $thisWeek,
                'today' => $today,
                'average_completion_time' => $averageCompletionTime,
                'response_rate_by_day' => $responseRateByDay,
                'response_by_type' => $responseByType,
            ],
        ]);
    }

    /**
     * Slack通知のテスト送信
     */
    public function testSlackNotification($id)
    {
        $form = HearingForm::find($id);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        if (!$form->slack_webhook) {
            return response()->json([
                'message' => 'Slack Webhook URLが設定されていません',
            ], 400);
        }

        $slackService = new \App\Services\FormSlackNotificationService();
        $result = $slackService->sendTestNotification($form);

        if ($result) {
            return response()->json([
                'message' => 'テスト通知を送信しました',
            ]);
        } else {
            return response()->json([
                'message' => 'テスト通知の送信に失敗しました',
            ], 500);
        }
    }
}

