<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\UserInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InvitationController extends Controller
{
    /**
     * 招待確認ページ表示
     */
    public function show($token)
    {
        $invitation = UserInvitation::where('token', $token)->first();

        if (!$invitation) {
            return response()->json([
                'message' => '無効な招待リンクです',
            ], 404);
        }

        if (!$invitation->isValid()) {
            if ($invitation->accepted_at) {
                return response()->json([
                    'message' => 'この招待は既に使用されています',
                ], 422);
            } else {
                return response()->json([
                    'message' => 'この招待は期限切れです',
                ], 422);
            }
        }

        // 既存ユーザーチェック
        $existingUser = User::where('email', $invitation->email)->first();
        if ($existingUser) {
            return response()->json([
                'message' => 'このメールアドレスは既に登録されています',
            ], 422);
        }

        return response()->json([
            'data' => [
                'invitation' => $invitation->load('inviter'),
                'tenant_name' => tenant('company_name'),
            ],
        ]);
    }

    /**
     * 招待を受諾してアカウント作成
     */
    public function accept(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
            'terms_accepted' => 'required|accepted',
        ], [
            'token.required' => '招待トークンは必須です',
            'password.required' => 'パスワードは必須です',
            'password.min' => 'パスワードは8文字以上で入力してください',
            'password.confirmed' => 'パスワード確認が一致しません',
            'terms_accepted.required' => '利用規約への同意が必要です',
            'terms_accepted.accepted' => '利用規約に同意してください',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $invitation = UserInvitation::where('token', $request->token)->first();

        if (!$invitation) {
            return response()->json([
                'message' => '無効な招待リンクです',
            ], 404);
        }

        if (!$invitation->isValid()) {
            if ($invitation->accepted_at) {
                return response()->json([
                    'message' => 'この招待は既に使用されています',
                ], 422);
            } else {
                return response()->json([
                    'message' => 'この招待は期限切れです',
                ], 422);
            }
        }

        // 既存ユーザーチェック
        $existingUser = User::where('email', $invitation->email)->first();
        if ($existingUser) {
            return response()->json([
                'message' => 'このメールアドレスは既に登録されています',
            ], 422);
        }

        try {
            DB::beginTransaction();

            // ユーザーを作成
            $user = User::create([
                'name' => $invitation->name,
                'email' => $invitation->email,
                'password' => Hash::make($request->password),
                'role' => $invitation->role,
            ]);

            // 招待を完了としてマーク
            $invitation->markAsAccepted();

            DB::commit();

            // 自動ログイン
            Auth::login($user);

            return response()->json([
                'data' => $user,
                'message' => 'アカウントが作成されました',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Failed to accept invitation: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'アカウントの作成に失敗しました',
            ], 500);
        }
    }
}