<?php

namespace App\Console\Commands;

use App\Models\HearingForm;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class GenerateFormKeysCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'forms:generate-keys';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '既存のヒアリングフォームにform_keyを生成する';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔑 フォームキーの生成を開始します...');

        try {
            // テナントごとに処理（マルチテナント対応）
            $tenants = Tenant::all();

            foreach ($tenants as $tenant) {
                $tenant->run(function () use ($tenant) {
                    $this->processFormsInTenant($tenant);
                });
            }

            $this->info('✅ フォームキーの生成が完了しました！');
            
        } catch (\Exception $e) {
            $this->error('❌ エラーが発生しました: ' . $e->getMessage());
            Log::error('GenerateFormKeysCommand failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }

        return 0;
    }

    /**
     * テナント内のフォームを処理
     */
    private function processFormsInTenant(Tenant $tenant)
    {
        $this->line("テナント: {$tenant->id}");

        // form_keyがnullのフォームを取得
        $forms = HearingForm::whereNull('form_key')->get();

        if ($forms->isEmpty()) {
            $this->line('  対象のフォームはありません');
            return;
        }

        $this->line("  {$forms->count()}件のフォームを処理します");

        foreach ($forms as $form) {
            try {
                $formKey = $form->generateFormKey();
                $form->update([
                    'form_key' => $formKey,
                ]);
                
                // LIFF URLも更新
                $form->updateLiffUrl();
                
                $this->line("  ✓ フォームID: {$form->id} - {$form->name}");
                
            } catch (\Exception $e) {
                $this->error("  ✗ フォームID: {$form->id} - エラー: {$e->getMessage()}");
                Log::error('Failed to generate form key', [
                    'form_id' => $form->id,
                    'tenant_id' => $tenant->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
}

