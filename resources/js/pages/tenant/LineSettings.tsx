import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Divider,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Link as LinkIcon,
  ContentCopy,
} from '@mui/icons-material';
import axios from 'axios';
import TenantLayout from '../../layouts/TenantLayout';

interface LineSettingData {
  id?: number;
  channel_id: string;
  channel_secret: string;
  channel_access_token: string;
  liff_id?: string;
  line_id?: string;
  webhook_url?: string;
  is_connected: boolean;
  connected_at?: string;
}

const LineSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState({
    channelId: '',
    channelSecret: '',
    accessToken: '',
    liffId: '',
    lineId: '',
  });
  const [connectedAt, setConnectedAt] = useState<string>('');
  const [botName, setBotName] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });

  // LINE設定を取得
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // まず現在のテナントIDを取得
      let currentTenantId = null;
      try {
        const meResponse = await axios.get('/api/me');
        currentTenantId = meResponse.data.tenant_id;
        setTenantId(currentTenantId);
      } catch (error) {
        console.warn('テナントIDの取得に失敗:', error);
        // フォールバック: ホスト名から推測
        const fallbackTenantId = window.location.hostname.split('.')[0];
        setTenantId(fallbackTenantId);
        currentTenantId = fallbackTenantId;
      }

      const response = await axios.get('/api/line-settings');
      const data = response.data.data as LineSettingData | null;
      
      if (data) {
        setSettings({
          channelId: data.channel_id || '',
          channelSecret: data.channel_secret || '',
          accessToken: data.channel_access_token || '',
          liffId: data.liff_id || '',
          lineId: data.line_id || '',
        });
        setIsConnected(data.is_connected || false);
        setConnectedAt(data.connected_at || '');
        setWebhookUrl(data.webhook_url || `https://anken.cloud/api/line/webhook/${currentTenantId}`);
      } else {
        setWebhookUrl(`https://anken.cloud/api/line/webhook/${currentTenantId}`);
      }
    } catch (error) {
      console.error('LINE設定の取得に失敗:', error);
      const fallbackTenantId = window.location.hostname.split('.')[0];
      setTenantId(fallbackTenantId);
      setWebhookUrl(`https://anken.cloud/api/line/webhook/${fallbackTenantId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!settings.accessToken) {
      setSnackbar({
        open: true,
        message: 'Channel Access Tokenを入力してください',
        severity: 'error',
      });
      return;
    }

    setTesting(true);
    try {
      const response = await axios.post('/api/line-settings/test', {
        channel_access_token: settings.accessToken,
      });

      if (response.data.success) {
        setBotName(response.data.data.bot_name);
        setSnackbar({
          open: true,
          message: `接続成功！Bot名: ${response.data.data.bot_name}`,
          severity: 'success',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || '接続テストに失敗しました';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // バリデーション
    if (!settings.channelId || !settings.channelSecret || !settings.accessToken) {
      setSnackbar({
        open: true,
        message: 'すべての必須項目を入力してください',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post('/api/line-settings', {
        channel_id: settings.channelId,
        channel_secret: settings.channelSecret,
        channel_access_token: settings.accessToken,
        liff_id: settings.liffId,
        line_id: settings.lineId,
      });

      setIsConnected(true);
      setConnectedAt(response.data.data.connected_at);
      setWebhookUrl(response.data.data.webhook_url);
      
      // テナントIDを更新（APIレスポンスから）
      const updatedTenantId = response.data.data.webhook_url?.split('/').pop();
      if (updatedTenantId) {
        setTenantId(updatedTenantId);
      }
      
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '設定の保存に失敗しました';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('LINE連携を解除してもよろしいですか？')) {
      return;
    }

    try {
      await axios.delete('/api/line-settings');
      
      setIsConnected(false);
      setSettings({
        channelId: '',
        channelSecret: '',
        accessToken: '',
        liffId: '',
        lineId: '',
      });
      setConnectedAt('');
      setBotName('');
      setWebhookUrl('');
      setTenantId(null);
      
      setSnackbar({
        open: true,
        message: 'LINE連携を解除しました',
        severity: 'info',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '連携解除に失敗しました';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: 'コピーしました',
      severity: 'success',
    });
  };

  if (loading) {
    return (
      <TenantLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
          LINE連携設定
        </Typography>

        <Grid container spacing={3}>
          {/* 連携状態カード */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinkIcon sx={{ mr: 1 }} />
                  連携状態
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {isConnected ? (
                  <Box>
                    <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                      LINEと正常に連携されています
                    </Alert>
                    <Grid container spacing={2}>
                      {connectedAt && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            連携日時
                          </Typography>
                          <Typography variant="body1">
                            {new Date(connectedAt).toLocaleString('ja-JP')}
                          </Typography>
                        </Grid>
                      )}
                      {botName && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            LINE Bot名
                          </Typography>
                          <Typography variant="body1">
                            {botName}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                    <Button
                      variant="outlined"
                      color="error"
                      sx={{ mt: 2 }}
                      onClick={handleDisconnect}
                    >
                      連携を解除
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Alert severity="warning" icon={<ErrorIcon />} sx={{ mb: 2 }}>
                      LINEと連携されていません
                    </Alert>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      LINE Messaging APIの認証情報を入力して連携してください。
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* API設定カード */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  LINE Messaging API設定
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Channel ID"
                      fullWidth
                      required
                      value={settings.channelId}
                      onChange={(e) => setSettings({ ...settings, channelId: e.target.value })}
                      placeholder="1234567890"
                      helperText="LINE Developers コンソールから取得したChannel IDを入力してください"
                      disabled={isConnected}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Channel Secret"
                      fullWidth
                      required
                      type="password"
                      value={settings.channelSecret}
                      onChange={(e) => setSettings({ ...settings, channelSecret: e.target.value })}
                      placeholder="abcdefghijklmnopqrstuvwxyz123456"
                      helperText="Channel Secretを入力してください"
                      disabled={isConnected}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Channel Access Token (Long-lived)"
                      fullWidth
                      required
                      type="password"
                      value={settings.accessToken}
                      onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      helperText="長期Channel Access Tokenを入力してください"
                      disabled={isConnected}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="LIFF ID（オプション）"
                      fullWidth
                      value={settings.liffId}
                      onChange={(e) => setSettings({ ...settings, liffId: e.target.value })}
                      placeholder="1234567890-abcdefgh"
                      helperText="LIFF アプリを作成済みの場合は入力してください"
                      disabled={isConnected}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="LINE ID（オプション）"
                      fullWidth
                      value={settings.lineId}
                      onChange={(e) => setSettings({ ...settings, lineId: e.target.value })}
                      placeholder="@your_line_id"
                      helperText="LINE公式アカウントのID（@で始まる）を入力してください"
                      disabled={isConnected}
                    />
                  </Grid>
                  
                  {!isConnected && (
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        onClick={handleTest}
                        disabled={testing || !settings.accessToken}
                        startIcon={testing && <CircularProgress size={20} />}
                      >
                        {testing ? '接続テスト中...' : '接続テスト'}
                      </Button>
                    </Grid>
                  )}
                </Grid>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    LINE Messaging APIの設定方法は
                    <a 
                      href="https://developers.line.biz/ja/docs/messaging-api/getting-started/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ marginLeft: 4 }}
                    >
                      こちらのドキュメント
                    </a>
                    をご覧ください
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Webhook URL情報カード */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Webhook URL設定
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  以下のWebhook URLをLINE DevelopersコンソールのMessaging API設定で登録してください
                </Alert>
                
                <TextField
                  label="Webhook URL"
                  fullWidth
                  value={webhookUrl}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Tooltip title="コピー">
                        <IconButton onClick={() => copyToClipboard(webhookUrl)} size="small">
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                    ),
                  }}
                  helperText="このURLをLINE Developersコンソールにコピーしてください"
                />
                
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>注意:</strong> LINEからの通知設定（自動返信、リマインド等）は、各カレンダーの設定で個別に行います。
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* 保存ボタン */}
          {!isConnected && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving && <CircularProgress size={20} />}
                >
                  {saving ? '保存中...' : '設定を保存'}
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </TenantLayout>
  );
};

export default LineSettings;
