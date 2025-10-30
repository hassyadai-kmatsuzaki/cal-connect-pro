<?php

namespace App\Services;

use App\Models\MessageTemplate;
use App\Models\MessageTemplateItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Intervention\Image\Facades\Image;

class MessageTemplateService
{
    /**
     * テンプレートを作成
     */
    public function createTemplate(array $data): MessageTemplate
    {
        return DB::transaction(function () use ($data) {
            $template = MessageTemplate::create([
                'templatable_type' => $data['templatable_type'],
                'templatable_id' => $data['templatable_id'],
                'message_type' => $data['message_type'],
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    $this->createTemplateItem($template, $item);
                }
            }

            return $template->load('items');
        });
    }

    /**
     * テンプレートを更新
     */
    public function updateTemplate(MessageTemplate $template, array $data): MessageTemplate
    {
        return DB::transaction(function () use ($template, $data) {
            $template->update([
                'templatable_type' => $data['templatable_type'] ?? $template->templatable_type,
                'templatable_id' => $data['templatable_id'] ?? $template->templatable_id,
                'message_type' => $data['message_type'] ?? $template->message_type,
                'name' => $data['name'] ?? $template->name,
                'description' => $data['description'] ?? $template->description,
                'is_active' => $data['is_active'] ?? $template->is_active,
            ]);

            if (isset($data['items']) && is_array($data['items'])) {
                // 既存のアイテムを削除して再作成
                $template->items()->delete();
                
                foreach ($data['items'] as $item) {
                    $this->createTemplateItem($template, $item);
                }
            }

            return $template->load('items');
        });
    }

    /**
     * テンプレートアイテムを作成
     */
    private function createTemplateItem(MessageTemplate $template, array $data): MessageTemplateItem
    {
        return $template->items()->create([
            'order' => $data['order'],
            'type' => $data['type'],
            'content' => $data['content'] ?? null,
            'image_url' => $data['image_url'] ?? null,
            'image_preview_url' => $data['image_preview_url'] ?? null,
            'original_filename' => $data['original_filename'] ?? null,
            'file_size' => $data['file_size'] ?? null,
            'mime_type' => $data['mime_type'] ?? null,
        ]);
    }

    /**
     * 画像をアップロード
     */
    public function uploadImage(UploadedFile $file): array
    {
        $tenantId = tenant('id');
        $timestamp = time();
        $random = substr(md5(uniqid()), 0, 8);
        $extension = $file->getClientOriginalExtension();
        $filename = "{$timestamp}_{$random}.{$extension}";
        
        // 使用するディスク（環境変数で設定: public or s3）
        $disk = config('filesystems.line_images_disk', config('filesystems.default'));
        
        // ディレクトリパス
        $directory = "line_images/{$tenantId}";
        $originalsDir = "{$directory}/originals";
        $previewsDir = "{$directory}/previews";
        
        // オリジナル画像を保存（最大1024pxにリサイズ）
        $originalImage = Image::make($file)->resize(1024, 1024, function ($constraint) {
            $constraint->aspectRatio();
            $constraint->upsize();
        });
        
        // S3の場合はpublicで保存
        $visibility = $disk === 's3' ? 'public' : null;
        
        Storage::disk($disk)->put(
            "{$originalsDir}/{$filename}",
            (string) $originalImage->encode($extension),
            $visibility
        );
        
        // プレビュー画像を生成（240x240px）
        $previewImage = Image::make($file)->fit(240, 240);
        $previewFilename = "{$timestamp}_{$random}_preview.{$extension}";
        
        Storage::disk($disk)->put(
            "{$previewsDir}/{$previewFilename}",
            (string) $previewImage->encode($extension),
            $visibility
        );
        
        return [
            'image_url' => Storage::disk($disk)->url("{$originalsDir}/{$filename}"),
            'preview_url' => Storage::disk($disk)->url("{$previewsDir}/{$previewFilename}"),
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'dimensions' => [
                'width' => $originalImage->width(),
                'height' => $originalImage->height(),
            ],
        ];
    }

    /**
     * テンプレートを検証
     */
    public function validateTemplate(array $data): array
    {
        $errors = [];

        // アイテム数のチェック
        if (!isset($data['items']) || count($data['items']) < 1) {
            $errors['items'] = ['メッセージは1件以上必要です'];
        } elseif (count($data['items']) > 5) {
            $errors['items'] = ['メッセージは最大5件までです'];
        }

        // 各アイテムの検証
        if (isset($data['items'])) {
            foreach ($data['items'] as $index => $item) {
                if ($item['type'] === 'text' && empty($item['content'])) {
                    $errors["items.{$index}.content"] = ['テキストメッセージの内容は必須です'];
                }
                
                if ($item['type'] === 'image' && (empty($item['image_url']) || empty($item['image_preview_url']))) {
                    $errors["items.{$index}.image_url"] = ['画像URLは必須です'];
                }
                
                if (!isset($item['order']) || $item['order'] < 1 || $item['order'] > 5) {
                    $errors["items.{$index}.order"] = ['順序は1〜5の範囲で指定してください'];
                }
            }
        }

        return $errors;
    }
}

