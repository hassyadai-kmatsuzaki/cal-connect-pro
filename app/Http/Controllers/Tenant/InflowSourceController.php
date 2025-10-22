<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\InflowSource;
use App\Models\Calendar;
use App\Models\InflowTracking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class InflowSourceController extends Controller
{
    /**
     * 流入経路一覧を取得
     */
    public function index(Request $request)
    {
        $query = InflowSource::with('calendar:id,name');
        
        // カレンダーIDでフィルター
        if ($request->has('calendar_id')) {
            $query->where('calendar_id', $request->calendar_id);
        }
        
        // アクティブ状態でフィルター
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }
        
        // 検索
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('source_key', 'like', "%{$search}%");
            });
        }
        
        $sources = $query->orderBy('created_at', 'desc')->get();
        
        // conversion_rateを明示的に追加
        $sources->each(function($source) {
            $source->conversion_rate = $source->conversion_rate;
        });
        
        return response()->json([
            'data' => $sources,
        ]);
    }

    /**
     * 流入経路詳細を取得
     */
    public function show($id)
    {
        $source = InflowSource::with('calendar')->find($id);
        
        if (!$source) {
            return response()->json([
                'message' => '流入経路が見つかりません',
            ], 404);
        }
        
        return response()->json([
            'data' => $source,
        ]);
    }

    /**
     * 流入経路を作成
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'calendar_id' => 'required|exists:calendars,id',
            'source_key' => 'nullable|string|max:255|unique:inflow_sources,source_key',
        ], [
            'name.required' => '流入経路名は必須です',
            'calendar_id.required' => 'カレンダーを選択してください',
            'calendar_id.exists' => '指定されたカレンダーが存在しません',
            'source_key.unique' => 'この識別キーは既に使用されています',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // source_keyが指定されていない場合は自動生成
            $sourceKey = $request->source_key ?? Str::random(8);
            
            // LIFF URLを生成
            $calendar = Calendar::find($request->calendar_id);
            $tenantDomain = tenant('id'); // テナントIDを取得
            
            // 環境に応じてベースURLを決定
            $baseUrl = app()->environment('production') 
                ? 'https://anken.cloud' 
                : 'https://localhost:8230';
            
            $liffUrl = "{$baseUrl}/liff/{$tenantDomain}?route=booking&slug={$sourceKey}";
            
            $source = InflowSource::create([
                'name' => $request->name,
                'source_key' => $sourceKey,
                'calendar_id' => $request->calendar_id,
                'liff_url' => $liffUrl,
                'is_active' => true,
            ]);

            $source->load('calendar');
            
            // conversion_rateを明示的に追加
            $source->conversion_rate = $source->conversion_rate;

            return response()->json([
                'data' => $source,
                'message' => '流入経路を作成しました',
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Failed to create inflow source: ' . $e->getMessage());
            
            return response()->json([
                'message' => '流入経路の作成に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 流入経路を更新
     */
    public function update(Request $request, $id)
    {
        $source = InflowSource::find($id);

        if (!$source) {
            return response()->json([
                'message' => '流入経路が見つかりません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'calendar_id' => 'required|exists:calendars,id',
        ], [
            'name.required' => '流入経路名は必須です',
            'calendar_id.required' => 'カレンダーを選択してください',
            'calendar_id.exists' => '指定されたカレンダーが存在しません',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // カレンダーが変更された場合、LIFF URLを再生成
            if ($source->calendar_id != $request->calendar_id) {
                $calendar = Calendar::find($request->calendar_id);
                $tenantDomain = tenant('id');
                
                // 環境に応じてベースURLを決定
                $baseUrl = app()->environment('production') 
                    ? 'https://anken.cloud' 
                    : 'https://localhost:8230';
                
                $liffUrl = "{$baseUrl}/liff/{$tenantDomain}?route=booking&slug={$source->source_key}";
                $source->liff_url = $liffUrl;
            }
            
            $source->update([
                'name' => $request->name,
                'calendar_id' => $request->calendar_id,
            ]);

            $source->load('calendar');
            
            // conversion_rateを明示的に追加
            $source->conversion_rate = $source->conversion_rate;

            return response()->json([
                'data' => $source,
                'message' => '流入経路を更新しました',
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to update inflow source: ' . $e->getMessage());
            
            return response()->json([
                'message' => '流入経路の更新に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 流入経路を削除
     */
    public function destroy($id)
    {
        $source = InflowSource::find($id);

        if (!$source) {
            return response()->json([
                'message' => '流入経路が見つかりません',
            ], 404);
        }

        try {
            $source->delete();

            return response()->json([
                'message' => '流入経路を削除しました',
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to delete inflow source: ' . $e->getMessage());
            
            return response()->json([
                'message' => '流入経路の削除に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 流入経路の有効/無効を切り替え
     */
    public function toggle($id)
    {
        $source = InflowSource::find($id);

        if (!$source) {
            return response()->json([
                'message' => '流入経路が見つかりません',
            ], 404);
        }

        $source->update([
            'is_active' => !$source->is_active,
        ]);

        return response()->json([
            'data' => $source,
            'message' => $source->is_active ? '流入経路を有効にしました' : '流入経路を無効にしました',
        ]);
    }

    /**
     * 統計情報を取得
     */
    public function stats(Request $request)
    {
        $query = InflowSource::query();
        
        // カレンダーIDでフィルター
        if ($request->has('calendar_id')) {
            $query->where('calendar_id', $request->calendar_id);
        }
        
        // 期間でフィルター
        if ($request->has('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->where('created_at', '<=', $request->end_date);
        }
        
        $sources = $query->get();
        
        // 統計情報を計算
        $totalViews = $sources->sum('views');
        $totalConversions = $sources->sum('conversions');
        $conversionRate = $totalViews > 0 ? round(($totalConversions / $totalViews) * 100, 2) : 0;
        
        // ソース別の統計
        $sourceStats = $sources->map(function($source) {
            return [
                'id' => $source->id,
                'name' => $source->name,
                'source_key' => $source->source_key,
                'calendar_name' => $source->calendar->name,
                'views' => $source->views,
                'conversions' => $source->conversions,
                'conversion_rate' => $source->conversion_rate,
                'is_active' => $source->is_active,
            ];
        });
        
        return response()->json([
            'summary' => [
                'total_views' => $totalViews,
                'total_conversions' => $totalConversions,
                'conversion_rate' => $conversionRate,
                'total_sources' => $sources->count(),
                'active_sources' => $sources->where('is_active', true)->count(),
            ],
            'sources' => $sourceStats,
        ]);
    }

    /**
     * ビュー数を増加
     */
    public function incrementView($sourceKey)
    {
        $source = InflowSource::where('source_key', $sourceKey)->first();
        
        if (!$source) {
            return response()->json([
                'message' => '流入経路が見つかりません',
            ], 404);
        }
        
        $source->increment('views');
        
        return response()->json([
            'message' => 'ビュー数を記録しました',
        ]);
    }

    /**
     * コンバージョン数を増加
     */
    public function incrementConversion($sourceKey)
    {
        $source = InflowSource::where('source_key', $sourceKey)->first();
        
        if (!$source) {
            return response()->json([
                'message' => '流入経路が見つかりません',
            ], 404);
        }
        
        $source->increment('conversions');
        
        return response()->json([
            'message' => 'コンバージョンを記録しました',
        ]);
    }

    /**
     * 流入経路のアクセスを追跡（LIFF用）
     */
    public function track(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'slug' => 'required|string',
            'tenant_id' => 'required|string',
            'utm_source' => 'nullable|string',
            'utm_medium' => 'nullable|string',
            'utm_campaign' => 'nullable|string',
            'utm_term' => 'nullable|string',
            'utm_content' => 'nullable|string',
            'user_agent' => 'nullable|string',
            'referrer' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // slugから流入経路を特定（仮実装）
            // 実際にはslugとtenant_idからInflowSourceを特定する必要がある
            $inflowSource = InflowSource::where('source_key', $request->slug)
                ->where('is_active', true)
                ->first();

            if (!$inflowSource) {
                // 流入経路が見つからない場合は新規作成
                $inflowSource = InflowSource::create([
                    'name' => '自動生成: ' . $request->slug,
                    'source_key' => $request->slug,
                    'calendar_id' => 1, // 仮のカレンダーID
                    'liff_url' => '',
                    'is_active' => true,
                    'utm_source' => $request->utm_source,
                    'utm_medium' => $request->utm_medium,
                    'utm_campaign' => $request->utm_campaign,
                    'utm_term' => $request->utm_term,
                    'utm_content' => $request->utm_content,
                ]);
            }

            // ビュー数を増加
            $inflowSource->increment('views');

            // 追跡レコードを作成
            InflowTracking::create([
                'inflow_source_id' => $inflowSource->id,
                'line_user_id' => null, // LIFF初期化時はまだLINEユーザーIDが不明
                'utm_source' => $request->utm_source,
                'utm_medium' => $request->utm_medium,
                'utm_campaign' => $request->utm_campaign,
                'utm_term' => $request->utm_term,
                'utm_content' => $request->utm_content,
                'user_agent' => $request->user_agent,
                'referrer' => $request->referrer,
                'ip_address' => $request->ip(),
                'tracked_at' => now(),
            ]);

            \Log::info('Inflow source tracked', [
                'inflow_source_id' => $inflowSource->id,
                'slug' => $request->slug,
                'tenant_id' => $request->tenant_id,
                'views' => $inflowSource->fresh()->views,
            ]);

            return response()->json([
                'message' => '流入経路を追跡しました',
                'inflow_source' => $inflowSource,
                'views' => $inflowSource->fresh()->views,
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to track inflow source: ' . $e->getMessage());
            
            return response()->json([
                'message' => '流入経路の追跡に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 流入経路のアクセスを追跡（従来の方法）
     */
    public function trackLegacy(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'inflow_source_id' => 'required|exists:inflow_sources,id',
            'line_user_id' => 'nullable|string',
            'user_agent' => 'nullable|string',
            'referrer' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // 流入経路のクリック数を増加
            $inflowSource = InflowSource::find($request->inflow_source_id);
            $inflowSource->increment('views');

            // 追跡レコードを作成
            InflowTracking::create([
                'inflow_source_id' => $request->inflow_source_id,
                'line_user_id' => $request->line_user_id,
                'user_agent' => $request->user_agent,
                'referrer' => $request->referrer,
                'ip_address' => $request->ip(),
                'tracked_at' => now(),
            ]);

            \Log::info('Inflow source tracked (legacy)', [
                'inflow_source_id' => $request->inflow_source_id,
                'line_user_id' => $request->line_user_id,
                'views' => $inflowSource->fresh()->views,
            ]);

            return response()->json([
                'message' => '流入経路を追跡しました',
                'views' => $inflowSource->fresh()->views,
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to track inflow source: ' . $e->getMessage());
            
            return response()->json([
                'message' => '流入経路の追跡に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

