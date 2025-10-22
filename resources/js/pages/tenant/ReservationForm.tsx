import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  CircularProgress,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface Calendar {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
}

interface Reservation {
  id: number;
  calendar_id: number;
  reservation_datetime: string;
  duration_minutes: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  assigned_user_id?: number;
  status: string;
}

const ReservationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    calendar_id: '',
    reservation_datetime: '',
    duration_minutes: 60,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    assigned_user_id: '',
  });

  useEffect(() => {
    fetchCalendars();
    fetchUsers();
    if (isEdit && id) {
      fetchReservation();
    } else {
      setLoading(false);
    }
  }, [id, isEdit]);

  const fetchCalendars = async () => {
    try {
      const response = await axios.get('/api/calendars');
      setCalendars(response.data.data);
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
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

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/reservations/${id}`);
      const reservation = response.data.data;
      
      setFormData({
        calendar_id: reservation.calendar_id.toString(),
        reservation_datetime: reservation.reservation_datetime.replace(' ', 'T').slice(0, 16),
        duration_minutes: reservation.duration_minutes,
        customer_name: reservation.customer_name,
        customer_email: reservation.customer_email || '',
        customer_phone: reservation.customer_phone || '',
        assigned_user_id: reservation.assigned_user_id?.toString() || '',
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!formData.calendar_id || !formData.reservation_datetime || !formData.customer_name) {
      setSnackbar({
        open: true,
        message: '必須項目を入力してください',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        calendar_id: parseInt(formData.calendar_id),
        reservation_datetime: formData.reservation_datetime.replace('T', ' '),
        duration_minutes: formData.duration_minutes,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        assigned_user_id: formData.assigned_user_id ? parseInt(formData.assigned_user_id) : null,
      };

      if (isEdit) {
        await axios.put(`/api/reservations/${id}`, submitData);
        setSnackbar({
          open: true,
          message: '予約を更新しました',
          severity: 'success',
        });
      } else {
        await axios.post('/api/reservations', submitData);
        setSnackbar({
          open: true,
          message: '予約を作成しました',
          severity: 'success',
        });
      }
      
      navigate('/reservations');
    } catch (error: any) {
      console.error('Failed to save reservation:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || (isEdit ? '予約の更新に失敗しました' : '予約の作成に失敗しました'),
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              {isEdit ? '予約を編集' : '新規予約作成'}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <form onSubmit={handleSubmit}>
              {/* 基本情報 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon sx={{ mr: 1 }} />
                    基本情報
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>カレンダー</InputLabel>
                        <Select
                          value={formData.calendar_id}
                          label="カレンダー"
                          onChange={(e) => handleInputChange('calendar_id', e.target.value)}
                        >
                          {calendars.map((calendar) => (
                            <MenuItem key={calendar.id} value={calendar.id.toString()}>
                              {calendar.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="予約日時"
                        type="datetime-local"
                        fullWidth
                        required
                        value={formData.reservation_datetime}
                        onChange={(e) => handleInputChange('reservation_datetime', e.target.value)}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="予約時間（分）"
                        type="number"
                        fullWidth
                        required
                        value={formData.duration_minutes}
                        onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
                        inputProps={{ min: 15, max: 480 }}
                        helperText="15分〜480分の範囲で入力してください"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>担当者</InputLabel>
                        <Select
                          value={formData.assigned_user_id}
                          label="担当者"
                          onChange={(e) => handleInputChange('assigned_user_id', e.target.value)}
                        >
                          <MenuItem value="">
                            <em>未設定</em>
                          </MenuItem>
                          {users.map((user) => (
                            <MenuItem key={user.id} value={user.id.toString()}>
                              {user.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
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
                      <TextField
                        label="お名前"
                        fullWidth
                        required
                        value={formData.customer_name}
                        onChange={(e) => handleInputChange('customer_name', e.target.value)}
                        placeholder="山田太郎"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="メールアドレス"
                        type="email"
                        fullWidth
                        value={formData.customer_email}
                        onChange={(e) => handleInputChange('customer_email', e.target.value)}
                        placeholder="example@email.com"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="電話番号"
                        fullWidth
                        value={formData.customer_phone}
                        onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                        placeholder="090-1234-5678"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 保存ボタン */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/reservations')}
                  disabled={saving}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving 
                    ? (isEdit ? '更新中...' : '作成中...') 
                    : (isEdit ? '更新' : '作成')
                  }
                </Button>
              </Box>
            </form>
          </Grid>

          {/* サイドバー */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  注意事項
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      予約日時は現在より後の日時を指定してください。
                    </Typography>
                  </Alert>
                  <Alert severity="info">
                    <Typography variant="body2">
                      予約時間は15分〜480分の範囲で設定できます。
                    </Typography>
                  </Alert>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      管理者が作成した予約は自動的に「確定」ステータスになります。
                    </Typography>
                  </Alert>
                </Stack>
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

export default ReservationForm;
