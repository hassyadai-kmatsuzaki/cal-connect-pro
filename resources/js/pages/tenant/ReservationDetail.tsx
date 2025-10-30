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
  Divider,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarTodayIcon,
  Source as SourceIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface Reservation {
  id: number;
  calendar_id: number;
  reservation_datetime: string;
  duration_minutes: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  meet_url?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  cancellation_reason?: string;
  cancelled_at?: string;
  assigned_user_id?: number;
  line_user_id?: number;
  inflow_source_id?: number;
  created_at: string;
  updated_at: string;
  calendar?: {
    id: number;
    name: string;
  };
  assignedUser?: {
    id: number;
    name: string;
  };
  lineUser?: {
    id: number;
    display_name: string;
    picture_url?: string;
  };
  inflowSource?: {
    id: number;
    name: string;
  };
  answers?: Array<{
    id: number;
    hearing_form_item_id: number;
    answer_text: string;
    hearingFormItem: {
      id: number;
      label: string;
      type: string;
    };
  }>;
}

interface User {
  id: number;
  name: string;
}

const ReservationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (id) {
      fetchReservation();
      fetchUsers();
    }
  }, [id]);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/reservations/${id}`);
      setReservation(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch reservation:', error);
      setSnackbar({
        open: true,
        message: '予約の取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/calendar-users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCancel = async () => {
    if (!reservation) return;

    try {
      setSaving(true);
      await axios.post(`/api/reservations/${reservation.id}/cancel`, {
        cancellation_reason: cancellationReason,
      });
      await fetchReservation();
      setCancelDialogOpen(false);
      setCancellationReason('');
      setSnackbar({
        open: true,
        message: '予約をキャンセルしました',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to cancel reservation:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '予約のキャンセルに失敗しました',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!reservation) return;

    try {
      setSaving(true);
      await axios.post(`/api/reservations/${reservation.id}/confirm`);
      await fetchReservation();
      setSnackbar({
        open: true,
        message: '予約を確定しました',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to confirm reservation:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '予約の確定に失敗しました',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!reservation) return;

    try {
      setSaving(true);
      await axios.post(`/api/reservations/${reservation.id}/complete`);
      await fetchReservation();
      setSnackbar({
        open: true,
        message: '予約を完了しました',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to complete reservation:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '予約の完了に失敗しました',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '保留中';
      case 'confirmed': return '確定';
      case 'completed': return '完了';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
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

  if (!reservation) {
    return (
      <TenantLayout>
        <Alert severity="error">
          予約が見つかりません
        </Alert>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Box>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/reservations')}
              variant="outlined"
            >
              一覧に戻る
            </Button>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                予約詳細
              </Typography>
              <Typography variant="body2" color="text.secondary">
                予約ID: {reservation.id}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/reservations/${reservation.id}/edit`)}
            >
              編集
            </Button>
            {reservation.status === 'pending' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={handleConfirm}
                disabled={saving}
              >
                確定
              </Button>
            )}
            {reservation.status === 'confirmed' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={handleComplete}
                disabled={saving}
              >
                完了
              </Button>
            )}
            {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<CancelIcon />}
                onClick={() => setCancelDialogOpen(true)}
                disabled={saving}
              >
                キャンセル
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* 基本情報 */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 1 }} />
                  基本情報
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        ステータス
                      </Typography>
                      <Chip
                        label={getStatusLabel(reservation.status)}
                        color={getStatusColor(reservation.status) as any}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        予約日時
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {formatDateTime(reservation.reservation_datetime)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reservation.duration_minutes}分間
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        カレンダー
                      </Typography>
                      <Typography variant="body1">
                        {reservation.calendar?.name || '不明'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        担当者
                      </Typography>
                      {reservation.assignedUser ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                            {reservation.assignedUser.name[0]}
                          </Avatar>
                          <Typography variant="body1">
                            {reservation.assignedUser.name}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body1" color="text.secondary">
                          未設定
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* お客様情報 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  お客様情報
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        お名前
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {reservation.customer_name}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        メールアドレス
                      </Typography>
                      <Typography variant="body1">
                        {reservation.customer_email || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        電話番号
                      </Typography>
                      <Typography variant="body1">
                        {reservation.customer_phone || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        LINEユーザー
                      </Typography>
                      {reservation.lineUser ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            src={reservation.lineUser.picture_url || undefined}
                            sx={{ width: 32, height: 32 }}
                          >
                            {!reservation.lineUser.picture_url && reservation.lineUser.display_name[0]}
                          </Avatar>
                          <Typography variant="body1">
                            {reservation.lineUser.display_name}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body1">-</Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Meet URL */}
            {reservation.meet_url && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    📹 Google Meet URL
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'primary.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.200'
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        wordBreak: 'break-all',
                        mb: 1
                      }}
                    >
                      {reservation.meet_url}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      href={reservation.meet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ mt: 1 }}
                    >
                      ミーティングに参加
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* ヒアリングフォーム回答 */}
            {reservation.answers && reservation.answers.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ChatIcon sx={{ mr: 1 }} />
                    ヒアリングフォーム回答
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={2}>
                    {reservation.answers.map((answer) => (
                      <Box key={answer.id} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {answer.hearingFormItem?.label || '質問項目'}
                        </Typography>
                        <Typography variant="body1">
                          {answer.answer_text}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* サイドバー */}
          <Grid item xs={12} md={4}>
            {/* 流入経路 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SourceIcon sx={{ mr: 1 }} />
                  流入経路
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1">
                  {reservation.inflowSource?.name || '不明'}
                </Typography>
              </CardContent>
            </Card>

            {/* キャンセル情報 */}
            {reservation.status === 'cancelled' && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error">
                    キャンセル情報
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      キャンセル日時
                    </Typography>
                    <Typography variant="body2">
                      {reservation.cancelled_at ? formatDateTime(reservation.cancelled_at) : '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      キャンセル理由
                    </Typography>
                    <Typography variant="body2">
                      {reservation.cancellation_reason || '理由なし'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* 作成・更新日時 */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  システム情報
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    作成日時
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(reservation.created_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    最終更新日時
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(reservation.updated_at)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* キャンセル確認ダイアログ */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>予約をキャンセル</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              この予約をキャンセルしてもよろしいですか？
            </Typography>
            <TextField
              label="キャンセル理由（任意）"
              fullWidth
              multiline
              rows={3}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="キャンセルの理由を入力してください..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)} disabled={saving}>
              キャンセル
            </Button>
            <Button
              onClick={handleCancel}
              color="warning"
              variant="contained"
              disabled={saving}
              startIcon={saving && <CircularProgress size={20} />}
            >
              {saving ? 'キャンセル中...' : '予約をキャンセル'}
            </Button>
          </DialogActions>
        </Dialog>

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

export default ReservationDetail;
