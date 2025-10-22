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
        ], [
            'name.required' => 'フォーム名は必須です',
            'items.required' => 'フォーム項目は必須です',
            'items.min' => '最低1つの項目が必要です',
            'items.*.label.required' => '項目ラベルは必須です',
            'items.*.type.required' => '項目タイプは必須です',
            'items.*.type.in' => '無効な項目タイプです',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // フォーム作成
            $form = HearingForm::create([
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => true,
            ]);

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
        ], [
            'name.required' => 'フォーム名は必須です',
            'items.required' => 'フォーム項目は必須です',
            'items.min' => '最低1つの項目が必要です',
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

        $form->update([
            'is_active' => !$form->is_active,
        ]);

        return response()->json([
            'data' => $form,
            'message' => $form->is_active ? 'フォームを有効にしました' : 'フォームを無効にしました',
        ]);
    }
}

