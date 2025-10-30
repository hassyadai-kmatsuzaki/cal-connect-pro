import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Stack,
  CircularProgress,
  Snackbar,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle,
  Error as ErrorIcon,
  Link as LinkIcon,
  Assessment as AssessmentIcon,
  Notifications,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface HearingForm {
  id: number;
  name: string;
  description: string;
  form_key: string;
  liff_url: string;
  is_active: boolean;
  total_responses: number;
  items: any[];
  calendars: any[];
  settings: any;
  slack_notify: boolean;
  slack_webhook: string;
  created_at: string;
  updated_at: string;
}

interface Statistics {
  total_responses: number;
  this_month: number;
  this_week: number;
  today: number;
  response_rate_by_day: any[];
  response_by_type: any;
}

const HearingFormDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [form, setForm] = useState<HearingForm | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchForm();
    fetchStatistics();
  }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/hearing-forms/${id}`);
      setForm(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch form:', error);
      setSnackbar({
        open: true,
        message: 'フォームの取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`/api/hearing-forms/${id}/statistics`);
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleToggleActive = async () => {
    if (!form) return;
    
    try {
      setToggling(true);
      const response = await axios.post(`/api/hearing-forms/${id}/toggle`);
      setForm(response.data.data);
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to toggle form:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'ステータスの更新に失敗しました',
        severity: 'error',
      });
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('このフォームを削除してもよろしいですか？\n関連する回答データも削除される可能性があります。')) {
      return;
    }

    try {
      setDeleting(true);
      await axios.delete(`/api/hearing-forms/${id}`);
      setSnackbar({
        open: true,
        message: 'フォームを削除しました',
        severity: 'success',
      });
      setTimeout(() => {
        navigate('/hearing-forms');
      }, 1000);
    } catch (error: any) {
      console.error('Failed to delete form:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'フォームの削除に失敗しました',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const copyLiffUrl = () => {
    if (form?.liff_url) {
      navigator.clipboard.writeText(form.liff_url);
      setSnackbar({
        open: true,
        message: 'LIFF URLをコピーしました',
        severity: 'success',
      });
    }
  };

  const handleRegenerateKey = async () => {
    try {
      const response = await axios.post(`/api/hearing-forms/${id}/regenerate-key`);
      setForm({ ...form!, form_key: response.data.data.form_key, liff_url: response.data.data.liff_url });
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success',
      });
      setShowRegenerateDialog(false);
    } catch (error: any) {
      console.error('Failed to regenerate key:', error);
      setSnackbar({
        open: true,
        message: 'キーの再生成に失敗しました',
        severity: 'error',
      });
    }
  };

  const handleTestSlack = async () => {
    if (!form) return;
    
    try {
      setTestingSlack(true);
      await axios.post(`/api/hearing-forms/${id}/test-slack`);
      setSnackbar({
        open: true,
        message: 'テスト通知を送信しました。Slackをご確認ください。',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to send test notification:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'テスト通知の送信に失敗しました',
        severity: 'error',
      });
    } finally {
      setTestingSlack(false);
    }
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

  if (!form) {
    return (
      <TenantLayout>
        <Box>
          <Alert severity="error">フォームが見つかりません</Alert>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/hearing-forms')} sx={{ mt: 2 }}>
            フォーム一覧に戻る
          </Button>
        </Box>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/hearing-forms')}
          sx={{ mb: 2 }}
          disabled={deleting}
        >
          フォーム一覧に戻る
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                {form.name}
              </Typography>
              {form.is_active ? (
                <Chip icon={<CheckCircle />} label="有効" color="success" />
              ) : (
                <Chip icon={<ErrorIcon />} label="無効" color="default" />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              作成日: {new Date(form.created_at).toLocaleDateString('ja-JP')} | 
              最終更新: {new Date(form.updated_at).toLocaleDateString('ja-JP')}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/hearing-forms/${id}/edit`)}
              disabled={deleting}
            >
              編集
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
              onClick={handleDelete}
              disabled={deleting}
            >
              削除
            </Button>
          </Stack>
        </Box>

        <Stack spacing={3}>
          {/* LIFF URL */}
          <Alert
            severity="info"
            icon={<LinkIcon />}
            action={
              <Button color="inherit" size="small" onClick={copyLiffUrl}>
                コピー
              </Button>
            }
          >
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              LIFF URL: {form.liff_url || '未設定'}
            </Typography>
          </Alert>

          {/* 統計情報 */}
          {statistics && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {statistics.total_responses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      総回答数
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {statistics.this_month}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      今月の回答
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                      {statistics.this_week}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      今週の回答
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      {statistics.today}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      今日の回答
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* 基本情報 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                基本情報
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="フォーム名"
                    secondary={form.name}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="説明"
                    secondary={form.description || '未設定'}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="フォームキー"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {form.form_key}
                        </Typography>
                        <Button size="small" onClick={() => setShowRegenerateDialog(true)}>
                          再生成
                        </Button>
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="フィールド数"
                    secondary={`${form.items?.length || 0}個`}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="有効/無効"
                    secondary={
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.is_active}
                            onChange={handleToggleActive}
                            disabled={toggling}
                          />
                        }
                        label={form.is_active ? '有効' : '無効'}
                      />
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* フォーム項目 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                フォーム項目
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {form.items && form.items.length > 0 ? (
                <Paper variant="outlined">
                  <List>
                    {form.items.map((item, index) => (
                      <ListItem key={index} divider={index < form.items.length - 1}>
                        <ListItemText
                          primary={`${index + 1}. ${item.label} ${item.required ? '(必須)' : '(任意)'}`}
                          secondary={`タイプ: ${item.type}${item.options ? ' | 選択肢: ' + item.options.join(', ') : ''}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ) : (
                <Alert severity="info">フォーム項目がありません</Alert>
              )}
            </CardContent>
          </Card>

          {/* Slack通知設定 */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <Notifications sx={{ mr: 1 }} />
                  Slack通知設定
                </Typography>
                <Chip
                  label={form.slack_notify ? '有効' : '無効'}
                  color={form.slack_notify ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              {form.slack_notify ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Webhook URL
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, wordBreak: 'break-all' }}>
                    {form.slack_webhook}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleTestSlack}
                    disabled={testingSlack}
                    startIcon={testingSlack && <CircularProgress size={16} />}
                  >
                    {testingSlack ? 'テスト送信中...' : 'テスト通知を送信'}
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Slack通知は無効です
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* 紐付けカレンダー */}
          {form.calendars && form.calendars.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  使用中のカレンダー
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Paper variant="outlined">
                  <List>
                    {form.calendars.map((calendar, index) => (
                      <ListItem key={index} divider={index < form.calendars.length - 1}>
                        <ListItemText
                          primary={calendar.name}
                          secondary={`ステータス: ${calendar.is_active ? '有効' : '無効'}`}
                        />
                        <Button size="small" onClick={() => navigate(`/calendars/${calendar.id}`)}>
                          詳細
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </CardContent>
            </Card>
          )}

          {/* 回答管理 */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  回答管理
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate(`/hearing-forms/${id}/responses`)}
                >
                  回答一覧を見る
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Stack>

        {/* キー再生成確認ダイアログ */}
        <Dialog open={showRegenerateDialog} onClose={() => setShowRegenerateDialog(false)}>
          <DialogTitle>フォームキーを再生成しますか？</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              フォームキーを再生成すると、現在のLIFF URLは使用できなくなります。
              既に配布しているURLがある場合は注意してください。
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRegenerateDialog(false)}>キャンセル</Button>
            <Button onClick={handleRegenerateKey} color="warning" variant="contained">
              再生成する
            </Button>
          </DialogActions>
        </Dialog>

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

export default HearingFormDetail;

