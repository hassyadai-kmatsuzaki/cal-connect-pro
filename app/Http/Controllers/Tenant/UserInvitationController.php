<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\UserInvitation;
use App\Models\User;
use App\Mail\InviteUserMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserInvitationController extends Controller
{
    /**
     * 招待一覧を取得
     */
    public function index(Request $request)
    {
        $query = UserInvitation::with('inviter')
            ->orderBy('created_at', 'desc');

        // 検索フィルター
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // ステータスフィルター
        if ($request->has('status')) {
            switch ($request->status) {
                case 'valid':
                    $query->valid();
                    break;
                case 'expired':
                    $query->expired();
                    break;
                case 'accepted':
                    $query->whereNotNull('accepted_at');
                    break;
            }
        }

        $invitations = $query->paginate(20);

        return response()->json([
            'data' => $invitations,
        ]);
    }

    /**
     * 招待を作成
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'role' => 'required|in:admin,user',
        ], [
            'name.required' => '名前は必須です',
            'email.required' => 'メールアドレスは必須です',
            'email.email' => '有効なメールアドレスを入力してください',
            'role.required' => '権限は必須です',
            'role.in' => '権限はadminまたはuserを選択してください',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 既存ユーザーチェック
        $existingUser = User::where('email', $request->email)->first();
        if ($existingUser) {
            return response()->json([
                'message' => 'このメールアドレスは既に登録されています',
            ], 422);
        }

        // 既存の有効な招待チェック
        $existingInvitation = UserInvitation::where('email', $request->email)
            ->valid()
            ->first();
        if ($existingInvitation) {
            return response()->json([
                'message' => 'このメールアドレスには既に有効な招待が送信されています',
            ], 422);
        }

        try {
            DB::beginTransaction();

            // 招待を作成
            $invitation = UserInvitation::create([
                'email' => $request->email,
                'name' => $request->name,
                'role' => $request->role,
                'token' => UserInvitation::generateToken(),
                'invited_by' => auth()->id(),
                'expires_at' => UserInvitation::getExpirationDate(),
            ]);

            // 招待メールを送信
            Mail::to($request->email)->send(new InviteUserMail($invitation));

            DB::commit();

            return response()->json([
                'data' => $invitation->load('inviter'),
                'message' => '招待メールを送信しました',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Failed to create user invitation: ' . $e->getMessage());
            
            return response()->json([
                'message' => '招待の作成に失敗しました',
            ], 500);
        }
    }

    /**
     * 招待を削除
     */
    public function destroy($id)
    {
        $invitation = UserInvitation::find($id);
        
        if (!$invitation) {
            return response()->json([
                'message' => '招待が見つかりません',
            ], 404);
        }

        // 既に受け入れられた招待は削除できない
        if ($invitation->accepted_at) {
            return response()->json([
                'message' => '既に受け入れられた招待は削除できません',
            ], 422);
        }

        $invitation->delete();

        return response()->json([
            'message' => '招待を削除しました',
        ]);
    }

    /**
     * 招待を再送信
     */
    public function resend($id)
    {
        $invitation = UserInvitation::find($id);
        
        if (!$invitation) {
            return response()->json([
                'message' => '招待が見つかりません',
            ], 404);
        }

        // 既に受け入れられた招待は再送信できない
        if ($invitation->accepted_at) {
            return response()->json([
                'message' => '既に受け入れられた招待は再送信できません',
            ], 422);
        }

        try {
            // 有効期限を延長
            $invitation->update([
                'expires_at' => UserInvitation::getExpirationDate(),
            ]);

            // 招待メールを再送信
            Mail::to($invitation->email)->send(new InviteUserMail($invitation));

            return response()->json([
                'message' => '招待メールを再送信しました',
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to resend invitation: ' . $e->getMessage());
            
            return response()->json([
                'message' => '招待の再送信に失敗しました',
            ], 500);
        }
    }
}