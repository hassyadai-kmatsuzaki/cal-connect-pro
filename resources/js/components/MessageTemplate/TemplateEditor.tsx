import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface MessageTemplateItem {
  order: number;
  type: 'text' | 'image';
  content?: string;
  image_url?: string;
  image_preview_url?: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
}

interface TemplateEditorProps {
  template?: any;
  onClose: () => void;
  onSave: () => void;
}

const PLACEHOLDERS = [
  { key: '{customer_name}', label: 'お客様名' },
  { key: '{customer_email}', label: 'メールアドレス' },
  { key: '{customer_phone}', label: '電話番号' },
  { key: '{reservation_date}', label: '予約日' },
  { key: '{reservation_time}', label: '予約時刻' },
  { key: '{reservation_datetime}', label: '予約日時' },
  { key: '{duration}', label: '所要時間' },
  { key: '{meet_url}', label: 'Meet URL' },
  { key: '{calendar_name}', label: 'カレンダー名' },
  { key: '{form_name}', label: 'フォーム名' },
  { key: '{company_name}', label: '会社名' },
  { key: '{today_date}', label: '今日の日付' },
];

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    templatable_type: template?.templatable_type || 'App\\Models\\Calendar',
    templatable_id: template?.templatable_id || '',
    message_type: template?.message_type || 'reservation_created',
    name: template?.name || '',
    description: template?.description || '',
    is_active: template?.is_active ?? true,
  });

  const [items, setItems] = useState<MessageTemplateItem[]>(
    template?.items || [{ order: 1, type: 'text', content: '' }]
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddItem = () => {
    if (items.length >= 5) {
      alert('メッセージは最大5件までです');
      return;
    }
    setItems([...items, { order: items.length + 1, type: 'text', content: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // orderを再設定
    newItems.forEach((item, i) => {
      item.order = i + 1;
    });
    setItems(newItems);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    // orderを再設定
    newItems.forEach((item, i) => {
      item.order = i + 1;
    });
    
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/tenant/message-templates/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { image_url, preview_url, original_filename, file_size, mime_type } = response.data.data;

      handleItemChange(index, 'image_url', image_url);
      handleItemChange(index, 'image_preview_url', preview_url);
      handleItemChange(index, 'original_filename', original_filename);
      handleItemChange(index, 'file_size', file_size);
      handleItemChange(index, 'mime_type', mime_type);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const insertPlaceholder = (index: number, placeholder: string) => {
    const item = items[index];
    const newContent = (item.content || '') + placeholder;
    handleItemChange(index, 'content', newContent);
  };

  const handleSubmit = async () => {
    // バリデーション
    if (!formData.name) {
      alert('テンプレート名を入力してください');
      return;
    }

    if (!formData.templatable_id) {
      alert('対象を選択してください');
      return;
    }

    if (items.length === 0) {
      alert('メッセージを1件以上追加してください');
      return;
    }

    // アイテムのバリデーション
    for (const item of items) {
      if (item.type === 'text' && !item.content) {
        alert('テキストメッセージの内容を入力してください');
        return;
      }
      if (item.type === 'image' && !item.image_url) {
        alert('画像をアップロードしてください');
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        items: items.map(item => ({
          order: item.order,
          type: item.type,
          content: item.content,
          image_url: item.image_url,
          image_preview_url: item.image_preview_url,
          original_filename: item.original_filename,
          file_size: item.file_size,
          mime_type: item.mime_type,
        })),
      };

      if (template) {
        await axios.put(`/api/tenant/message-templates/${template.id}`, payload);
      } else {
        await axios.post('/api/tenant/message-templates', payload);
      }

      alert('保存しました');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Failed to save template:', error);
      if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        alert('エラー:\n' + errors.join('\n'));
      } else {
        alert('保存に失敗しました');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-5xl w-full my-8">
        <div className="p-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {template ? 'テンプレート編集' : 'テンプレート作成'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 基本情報 */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  テンプレート名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例: 予約完了メッセージ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有効/無効
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">有効</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={2}
                placeholder="このテンプレートの説明"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  種類 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.templatable_type}
                  onChange={(e) => setFormData({ ...formData, templatable_type: e.target.value, templatable_id: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="App\Models\Calendar">カレンダー</option>
                  <option value="App\Models\InflowSource">流入経路</option>
                  <option value="App\Models\HearingForm">フォーム</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  対象ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.templatable_id}
                  onChange={(e) => setFormData({ ...formData, templatable_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メッセージタイプ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.message_type}
                  onChange={(e) => setFormData({ ...formData, message_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="reservation_created">予約完了</option>
                  <option value="reservation_confirmed">予約確定</option>
                  <option value="reservation_cancelled">予約キャンセル</option>
                  <option value="reminder">リマインド</option>
                  <option value="welcome">ウェルカム</option>
                  <option value="form_submitted">フォーム送信完了</option>
                </select>
              </div>
            </div>
          </div>

          {/* メッセージアイテム */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">メッセージ構成（最大5件）</h3>
              <button
                onClick={handleAddItem}
                disabled={items.length >= 5}
                className={`px-4 py-2 rounded-md ${
                  items.length >= 5
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                ＋ メッセージを追加
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{index + 1}.</span>
                      <select
                        value={item.type}
                        onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md"
                      >
                        <option value="text">テキスト</option>
                        <option value="image">画像</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMoveItem(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-600 hover:text-gray-800 disabled:text-gray-300"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveItem(index, 'down')}
                        disabled={index === items.length - 1}
                        className="text-gray-600 hover:text-gray-800 disabled:text-gray-300"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {item.type === 'text' ? (
                    <div>
                      <textarea
                        value={item.content || ''}
                        onChange={(e) => handleItemChange(index, 'content', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                        rows={4}
                        placeholder="メッセージを入力..."
                      />
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-600 mr-2">プレースホルダー:</span>
                        {PLACEHOLDERS.map((ph) => (
                          <button
                            key={ph.key}
                            onClick={() => insertPlaceholder(index, ph.key)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            {ph.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {item.image_url ? (
                        <div className="space-y-2">
                          <img
                            src={item.image_preview_url || item.image_url}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded border"
                          />
                          <p className="text-sm text-gray-600">
                            {item.original_filename} ({Math.round((item.file_size || 0) / 1024)}KB)
                          </p>
                          <button
                            onClick={() => {
                              handleItemChange(index, 'image_url', '');
                              handleItemChange(index, 'image_preview_url', '');
                            }}
                            className="text-red-600 text-sm hover:text-red-800"
                          >
                            画像を削除
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(index, file);
                            }}
                            className="hidden"
                            id={`image-upload-${index}`}
                          />
                          <label
                            htmlFor={`image-upload-${index}`}
                            className="cursor-pointer text-blue-600 hover:text-blue-800"
                          >
                            {uploading ? 'アップロード中...' : 'ファイルを選択 またはドラッグ＆ドロップ'}
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            推奨: 1024×1024px、最大10MB、JPEG/PNG
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* アクション */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;

