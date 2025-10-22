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
  Avatar,
  AvatarGroup,
  Tooltip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  People,
  Notifications,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface Calendar {
  id: number;
  name: string;
  type: 'any' | 'all';
  accept_days: string[];
  start_time: string;
  end_time: string;
  display_interval: number;
  event_duration: number;
  days_in_advance: number;
  min_hours_before_booking: number;
  users: { id: number; name: string; email: string }[];
  invite_calendars: string[];
  is_active: boolean;
  slack_notify: boolean;
  slack_webhook: string | null;
  slack_message: string | null;
  line_auto_reply: boolean;
  include_meet_url: boolean;
  line_reply_message: string | null;
  line_remind: boolean;
  remind_days_before: number;
  remind_hours_before: number;
  line_remind_message: string | null;
  hearing_form_id: number | null;
  hearing_form?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

const CalendarDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // カレンダー詳細を取得
  useEffect(() => {
    fetchCalendar();
  }, [id]);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/calendars/${id}`);
      setCalendar(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch calendar:', error);
      setSnackbar({
        open: true,
        message: 'カレンダーの取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!calendar) return;
    
    try {
      setToggling(true);
      const response = await axios.post(`/api/calendars/${id}/toggle`);
      setCalendar(response.data.data);
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to toggle calendar:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'ステータスの更新に失敗しました',
        severity: 'error',
      });
    } finally {
      setToggling(false);
    }
  };

  const handleEdit = () => {
    navigate(`/calendars/${id}/edit`);
  };

  const handleDuplicate = () => {
    setSnackbar({
      open: true,
      message: '複製機能は近日実装予定です',
      severity: 'info',
    });
  };

  const handleDelete = async () => {
    if (!confirm('このカレンダーを削除してもよろしいですか？\n関連する予約データも削除される可能性があります。')) {
      return;
    }

    try {
      setDeleting(true);
      await axios.delete(`/api/calendars/${id}`);
      setSnackbar({
        open: true,
        message: 'カレンダーを削除しました',
        severity: 'success',
      });
      setTimeout(() => {
        navigate('/calendars');
      }, 1000);
    } catch (error: any) {
      console.error('Failed to delete calendar:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'カレンダーの削除に失敗しました',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const copyBookingUrl = () => {
    if (!calendar) return;
    
    // TODO: 正確な予約URLを生成する（将来的に実装）
    const bookingUrl = `${window.location.origin}/book/${calendar.id}`;
    navigator.clipboard.writeText(bookingUrl);
    setSnackbar({
      open: true,
      message: '予約URLをコピーしました',
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

  if (!calendar) {
    return (
      <TenantLayout>
        <Box>
          <Alert severity="error">カレンダーが見つかりません</Alert>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/calendars')} sx={{ mt: 2 }}>
            カレンダー一覧に戻る
          </Button>
        </Box>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Box>
        {/* ヘッダー */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/calendars')}
            sx={{ mb: 2 }}
            disabled={deleting}
          >
            カレンダー一覧に戻る
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                  {calendar.name}
                </Typography>
                {calendar.is_active ? (
                  <Chip icon={<CheckCircle />} label="有効" color="success" />
                ) : (
                  <Chip icon={<ErrorIcon />} label="無効" color="default" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                作成日: {new Date(calendar.created_at).toLocaleDateString('ja-JP')} | 
                最終更新: {new Date(calendar.updated_at).toLocaleDateString('ja-JP')}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                disabled={deleting}
              >
                編集
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleDuplicate}
                disabled={deleting}
              >
                複製
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
        </Box>

        <Grid container spacing={3}>
          {/* 予約URL */}
          <Grid item xs={12}>
            <Alert
              severity="info"
              icon={<LinkIcon />}
              action={
                <Button color="inherit" size="small" onClick={copyBookingUrl}>
                  コピー
                </Button>
              }
            >
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                予約URL: {window.location.origin}/book/{calendar.id}
              </Typography>
            </Alert>
          </Grid>

          {/* 統計情報 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  総予約数（近日実装）
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {calendar.users?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  連携ユーザー数
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {calendar.display_interval}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  表示間隔（分）
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {calendar.event_duration}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  予約枠（分）
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 基本情報 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <Schedule sx={{ mr: 1 }} />
                  基本情報
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="カレンダータイプ"
                      secondary={calendar.type === 'any' ? 'いずれか空いている' : '全員空いている'}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="受付曜日"
                      secondary={
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                          {calendar.accept_days.map((day) => (
                            <Chip key={day} label={day} size="small" />
                          ))}
                        </Stack>
                      }
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="受付時間"
                      secondary={`${calendar.start_time} - ${calendar.end_time}`}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="予約受付期間"
                      secondary={`${calendar.days_in_advance}日先まで / 最短${calendar.min_hours_before_booking}時間前から`}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="有効/無効"
                      secondary={
                        <FormControlLabel
                          control={
                            <Switch
                              checked={calendar.is_active}
                              onChange={handleToggleActive}
                              disabled={toggling}
                            />
                          }
                          label={calendar.is_active ? '有効' : '無効'}
                        />
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* 連携設定 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <People sx={{ mr: 1 }} />
                  連携設定
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="連携ユーザー"
                      secondary={
                        calendar.users && calendar.users.length > 0 ? (
                          <AvatarGroup max={5} sx={{ justifyContent: 'flex-start', mt: 1 }}>
                            {calendar.users.map((user) => (
                              <Tooltip key={user.id} title={`${user.name} (${user.email})`}>
                                <Avatar sx={{ width: 40, height: 40 }}>
                                  {user.name[0]}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            未設定
                          </Typography>
                        )
                      }
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="招待するカレンダー"
                      secondary={
                        calendar.invite_calendars && calendar.invite_calendars.length > 0 ? (
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {calendar.invite_calendars.map((email, index) => (
                              <Typography key={index} variant="body2">
                                • {email}
                              </Typography>
                            ))}
                          </Stack>
                        ) : (
                          'なし'
                        )
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* 通知設定 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <Notifications sx={{ mr: 1 }} />
                  通知設定
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                  {/* Slack通知 */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
                          Slack通知
                        </Typography>
                        <Chip
                          label={calendar.slack_notify ? '有効' : '無効'}
                          color={calendar.slack_notify ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      {calendar.slack_notify && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Webhook URL
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1, wordBreak: 'break-all' }}>
                            {calendar.slack_webhook || '未設定'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            通知文言
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {calendar.slack_message || '未設定'}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* LINE自動返信 */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
                          LINE自動返信
                        </Typography>
                        <Chip
                          label={calendar.line_auto_reply ? '有効' : '無効'}
                          color={calendar.line_auto_reply ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      {calendar.line_auto_reply && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Google Meet URL: {calendar.include_meet_url ? '含める' : '含めない'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            返信文言
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {calendar.line_reply_message || '未設定'}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* LINEリマインド */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
                          LINEリマインド
                        </Typography>
                        <Chip
                          label={calendar.line_remind ? '有効' : '無効'}
                          color={calendar.line_remind ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      {calendar.line_remind && (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            送信タイミング: {calendar.remind_days_before}日{calendar.remind_hours_before}時間前
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            リマインド文言
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {calendar.line_remind_message || '未設定'}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* ヒアリングフォーム */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        ヒアリングフォーム
                      </Typography>
                      <Typography variant="body2">
                        {calendar.hearing_form?.name || 'なし'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
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

export default CalendarDetail;
