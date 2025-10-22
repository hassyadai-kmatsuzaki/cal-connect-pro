<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    /**
     * テナント一覧を取得
     */
    public function index(Request $request)
    {
        $tenants = $request->user()->tenants()->with('domains')->get();

        return response()->json([
            'tenants' => $tenants,
        ]);
    }

    /**
     * テナントを作成
     */
    public function store(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string|max:255',
            'subdomain' => 'required|string|max:255|alpha_dash|unique:domains,domain',
            'plan' => 'nullable|string|in:free,basic,premium',
        ]);

        $tenant = Tenant::create([
            'owner_id' => $request->user()->id,
            'company_name' => $request->company_name,
            'plan' => $request->plan ?? 'free',
        ]);

        // サブドメインを作成
        $domain = $request->subdomain . '.localhost';
        $tenant->domains()->create([
            'domain' => $domain,
        ]);

        return response()->json([
            'tenant' => $tenant->load('domains'),
            'message' => 'テナントを作成しました',
        ], 201);
    }

    /**
     * テナント詳細を取得
     */
    public function show(Request $request, $id)
    {
        $tenant = $request->user()->tenants()->with('domains')->findOrFail($id);

        return response()->json([
            'tenant' => $tenant,
        ]);
    }

    /**
     * テナントを更新
     */
    public function update(Request $request, $id)
    {
        $tenant = $request->user()->tenants()->findOrFail($id);

        $request->validate([
            'company_name' => 'sometimes|required|string|max:255',
            'plan' => 'sometimes|required|string|in:free,basic,premium',
        ]);

        $tenant->update($request->only(['company_name', 'plan']));

        return response()->json([
            'tenant' => $tenant->load('domains'),
            'message' => 'テナントを更新しました',
        ]);
    }

    /**
     * テナントを削除
     */
    public function destroy(Request $request, $id)
    {
        $tenant = $request->user()->tenants()->findOrFail($id);
        $tenant->delete();

        return response()->json([
            'message' => 'テナントを削除しました',
        ]);
    }
}

