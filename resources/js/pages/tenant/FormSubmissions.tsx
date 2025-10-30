import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface FormSubmission {
  id: number;
  hearing_form_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  submitted_at: string;
  slack_notified_at: string | null;
  line_user?: {
    id: number;
    display_name: string;
    picture_url: string;
  };
  inflow_source?: {
    id: number;
    name: string;
  };
  answers: Array<{
    item_id: number;
    item_label: string;
    answer_text: string;
  }>;
}

interface Statistics {
  total: number;
  this_month: number;
  this_week: number;
  today: number;
}

const FormSubmissions: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    this_month: 0,
    this_week: 0,
    today: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    date_from: '',
    date_to: '',
    inflow_source_id: '',
  });

  useEffect(() => {
    fetchSubmissions();
  }, [formId, filters]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.inflow_source_id) params.append('inflow_source_id', filters.inflow_source_id);

      const response = await axios.get(
        `/api/tenant/hearing-forms/${formId}/submissions?${params}`
      );
      setSubmissions(response.data.data);
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (submissionId: number) => {
    try {
      const response = await axios.get(`/api/tenant/form-submissions/${submissionId}`);
      setSelectedSubmission(response.data);
    } catch (error) {
      console.error('Failed to fetch submission detail:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">フォーム送信履歴</h1>
          <p className="mt-2 text-sm text-gray-600">
            フォームの送信履歴を確認できます
          </p>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">総送信数</div>
            <div className="text-3xl font-bold text-gray-900">{statistics.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">今月</div>
            <div className="text-3xl font-bold text-blue-600">{statistics.this_month}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">今週</div>
            <div className="text-3xl font-bold text-green-600">{statistics.this_week}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">今日</div>
            <div className="text-3xl font-bold text-purple-600">{statistics.today}</div>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="名前・メールで検索"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ search: '', date_from: '', date_to: '', inflow_source_id: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                クリア
              </button>
            </div>
          </div>
        </div>

        {/* テーブル */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">送信履歴がありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    送信日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    送信者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    流入経路
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slack
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(submission.submitted_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">{submission.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.inflow_source?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.slack_notified_at ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          ✗
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetail(submission.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 詳細モーダル */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">フォーム送信詳細</h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* 送信者情報 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">📱 送信者情報</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">お名前:</span>
                      <span className="font-medium">{selectedSubmission.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">メール:</span>
                      <span className="font-medium">{selectedSubmission.customer_email}</span>
                    </div>
                    {selectedSubmission.customer_phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">電話:</span>
                        <span className="font-medium">{selectedSubmission.customer_phone}</span>
                      </div>
                    )}
                    {selectedSubmission.line_user && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">LINEユーザー:</span>
                        <span className="font-medium">{selectedSubmission.line_user.display_name}</span>
                      </div>
                    )}
                    {selectedSubmission.inflow_source && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">流入経路:</span>
                        <span className="font-medium">{selectedSubmission.inflow_source.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 回答内容 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">📝 回答内容</h3>
                  <div className="space-y-3">
                    {selectedSubmission.answers.map((answer, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">{answer.item_label}</div>
                        <div className="text-gray-900 whitespace-pre-wrap">{answer.answer_text}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 通知状況 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">🔔 通知状況</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Slack通知:</span>
                      <span className={selectedSubmission.slack_notified_at ? 'text-green-600' : 'text-gray-500'}>
                        {selectedSubmission.slack_notified_at
                          ? `✓ 送信済み (${formatDate(selectedSubmission.slack_notified_at)})`
                          : '✗ 未送信'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormSubmissions;

