<?php

namespace App\Http\Controllers;

use App\Models\MessageTemplate;
use App\Services\MessageTemplateService;
use App\Services\LineMessagingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MessageTemplateController extends Controller
{
    protected $messageTemplateService;
    protected $lineMessagingService;

    public function __construct(
        MessageTemplateService $messageTemplateService,
        LineMessagingService $lineMessagingService
    ) {
        $this->messageTemplateService = $messageTemplateService;
        $this->lineMessagingService = $lineMessagingService;
    }

    /**
     * テンプレート一覧取得
     */
    public function index(Request $request): JsonResponse
    {
        $query = MessageTemplate::with('items');

        // フィルター
        if ($request->has('templatable_type')) {
            $query->where('templatable_type', $request->templatable_type);
        }

        if ($request->has('templatable_id')) {
            $query->where('templatable_id', $request->templatable_id);
        }

        if ($request->has('message_type')) {
            $query->where('message_type', $request->message_type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = $request->get('per_page', 20);
        $templates = $query->paginate($perPage);

        return response()->json([
            'data' => $templates->items(),
            'meta' => [
                'current_page' => $templates->currentPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
                'last_page' => $templates->lastPage(),
            ],
        ]);
    }

    /**
     * テンプレート詳細取得
     */
    public function show(MessageTemplate $template): JsonResponse
    {
        $template->load(['items', 'templatable']);

        return response()->json($template);
    }

    /**
     * テンプレート作成
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'templatable_type' => 'required|in:App\Models\Calendar,App\Models\InflowSource,App\Models\HearingForm',
            'templatable_id' => 'required|integer',
            'message_type' => 'required|in:reservation_created,reservation_confirmed,reservation_cancelled,reminder,welcome,form_submitted',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'required|boolean',
            'items' => 'required|array|min:1|max:5',
            'items.*.order' => 'required|integer|between:1,5|distinct',
            'items.*.type' => 'required|in:text,image',
            'items.*.content' => 'required_if:items.*.type,text|string|max:5000',
            'items.*.image_url' => 'required_if:items.*.type,image|url',
            'items.*.image_preview_url' => 'required_if:items.*.type,image|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => '入力内容に誤りがあります',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $template = $this->messageTemplateService->createTemplate($request->all());

            return response()->json([
                'success' => true,
                'message' => 'テンプレートを作成しました',
                'data' => $template,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create message template: ' . $e->getMessage(), [
                'data' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'テンプレートの作成に失敗しました',
            ], 500);
        }
    }

    /**
     * テンプレート更新
     */
    public function update(Request $request, MessageTemplate $template): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'templatable_type' => 'sometimes|required|in:App\Models\Calendar,App\Models\InflowSource,App\Models\HearingForm',
            'templatable_id' => 'sometimes|required|integer',
            'message_type' => 'sometimes|required|in:reservation_created,reservation_confirmed,reservation_cancelled,reminder,welcome,form_submitted',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|required|boolean',
            'items' => 'sometimes|required|array|min:1|max:5',
            'items.*.order' => 'required|integer|between:1,5|distinct',
            'items.*.type' => 'required|in:text,image',
            'items.*.content' => 'required_if:items.*.type,text|string|max:5000',
            'items.*.image_url' => 'required_if:items.*.type,image|url',
            'items.*.image_preview_url' => 'required_if:items.*.type,image|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => '入力内容に誤りがあります',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $template = $this->messageTemplateService->updateTemplate($template, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'テンプレートを更新しました',
                'data' => $template,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update message template: ' . $e->getMessage(), [
                'template_id' => $template->id,
                'data' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'テンプレートの更新に失敗しました',
            ], 500);
        }
    }

    /**
     * テンプレート削除
     */
    public function destroy(MessageTemplate $template): JsonResponse
    {
        try {
            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'テンプレートを削除しました',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete message template: ' . $e->getMessage(), [
                'template_id' => $template->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'テンプレートの削除に失敗しました',
            ], 500);
        }
    }

    /**
     * プレビュー送信
     */
    public function preview(Request $request, MessageTemplate $template): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'test_line_user_id' => 'required|string',
            'sample_data' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => '入力内容に誤りがあります',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $sampleData = $request->get('sample_data', [
                'customer_name' => '山田太郎',
                'reservation_datetime' => '2025年10月30日 14:00',
                'duration' => 60,
            ]);

            $success = $this->lineMessagingService->sendTemplate(
                $request->test_line_user_id,
                $template,
                $sampleData
            );

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'プレビューメッセージを送信しました',
                    'sent_at' => now()->toIso8601String(),
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'プレビューメッセージの送信に失敗しました',
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Failed to send preview message: ' . $e->getMessage(), [
                'template_id' => $template->id,
                'test_line_user_id' => $request->test_line_user_id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'プレビューメッセージの送信に失敗しました',
            ], 500);
        }
    }

    /**
     * 画像アップロード
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|image|mimes:jpeg,png,jpg|max:10240', // 最大10MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => '入力内容に誤りがあります',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->messageTemplateService->uploadImage($request->file('file'));

            return response()->json([
                'success' => true,
                'message' => '画像をアップロードしました',
                'data' => $result,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to upload image: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => '画像のアップロードに失敗しました',
            ], 500);
        }
    }
}

