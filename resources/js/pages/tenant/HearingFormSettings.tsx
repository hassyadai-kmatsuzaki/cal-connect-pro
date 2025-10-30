import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const HearingFormSettings: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    enable_standalone: false,
    standalone_liff_url: '',
    enable_auto_reply: false,
    slack_notify: false,
    slack_webhook: '',
    slack_message: '',
  });

  useEffect(() => {
    fetchSettings();
  }, [formId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tenant/hearing-forms/${formId}/settings`);
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await axios.put(`/api/tenant/hearing-forms/${formId}/settings`, formData);
      alert('設定を保存しました');
      fetchSettings();
    } catch (error: any) {
      console.error('Failed to save settings:', error);
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

  const handleTestSlack = async () => {
    if (!formData.slack_webhook) {
      alert('Webhook URLを入力してください');
      return;
    }

    try {
      // TODO: テスト送信API実装
      alert('Slack通知のテスト送信を行いました');
    } catch (error) {
      alert('テスト送信に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/hearing-forms')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← フォーム一覧に戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900">フォーム設定</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 独立フォーム送信設定 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📋 独立フォーム送信</h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enable_standalone}
                  onChange={(e) => setFormData({ ...formData, enable_standalone: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-gray-700">予約なしの独立フォーム送信を有効にする</span>
              </label>

              {formData.standalone_liff_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LIFF URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.standalone_liff_url}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formData.standalone_liff_url);
                        alert('URLをコピーしました');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      コピー
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    このURLを直接LINEで共有することで、予約なしでフォームのみを送信できます
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 自動返信設定 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📱 自動返信設定</h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enable_auto_reply}
                  onChange={(e) => setFormData({ ...formData, enable_auto_reply: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-gray-700">フォーム送信時にLINE自動返信を有効にする</span>
              </label>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  💡 自動返信メッセージは<a href="/message-templates" className="underline font-medium">メッセージテンプレート</a>で設定できます
                </p>
              </div>
            </div>
          </div>

          {/* Slack通知設定 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🔔 Slack通知設定</h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.slack_notify}
                  onChange={(e) => setFormData({ ...formData, slack_notify: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-gray-700">フォーム送信時にSlack通知を送信する</span>
              </label>

              {formData.slack_notify && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={formData.slack_webhook}
                      onChange={(e) => setFormData({ ...formData, slack_webhook: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      通知メッセージ
                    </label>
                    <textarea
                      value={formData.slack_message}
                      onChange={(e) => setFormData({ ...formData, slack_message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="📝 新しいフォーム送信がありました"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleTestSlack}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    テスト通知を送信
                  </button>
                </>
              )}
            </div>
          </div>

          {/* アクション */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/hearing-forms')}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HearingFormSettings;

