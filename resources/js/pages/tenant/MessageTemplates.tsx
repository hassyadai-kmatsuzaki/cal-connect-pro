import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TemplateEditor from '../../components/MessageTemplate/TemplateEditor';

interface MessageTemplate {
  id: number;
  templatable_type: string;
  templatable_id: number;
  message_type: string;
  name: string;
  description: string;
  is_active: boolean;
  items_count?: number;
  templatable?: {
    id: number;
    name: string;
  };
}

const MessageTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    templatable_type: '',
    message_type: '',
  });
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [filter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.templatable_type) params.append('templatable_type', filter.templatable_type);
      if (filter.message_type) params.append('message_type', filter.message_type);

      const response = await axios.get(`/api/tenant/message-templates?${params}`);
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このテンプレートを削除してもよろしいですか？')) return;

    try {
      await axios.delete(`/api/tenant/message-templates/${id}`);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('削除に失敗しました');
    }
  };

  const getMessageTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      reservation_created: '予約完了',
      reservation_confirmed: '予約確定',
      reservation_cancelled: '予約キャンセル',
      reminder: 'リマインド',
      welcome: 'ウェルカム',
      form_submitted: 'フォーム送信完了',
    };
    return labels[type] || type;
  };

  const getTemplatableTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'App\\Models\\Calendar': 'カレンダー',
      'App\\Models\\InflowSource': '流入経路',
      'App\\Models\\HearingForm': 'フォーム',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">メッセージテンプレート</h1>
          <p className="mt-2 text-sm text-gray-600">
            LINEメッセージのテンプレートを管理します
          </p>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                種類
              </label>
              <select
                value={filter.templatable_type}
                onChange={(e) => setFilter({ ...filter, templatable_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">すべて</option>
                <option value="App\Models\Calendar">カレンダー</option>
                <option value="App\Models\InflowSource">流入経路</option>
                <option value="App\Models\HearingForm">フォーム</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メッセージタイプ
              </label>
              <select
                value={filter.message_type}
                onChange={(e) => setFilter({ ...filter, message_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">すべて</option>
                <option value="reservation_created">予約完了</option>
                <option value="reservation_confirmed">予約確定</option>
                <option value="reservation_cancelled">予約キャンセル</option>
                <option value="reminder">リマインド</option>
                <option value="welcome">ウェルカム</option>
                <option value="form_submitted">フォーム送信完了</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setShowEditor(true);
                }}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                ＋ 新規作成
              </button>
            </div>
          </div>
        </div>

        {/* テンプレート一覧 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">テンプレートがありません</p>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowEditor(true);
              }}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              最初のテンプレートを作成
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        {template.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            有効
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            無効
                          </span>
                        )}
                      </div>

                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                          {getTemplatableTypeLabel(template.templatable_type)}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800">
                          {getMessageTypeLabel(template.message_type)}
                        </span>
                        {template.templatable && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                            {template.templatable.name}
                          </span>
                        )}
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800">
                          メッセージ {template.items_count || 0}件
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowEditor(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-800 px-3 py-1 rounded-md hover:bg-red-50"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* テンプレート編集モーダル */}
      {showEditor && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => setShowEditor(false)}
          onSave={() => fetchTemplates()}
        />
      )}
    </div>
  );
};

export default MessageTemplates;

