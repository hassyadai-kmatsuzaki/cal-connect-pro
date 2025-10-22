<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TagController extends Controller
{
    /**
     * タグ一覧を取得
     */
    public function index()
    {
        $tags = Tag::withCount('lineUsers')
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'data' => $tags,
        ]);
    }

    /**
     * タグを作成
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50|unique:tags,name',
            'color' => 'required|string|in:default,primary,secondary,success,warning,error,info',
        ], [
            'name.required' => 'タグ名は必須です',
            'name.unique' => 'このタグ名は既に使用されています',
            'name.max' => 'タグ名は50文字以内で入力してください',
            'color.required' => '色は必須です',
            'color.in' => '有効な色を選択してください',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $tag = Tag::create([
            'name' => $request->name,
            'color' => $request->color,
        ]);

        // line_users_count を含めて返す
        $tag->line_users_count = 0;

        return response()->json([
            'data' => $tag,
            'message' => 'タグを作成しました',
        ], 201);
    }

    /**
     * タグを削除
     */
    public function destroy($id)
    {
        $tag = Tag::find($id);

        if (!$tag) {
            return response()->json([
                'message' => 'タグが見つかりません',
            ], 404);
        }

        // 関連するline_user_tagsも自動削除される（カスケード削除）
        $tag->delete();

        return response()->json([
            'message' => 'タグを削除しました',
        ]);
    }

    /**
     * タグを更新（オプション）
     */
    public function update(Request $request, $id)
    {
        $tag = Tag::find($id);

        if (!$tag) {
            return response()->json([
                'message' => 'タグが見つかりません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50|unique:tags,name,' . $id,
            'color' => 'required|string|in:default,primary,secondary,success,warning,error,info',
        ], [
            'name.required' => 'タグ名は必須です',
            'name.unique' => 'このタグ名は既に使用されています',
            'name.max' => 'タグ名は50文字以内で入力してください',
            'color.required' => '色は必須です',
            'color.in' => '有効な色を選択してください',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $tag->update([
            'name' => $request->name,
            'color' => $request->color,
        ]);

        $tag->load('lineUsers');
        $tag->line_users_count = $tag->lineUsers->count();

        return response()->json([
            'data' => $tag,
            'message' => 'タグを更新しました',
        ]);
    }
}

