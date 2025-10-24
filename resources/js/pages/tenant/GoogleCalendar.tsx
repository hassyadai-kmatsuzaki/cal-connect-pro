import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  Grid,
  Avatar,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  CalendarMonth,
  Sync as SyncIcon,
  Link as LinkIcon,
  Google,
} from '@mui/icons-material';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

interface ConnectedCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

const GoogleCalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [calendarId, setCalendarId] = useState<string>('');
  const [calendars, setCalendars] = useState<ConnectedCalendar[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // 初回読み込み時とURLパラメータ変更時に状態を取得
  useEffect(() => {
    fetchStatus();

    // URL パラメータからエラーや成功メッセージを取得
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      setSnackbar({
        open: true,
        message: 'Google Calendarとの連携に成功しました',
        severity: 'success',
      });
      // URLパラメータをクリア
      setSearchParams({});
      fetchStatus(); // 再取得
    } else if (error) {
      setSnackbar({
        open: true,
        message: `連携エラー: ${error}`,
        severity: 'error',
      });
      setSearchParams({});
    }
  }, [searchParams]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/google-calendar/status');
      setIsConnected(response.data.connected);
      
      if (response.data.connected) {
        setCalendarId(response.data.calendar_id);
        setCalendars(response.data.calendars || []);
      }

      if (response.data.error) {
        setSnackbar({
          open: true,
          message: response.data.error,
          severity: 'error',
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch Google Calendar status:', error);
      setSnackbar({
        open: true,
        message: 'ステータスの取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await axios.get('/api/google-calendar/auth-url', {
        params: {
          return_url: '/google-calendar'
        }
      });
      
      // Google OAuth認証ページにリダイレクト
      window.location.href = response.data.auth_url;
    } catch (error: any) {
      console.error('Failed to get auth URL:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '認証URLの取得に失敗しました',
        severity: 'error',
      });
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Googleカレンダーとの連携を解除してもよろしいですか？')) {
      return;
    }

    try {
      setDisconnecting(true);
      await axios.post('/api/google-calendar/disconnect');
      
      setIsConnected(false);
      setCalendars([]);
      setCalendarId('');
      
      setSnackbar({
        open: true,
        message: 'Google Calendarとの連携を解除しました',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to disconnect:', error);
      setSnackbar({
        open: true,
        message: '連携解除に失敗しました',
        severity: 'error',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await axios.post('/api/google-calendar/sync');
      
      setCalendars(response.data.calendars || []);
      
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to sync:', error);
      setSnackbar({
        open: true,
        message: 'カレンダーの同期に失敗しました',
        severity: 'error',
      });
    } finally {
      setSyncing(false);
    }
  };

  const getPrimaryCalendar = () => {
    return calendars.find((cal) => cal.primary);
  };

  const primaryCalendar = getPrimaryCalendar();

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
          Googleカレンダー連携
        </Typography>

        <Grid container spacing={3}>
          {/* 連携状態カード */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Google sx={{ mr: 1 }} />
                  連携状態
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {isConnected ? (
                  <Box>
                    <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                      Googleカレンダーと正常に連携されています
                    </Alert>
                    {primaryCalendar && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          連携カレンダー
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                            {primaryCalendar.summary?.[0]?.toUpperCase() || 'G'}
                          </Avatar>
                          <Typography variant="body1">
                            {primaryCalendar.summary || calendarId}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        カレンダーID
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {calendarId}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
                        onClick={handleSync}
                        disabled={syncing || disconnecting}
                        fullWidth
                      >
                        {syncing ? '同期中...' : '同期'}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleDisconnect}
                        disabled={syncing || disconnecting}
                        fullWidth
                      >
                        {disconnecting ? '解除中...' : '解除'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Alert severity="warning" icon={<ErrorIcon />} sx={{ mb: 2 }}>
                      Googleカレンダーと連携されていません
                    </Alert>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Googleアカウントでログインして、カレンダーを連携してください。
                      連携することで、予約可能な時間帯を自動で管理できます。
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Google />}
                      fullWidth
                      onClick={handleConnect}
                      size="large"
                      sx={{
                        bgcolor: '#4285f4',
                        '&:hover': {
                          bgcolor: '#357ae8',
                        },
                      }}
                    >
                      Googleアカウントで連携
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 連携カレンダー一覧 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarMonth sx={{ mr: 1 }} />
                  連携中のカレンダー
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {isConnected && calendars.length > 0 ? (
                  <List>
                    {calendars
                      .filter((calendar) => calendar.primary)
                      .map((calendar) => (
                        <ListItem key={calendar.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CalendarMonth 
                              sx={{ color: calendar.backgroundColor || 'primary.main' }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {calendar.summary}
                                <Chip label="メイン" size="small" color="primary" />
                              </Box>
                            }
                            secondary={calendar.id}
                          />
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    {isConnected ? 'カレンダーを同期してください' : '連携後にカレンダーが表示されます'}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 連携について */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Googleカレンダー連携について
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        📅 自動スケジュール管理
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Googleカレンダーの予定と連携して、空き時間を自動で判定します。
                        予約が入った時間帯は、自動的にブロックされます。
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        🔄 リアルタイム同期
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Googleカレンダーに追加された予定は、Cal Connectに反映されます。
                        予約可能な時間帯が常に最新の状態に保たれます。
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        🔒 安全な連携
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Google OAuth 2.0を使用した安全な認証方式を採用。
                        カレンダーの読み取りと書き込みのみの最小限の権限で動作します。
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    連携には、Googleアカウントへのアクセス許可が必要です。
                    Cal Connectはカレンダーの情報のみにアクセスし、他の個人情報には一切アクセスしません。
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Snackbar通知 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </TenantLayout>
  );
};

export default GoogleCalendarPage;
