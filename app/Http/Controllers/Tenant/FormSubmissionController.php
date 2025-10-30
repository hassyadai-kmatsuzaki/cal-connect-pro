<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\FormSubmission;
use App\Services\LineMessagingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FormSubmissionController extends Controller
{
    private $lineMessagingService;

    public function __construct(LineMessagingService $lineMessagingService)
    {
        $this->lineMessagingService = $lineMessagingService;
    }

    /**
     * フォーム回答一覧
     */
    public function index(Request $request)
    {
        $query = FormSubmission::with(['hearingForm', 'lineUser', 'inflowSource'])
            ->latest('submitted_at');

        // フィルタリング
        if ($request->hearing_form_id) {
            $query->where('hearing_form_id', $request->hearing_form_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->line_user_id) {
            $query->where('line_user_id', $request->line_user_id);
        }

        if ($request->from_date) {
            $query->whereDate('submitted_at', '>=', $request->from_date);
        }

        if ($request->to_date) {
            $query->whereDate('submitted_at', '<=', $request->to_date);
        }

        // 検索
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('lineUser', function ($q2) use ($search) {
                    $q2->where('display_name', 'like', "%{$search}%");
                })->orWhereHas('hearingForm', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })->orWhereHas('answers', function ($q2) use ($search) {
                    $q2->where('answer_text', 'like', "%{$search}%");
                });
            });
        }

        $perPage = $request->per_page ?? 15;
        $submissions = $query->paginate($perPage);

        return response()->json($submissions);
    }

    /**
     * フォーム回答詳細
     */
    public function show($id)
    {
        $submission = FormSubmission::with([
            'hearingForm',
            'lineUser',
            'inflowSource',
            'answers.hearingFormItem'
        ])->findOrFail($id);

        // 未読の場合、既読にする
        if ($submission->isPending()) {
            $submission->markAsRead();
        }

        return response()->json(['data' => $submission]);
    }

    /**
     * フォーム回答更新
     */
    public function update(Request $request, $id)
    {
        $submission = FormSubmission::findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,read,replied,archived',
            'notes' => 'nullable|string',
        ]);

        $submission->update($validated);

        return response()->json([
            'data' => $submission,
            'message' => '更新しました'
        ]);
    }

    /**
     * LINEで返信
     */
    public function reply(Request $request, $id)
    {
        $submission = FormSubmission::with('lineUser')->findOrFail($id);

        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        if (!$submission->lineUser || !$submission->lineUser->line_user_id) {
            return response()->json([
                'message' => 'LINEユーザー情報が見つかりません'
            ], 404);
        }

        // LINEメッセージを送信
        $success = $this->lineMessagingService->sendMessage(
            $submission->lineUser->line_user_id,
            $validated['message']
        );

        if ($success) {
            $submission->markAsReplied();

            return response()->json([
                'data' => $submission,
                'message' => '返信を送信しました'
            ]);
        }

        return response()->json([
            'message' => '返信の送信に失敗しました'
        ], 500);
    }

    /**
     * フォーム回答削除
     */
    public function destroy($id)
    {
        $submission = FormSubmission::findOrFail($id);
        $submission->delete();

        return response()->json([
            'message' => '削除しました'
        ]);
    }
}

