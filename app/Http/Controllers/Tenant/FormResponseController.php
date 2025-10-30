<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\FormResponse;
use App\Models\HearingForm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FormResponseController extends Controller
{
    /**
     * 回答一覧を取得
     */
    public function index(Request $request, $formId)
    {
        $form = HearingForm::find($formId);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        $query = FormResponse::with(['lineUser', 'answers.hearingFormItem'])
            ->where('hearing_form_id', $formId)
            ->where('status', 'completed');

        // 期間フィルター
        if ($request->has('start_date')) {
            $query->whereDate('submitted_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('submitted_at', '<=', $request->end_date);
        }

        // LINEユーザーフィルター
        if ($request->has('line_user_id')) {
            $query->where('line_user_id', $request->line_user_id);
        }

        // 検索
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('lineUser', function($q) use ($search) {
                $q->where('display_name', 'like', "%{$search}%");
            })->orWhereHas('answers', function($q) use ($search) {
                $q->where('answer_text', 'like', "%{$search}%");
            });
        }

        // ソート
        $sortBy = $request->get('sort_by', 'submitted_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // ページネーション
        $perPage = $request->get('per_page', 20);
        $responses = $query->paginate($perPage);

        // response_type を追加
        $responses->getCollection()->transform(function ($response) {
            $response->response_type = 'standalone';
            $response->answers_count = $response->answers->count();
            return $response;
        });

        return response()->json([
            'data' => $responses->items(),
            'meta' => [
                'current_page' => $responses->currentPage(),
                'per_page' => $responses->perPage(),
                'total' => $responses->total(),
                'last_page' => $responses->lastPage(),
            ],
        ]);
    }

    /**
     * 回答詳細を取得
     */
    public function show($formId, $responseId)
    {
        $form = HearingForm::find($formId);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        $response = FormResponse::with([
            'lineUser',
            'answers.hearingFormItem'
        ])->where('hearing_form_id', $formId)
          ->find($responseId);

        if (!$response) {
            return response()->json([
                'message' => '回答が見つかりません',
            ], 404);
        }

        $response->response_type = 'standalone';

        return response()->json([
            'data' => $response,
        ]);
    }

    /**
     * ユーザー別の集計を取得
     */
    public function byUser($formId)
    {
        $form = HearingForm::find($formId);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        $userStats = FormResponse::selectRaw('line_user_id, COUNT(*) as response_count, MAX(submitted_at) as latest_response_at')
            ->where('hearing_form_id', $formId)
            ->where('status', 'completed')
            ->whereNotNull('line_user_id')
            ->groupBy('line_user_id')
            ->with('lineUser')
            ->orderBy('response_count', 'desc')
            ->get()
            ->map(function ($stat) {
                return [
                    'line_user_id' => $stat->line_user_id,
                    'display_name' => $stat->lineUser ? $stat->lineUser->display_name : '不明',
                    'picture_url' => $stat->lineUser ? $stat->lineUser->picture_url : null,
                    'response_count' => $stat->response_count,
                    'latest_response_at' => $stat->latest_response_at,
                ];
            });

        return response()->json([
            'data' => $userStats,
        ]);
    }

    /**
     * 回答を削除
     */
    public function destroy($formId, $responseId)
    {
        $form = HearingForm::find($formId);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        $response = FormResponse::where('hearing_form_id', $formId)->find($responseId);

        if (!$response) {
            return response()->json([
                'message' => '回答が見つかりません',
            ], 404);
        }

        try {
            // 回答を削除（answersもカスケード削除される）
            $response->delete();

            return response()->json([
                'message' => '回答を削除しました',
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to delete form response: ' . $e->getMessage());
            
            return response()->json([
                'message' => '回答の削除に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * CSV/Excelエクスポート
     */
    public function export(Request $request, $formId)
    {
        $form = HearingForm::with('items')->find($formId);

        if (!$form) {
            return response()->json([
                'message' => 'ヒアリングフォームが見つかりません',
            ], 404);
        }

        $format = $request->get('format', 'csv'); // csv or excel

        $query = FormResponse::with(['lineUser', 'answers.hearingFormItem'])
            ->where('hearing_form_id', $formId)
            ->where('status', 'completed')
            ->orderBy('submitted_at', 'desc');

        // フィルター適用
        if ($request->has('start_date')) {
            $query->whereDate('submitted_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('submitted_at', '<=', $request->end_date);
        }

        $responses = $query->get();

        // CSVヘッダー作成
        $headers = ['回答ID', '回答日時', '回答者', 'LINEユーザーID'];
        foreach ($form->items as $item) {
            $headers[] = $item->label . ($item->required ? ' (必須)' : '');
        }

        // CSVデータ作成
        $rows = [];
        $rows[] = $headers;

        foreach ($responses as $response) {
            $row = [
                $response->id,
                $response->submitted_at ? $response->submitted_at->format('Y-m-d H:i:s') : '',
                $response->lineUser ? $response->lineUser->display_name : '不明',
                $response->lineUser ? $response->lineUser->line_user_id : '',
            ];

            // 回答を項目順に並べる
            $answersMap = [];
            foreach ($response->answers as $answer) {
                $answersMap[$answer->hearing_form_item_id] = $answer->answer_text;
            }

            foreach ($form->items as $item) {
                $row[] = $answersMap[$item->id] ?? '';
            }

            $rows[] = $row;
        }

        // CSV生成
        if ($format === 'csv') {
            $filename = 'form_responses_' . $formId . '_' . date('YmdHis') . '.csv';
            $handle = fopen('php://temp', 'r+');
            
            // BOM追加（Excel対応）
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            
            rewind($handle);
            $csv = stream_get_contents($handle);
            fclose($handle);

            return response($csv, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename={$filename}",
            ]);
        }

        // TODO: Excel形式のエクスポート実装
        return response()->json([
            'message' => 'Excel形式は近日実装予定です',
        ], 501);
    }
}

