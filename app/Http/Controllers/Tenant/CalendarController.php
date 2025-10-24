<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Calendar;
use App\Models\HearingForm;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CalendarController extends Controller
{
    /**
     * カレンダー一覧を取得
     */
    public function index(Request $request)
    {
        $query = Calendar::with(['users', 'hearingForm']);
        
        // 検索フィルター
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }
        
        // アクティブ状態フィルター
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }
        
        // タイプフィルター
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        $calendars = $query->orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'data' => $calendars,
        ]);
    }

    /**
     * カレンダー詳細を取得
     */
    public function show($id)
    {
        $calendar = Calendar::with(['users', 'hearingForm.items'])->find($id);
        
        if (!$calendar) {
            return response()->json([
                'message' => 'カレンダーが見つかりません',
            ], 404);
        }
        
        return response()->json([
            'data' => $calendar,
        ]);
    }

    /**
     * カレンダーを作成
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'type' => 'required|in:any,all',
            'accept_days' => 'required|array',
            'accept_days.*' => 'in:月,火,水,木,金,土,日,祝日',
            'start_time' => 'required|regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/',
            'end_time' => 'required|regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/',
            'display_interval' => 'required|integer|min:5|max:120',
            'event_duration' => 'required|integer|min:5|max:480',
            'days_in_advance' => 'required|integer|min:1|max:365',
            'min_hours_before_booking' => 'required|integer|min:0|max:72',
            'invite_calendars' => 'nullable|array',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
            'hearing_form_id' => 'nullable|exists:hearing_forms,id',
            
            // Slack通知
            'slack_notify' => 'boolean',
            'slack_webhook' => 'nullable|url',
            'slack_message' => 'nullable|string',
            
            // LINE自動返信
            'line_auto_reply' => 'boolean',
            'include_meet_url' => 'boolean',
            'line_reply_message' => 'nullable|string',
            
            // LINEリマインド
            'line_remind' => 'boolean',
            'remind_days_before' => 'nullable|integer|min:0|max:30',
            'remind_hours_before' => 'nullable|integer|min:0|max:72',
            'line_remind_message' => 'nullable|string',
        ], [
            'name.required' => 'カレンダー名は必須です',
            'type.required' => 'タイプは必須です',
            'accept_days.required' => '受付曜日は必須です',
            'start_time.required' => '開始時間は必須です',
            'start_time.regex' => '開始時間はHH:MM形式で入力してください（例：10:00）',
            'end_time.required' => '終了時間は必須です',
            'end_time.regex' => '終了時間はHH:MM形式で入力してください（例：19:00）',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 時間の論理的な検証
        if ($request->start_time && $request->end_time) {
            $startTime = \Carbon\Carbon::createFromFormat('H:i', $request->start_time);
            $endTime = \Carbon\Carbon::createFromFormat('H:i', $request->end_time);
            
            if ($endTime->lte($startTime)) {
                return response()->json([
                    'message' => 'バリデーションエラー',
                    'errors' => [
                        'end_time' => ['終了時間は開始時間より後である必要があります']
                    ],
                ], 422);
            }
        }

        $calendar = Calendar::create([
            'name' => $request->name,
            'type' => $request->type,
            'accept_days' => $request->accept_days,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'display_interval' => $request->display_interval,
            'event_duration' => $request->event_duration,
            'days_in_advance' => $request->days_in_advance,
            'min_hours_before_booking' => $request->min_hours_before_booking,
            'invite_calendars' => $request->invite_calendars ?? [],
            'hearing_form_id' => $request->hearing_form_id,
            
            // Slack通知
            'slack_notify' => $request->slack_notify ?? false,
            'slack_webhook' => $request->slack_webhook,
            'slack_message' => $request->slack_message,
            
            // LINE自動返信
            'line_auto_reply' => $request->line_auto_reply ?? false,
            'include_meet_url' => $request->include_meet_url ?? true,
            'line_reply_message' => $request->line_reply_message,
            
            // LINEリマインド
            'line_remind' => $request->line_remind ?? false,
            'remind_days_before' => $request->remind_days_before ?? 0,
            'remind_hours_before' => $request->remind_hours_before ?? 24,
            'line_remind_message' => $request->line_remind_message,
            
            'is_active' => true,
        ]);

        // ユーザーを紐付け
        if ($request->has('user_ids') && is_array($request->user_ids)) {
            $calendar->users()->sync($request->user_ids);
        }

        $calendar->load(['users', 'hearingForm']);

        return response()->json([
            'data' => $calendar,
            'message' => 'カレンダーを作成しました',
        ], 201);
    }

    /**
     * カレンダーを更新
     */
    public function update(Request $request, $id)
    {
        $calendar = Calendar::find($id);

        if (!$calendar) {
            return response()->json([
                'message' => 'カレンダーが見つかりません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'type' => 'required|in:any,all',
            'accept_days' => 'required|array',
            'accept_days.*' => 'in:月,火,水,木,金,土,日,祝日',
            'start_time' => 'required|regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/',
            'end_time' => 'required|regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/',
            'display_interval' => 'required|integer|min:5|max:120',
            'event_duration' => 'required|integer|min:5|max:480',
            'days_in_advance' => 'required|integer|min:1|max:365',
            'min_hours_before_booking' => 'required|integer|min:0|max:72',
            'invite_calendars' => 'nullable|array',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
            'hearing_form_id' => 'nullable|exists:hearing_forms,id',
            
            // Slack通知
            'slack_notify' => 'boolean',
            'slack_webhook' => 'nullable|url',
            'slack_message' => 'nullable|string',
            
            // LINE自動返信
            'line_auto_reply' => 'boolean',
            'include_meet_url' => 'boolean',
            'line_reply_message' => 'nullable|string',
            
            // LINEリマインド
            'line_remind' => 'boolean',
            'remind_days_before' => 'nullable|integer|min:0|max:30',
            'remind_hours_before' => 'nullable|integer|min:0|max:72',
            'line_remind_message' => 'nullable|string',
        ], [
            'name.required' => 'カレンダー名は必須です',
            'type.required' => 'タイプは必須です',
            'accept_days.required' => '受付曜日は必須です',
            'start_time.required' => '開始時間は必須です',
            'start_time.regex' => '開始時間はHH:MM形式で入力してください（例：10:00）',
            'end_time.required' => '終了時間は必須です',
            'end_time.regex' => '終了時間はHH:MM形式で入力してください（例：19:00）',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 時間の論理的な検証
        if ($request->start_time && $request->end_time) {
            $startTime = \Carbon\Carbon::createFromFormat('H:i', $request->start_time);
            $endTime = \Carbon\Carbon::createFromFormat('H:i', $request->end_time);
            
            if ($endTime->lte($startTime)) {
                return response()->json([
                    'message' => 'バリデーションエラー',
                    'errors' => [
                        'end_time' => ['終了時間は開始時間より後である必要があります']
                    ],
                ], 422);
            }
        }

        $calendar->update([
            'name' => $request->name,
            'type' => $request->type,
            'accept_days' => $request->accept_days,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'display_interval' => $request->display_interval,
            'event_duration' => $request->event_duration,
            'days_in_advance' => $request->days_in_advance,
            'min_hours_before_booking' => $request->min_hours_before_booking,
            'invite_calendars' => $request->invite_calendars ?? [],
            'hearing_form_id' => $request->hearing_form_id,
            
            // Slack通知
            'slack_notify' => $request->slack_notify ?? false,
            'slack_webhook' => $request->slack_webhook,
            'slack_message' => $request->slack_message,
            
            // LINE自動返信
            'line_auto_reply' => $request->line_auto_reply ?? false,
            'include_meet_url' => $request->include_meet_url ?? true,
            'line_reply_message' => $request->line_reply_message,
            
            // LINEリマインド
            'line_remind' => $request->line_remind ?? false,
            'remind_days_before' => $request->remind_days_before ?? 0,
            'remind_hours_before' => $request->remind_hours_before ?? 24,
            'line_remind_message' => $request->line_remind_message,
        ]);

        // ユーザーを紐付け
        if ($request->has('user_ids')) {
            $calendar->users()->sync($request->user_ids ?? []);
        }

        $calendar->load(['users', 'hearingForm']);

        return response()->json([
            'data' => $calendar,
            'message' => 'カレンダーを更新しました',
        ]);
    }

    /**
     * カレンダーを削除
     */
    public function destroy($id)
    {
        $calendar = Calendar::find($id);

        if (!$calendar) {
            return response()->json([
                'message' => 'カレンダーが見つかりません',
            ], 404);
        }

        $calendar->delete();

        return response()->json([
            'message' => 'カレンダーを削除しました',
        ]);
    }

    /**
     * カレンダーの有効/無効を切り替え
     */
    public function toggle($id)
    {
        $calendar = Calendar::find($id);

        if (!$calendar) {
            return response()->json([
                'message' => 'カレンダーが見つかりません',
            ], 404);
        }

        $calendar->update([
            'is_active' => !$calendar->is_active,
        ]);

        return response()->json([
            'data' => $calendar,
            'message' => $calendar->is_active ? 'カレンダーを有効にしました' : 'カレンダーを無効にしました',
        ]);
    }

    /**
     * ユーザー一覧を取得（カレンダー作成時の選択肢用）
     */
    public function getUsers()
    {
        $users = User::select('id', 'name', 'email', 'google_calendar_connected')
            ->get();

        return response()->json([
            'data' => $users,
        ]);
    }

    /**
     * ヒアリングフォーム一覧を取得（カレンダー作成時の選択肢用）
     */
    public function getHearingForms()
    {
        $forms = HearingForm::select('id', 'name', 'description')
            ->where('is_active', true)
            ->get();

        return response()->json([
            'data' => $forms,
        ]);
    }
}

