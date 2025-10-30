<?php

namespace App\Http\Controllers;

use App\Models\HearingForm;
use App\Models\FormSubmission;
use App\Services\FormSubmissionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class FormController extends Controller
{
    protected $formSubmissionService;

    public function __construct(FormSubmissionService $formSubmissionService)
    {
        $this->formSubmissionService = $formSubmissionService;
    }

    /**
     * フォーム取得（LIFF用）
     */
    public function show(HearingForm $form): JsonResponse
    {
        if (!$form->is_active || !$form->enable_standalone) {
            return response()->json([
                'success' => false,
                'message' => 'このフォームは現在利用できません',
            ], 404);
        }

        $form->load('items');

        return response()->json([
            'id' => $form->id,
            'name' => $form->name,
            'description' => $form->description,
            'is_active' => $form->is_active,
            'enable_standalone' => $form->enable_standalone,
            'items' => $form->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'label' => $item->label,
                    'type' => $item->type,
                    'placeholder' => $item->placeholder,
                    'help_text' => $item->help_text,
                    'required' => $item->required,
                    'order' => $item->order,
                    'options' => $item->options,
                ];
            }),
        ]);
    }

    /**
     * フォーム送信（LIFF用）
     */
    public function submit(Request $request, HearingForm $form): JsonResponse
    {
        if (!$form->is_active || !$form->enable_standalone) {
            return response()->json([
                'success' => false,
                'message' => 'このフォームは現在利用できません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'line_user_id' => 'nullable|string',
            'inflow_source_id' => 'nullable|integer|exists:inflow_sources,id',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'answers' => 'required|array',
            'answers.*.hearing_form_item_id' => 'required|integer|exists:hearing_form_items,id',
            'answers.*.answer_text' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => '入力内容に誤りがあります',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $request->all();
            $data['ip_address'] = $request->ip();
            $data['user_agent'] = $request->userAgent();

            $submission = $this->formSubmissionService->submit($form, $data);

            return response()->json([
                'success' => true,
                'message' => 'フォームを送信しました',
                'data' => [
                    'submission_id' => $submission->id,
                    'hearing_form_id' => $submission->hearing_form_id,
                    'customer_name' => $submission->customer_name,
                    'customer_email' => $submission->customer_email,
                    'submitted_at' => $submission->submitted_at->toIso8601String(),
                    'auto_reply_sent' => $form->enable_auto_reply && $submission->line_user_id,
                    'slack_notified' => $submission->isSlackNotified(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit form: ' . $e->getMessage(), [
                'form_id' => $form->id,
                'data' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'フォームの送信に失敗しました',
            ], 500);
        }
    }

    /**
     * フォーム送信履歴取得（管理画面用）
     */
    public function submissions(Request $request, HearingForm $form): JsonResponse
    {
        $query = $form->formSubmissions()
            ->with(['lineUser', 'inflowSource', 'answers.hearingFormItem'])
            ->orderBy('submitted_at', 'desc');

        // フィルター
        if ($request->has('date_from')) {
            $query->whereDate('submitted_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('submitted_at', '<=', $request->date_to);
        }

        if ($request->has('inflow_source_id')) {
            $query->where('inflow_source_id', $request->inflow_source_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 20);
        $submissions = $query->paginate($perPage);

        // 統計情報
        $statistics = [
            'total' => $form->formSubmissions()->count(),
            'this_month' => $form->formSubmissions()
                ->whereMonth('submitted_at', now()->month)
                ->count(),
            'this_week' => $form->formSubmissions()
                ->whereBetween('submitted_at', [now()->startOfWeek(), now()->endOfWeek()])
                ->count(),
            'today' => $form->formSubmissions()
                ->whereDate('submitted_at', today())
                ->count(),
        ];

        return response()->json([
            'data' => $submissions->items(),
            'meta' => [
                'current_page' => $submissions->currentPage(),
                'per_page' => $submissions->perPage(),
                'total' => $submissions->total(),
                'last_page' => $submissions->lastPage(),
            ],
            'statistics' => $statistics,
        ]);
    }

    /**
     * フォーム送信詳細取得（管理画面用）
     */
    public function submissionDetail(FormSubmission $submission): JsonResponse
    {
        $submission->load([
            'hearingForm',
            'lineUser',
            'inflowSource',
            'answers.hearingFormItem',
        ]);

        return response()->json($submission);
    }

    /**
     * フォーム設定取得
     */
    public function getSettings(HearingForm $form): JsonResponse
    {
        return response()->json([
            'id' => $form->id,
            'name' => $form->name,
            'description' => $form->description,
            'is_active' => $form->is_active,
            'enable_standalone' => $form->enable_standalone,
            'standalone_liff_url' => $form->standalone_liff_url,
            'enable_auto_reply' => $form->enable_auto_reply,
            'slack_notify' => $form->slack_notify,
            'slack_webhook' => $form->slack_webhook,
            'slack_message' => $form->slack_message,
        ]);
    }

    /**
     * フォーム設定更新
     */
    public function updateSettings(Request $request, HearingForm $form): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'enable_standalone' => 'sometimes|boolean',
            'enable_auto_reply' => 'sometimes|boolean',
            'slack_notify' => 'sometimes|boolean',
            'slack_webhook' => 'nullable|url',
            'slack_message' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => '入力内容に誤りがあります',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $form->update($request->only([
                'enable_standalone',
                'enable_auto_reply',
                'slack_notify',
                'slack_webhook',
                'slack_message',
            ]));

            // standalone_liff_urlを生成（enable_standaloneがtrueの場合）
            if ($form->enable_standalone && !$form->standalone_liff_url) {
                $liffId = config('line.liff_id');
                $form->update([
                    'standalone_liff_url' => "https://liff.line.me/{$liffId}/form/{$form->id}",
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => '設定を更新しました',
                'data' => $form->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update form settings: ' . $e->getMessage(), [
                'form_id' => $form->id,
                'data' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => '設定の更新に失敗しました',
            ], 500);
        }
    }
}

