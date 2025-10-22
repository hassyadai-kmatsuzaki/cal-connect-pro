import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Visibility,
  Refresh,
  FilterList,
} from '@mui/icons-material';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface Reservation {
  id: number;
  calendar_id: number;
  calendar: {
    id: number;
    name: string;
  };
  line_user?: {
    id: number;
    display_name: string;
  };
  inflow_source?: {
    id: number;
    name: string;
  };
  assigned_user?: {
    id: number;
    name: string;
  };
  reservation_datetime: string;
  duration_minutes: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

interface Calendar {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
}

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

const Reservations: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  
  // フィルター
  const [filterCalendarId, setFilterCalendarId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // ダイアログ
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // フォームデータ
  const [formData, setFormData] = useState({
    calendar_id: '',
    reservation_datetime: '',
    duration_minutes: 60,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    assigned_user_id: '',
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchData();
  }, [filterCalendarId, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchReservations(),
        fetchCalendars(),
        fetchUsers(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const params: any = {};
      if (filterCalendarId) params.calendar_id = filterCalendarId;
      if (filterStatus) params.status = filterStatus;
      
      const response = await axios.get('/api/reservations', { params });
      setReservations(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch reservations:', error);
      setSnackbar({
        open: true,
        message: '予約の取得に失敗しました',
        severity: 'error',
      });
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await axios.get('/api/calendars');
      setCalendars(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch calendars:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/calendar-users');
      setUsers(response.data);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/reservations/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCreateReservation = async () => {
    if (!formData.calendar_id || !formData.reservation_datetime || !formData.customer_name) {
      setSnackbar({
        open: true,
        message: '必須項目を入力してください',
        severity: 'error',
      });
      return;
    }

    try {
      await axios.post('/api/reservations', formData);
      setSnackbar({
        open: true,
        message: '予約を作成しました',
        severity: 'success',
      });
      setOpenCreateDialog(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Failed to create reservation:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '予約の作成に失敗しました',
        severity: 'error',
      });
    }
  };

  const handleConfirm = async (id: number) => {
    if (!confirm('この予約を確定しますか？')) return;
    
    try {
      await axios.post(`/api/reservations/${id}/confirm`);
      setSnackbar({
        open: true,
        message: '予約を確定しました',
        severity: 'success',
      });
      await fetchData();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: '予約の確定に失敗しました',
        severity: 'error',
      });
    }
  };

  const handleCancel = async (id: number) => {
    const reason = prompt('キャンセル理由を入力してください（任意）');
    if (reason === null) return;
    
    try {
      await axios.post(`/api/reservations/${id}/cancel`, {
        cancellation_reason: reason || undefined,
      });
      setSnackbar({
        open: true,
        message: '予約をキャンセルしました',
        severity: 'success',
      });
      await fetchData();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: '予約のキャンセルに失敗しました',
        severity: 'error',
      });
    }
  };

  const handleComplete = async (id: number) => {
    if (!confirm('この予約を完了としてマークしますか？')) return;
    
    try {
      await axios.post(`/api/reservations/${id}/complete`);
      setSnackbar({
        open: true,
        message: '予約を完了しました',
        severity: 'success',
      });
      await fetchData();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: '予約の完了に失敗しました',
        severity: 'error',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この予約を削除してもよろしいですか？')) return;
    
    try {
      await axios.delete(`/api/reservations/${id}`);
      setSnackbar({
        open: true,
        message: '予約を削除しました',
        severity: 'success',
      });
      await fetchData();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: '予約の削除に失敗しました',
        severity: 'error',
      });
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const response = await axios.get(`/api/reservations/${id}`);
      setSelectedReservation(response.data.data);
      setOpenDetailDialog(true);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: '予約詳細の取得に失敗しました',
        severity: 'error',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      calendar_id: '',
      reservation_datetime: '',
      duration_minutes: 60,
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      assigned_user_id: '',
    });
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            予約管理
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchData}
            >
              更新
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenCreateDialog(true)}
              size="large"
            >
              新規予約作成
            </Button>
          </Stack>
        </Box>

        {/* 統計サマリー */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    総予約数
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="warning.main">
                    保留中
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {stats.pending}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="info.main">
                    確定
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {stats.confirmed}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="success.main">
                    完了
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {stats.completed}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="error.main">
                    キャンセル
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {stats.cancelled}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* フィルター */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <FilterList />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>カレンダー</InputLabel>
                <Select
                  value={filterCalendarId}
                  label="カレンダー"
                  onChange={(e) => setFilterCalendarId(e.target.value)}
                >
                  <MenuItem value="">すべて</MenuItem>
                  {calendars.map((calendar) => (
                    <MenuItem key={calendar.id} value={calendar.id}>
                      {calendar.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={filterStatus}
                  label="ステータス"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">すべて</MenuItem>
                  <MenuItem value="pending">保留中</MenuItem>
                  <MenuItem value="confirmed">確定</MenuItem>
                  <MenuItem value="completed">完了</MenuItem>
                  <MenuItem value="cancelled">キャンセル</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        {/* 予約一覧 */}
        <Card>
          <CardContent>
            {reservations.length === 0 ? (
              <Alert severity="info">予約がありません</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>予約日時</TableCell>
                      <TableCell>カレンダー</TableCell>
                      <TableCell>お客様名</TableCell>
                      <TableCell>連絡先</TableCell>
                      <TableCell align="center">ステータス</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id} hover>
                        <TableCell>{reservation.id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {new Date(reservation.reservation_datetime).toLocaleString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reservation.duration_minutes}分
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={reservation.calendar.name} size="small" />
                        </TableCell>
                        <TableCell>{reservation.customer_name}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{reservation.customer_email || '-'}</Typography>
                          <Typography variant="caption">{reservation.customer_phone || '-'}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={getStatusLabel(reservation.status)}
                            color={getStatusColor(reservation.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="詳細">
                            <IconButton size="small" onClick={() => handleViewDetail(reservation.id)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {reservation.status === 'pending' && (
                            <Tooltip title="確定">
                              <IconButton size="small" color="info" onClick={() => handleConfirm(reservation.id)}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {reservation.status === 'confirmed' && (
                            <Tooltip title="完了">
                              <IconButton size="small" color="success" onClick={() => handleComplete(reservation.id)}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {['pending', 'confirmed'].includes(reservation.status) && (
                            <Tooltip title="キャンセル">
                              <IconButton size="small" color="error" onClick={() => handleCancel(reservation.id)}>
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="削除">
                            <IconButton size="small" color="error" onClick={() => handleDelete(reservation.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* 新規作成ダイアログ */}
        <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>新規予約作成</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>カレンダー</InputLabel>
                <Select
                  value={formData.calendar_id}
                  label="カレンダー"
                  onChange={(e) => setFormData({ ...formData, calendar_id: e.target.value })}
                >
                  {calendars.map((calendar) => (
                    <MenuItem key={calendar.id} value={calendar.id}>
                      {calendar.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="予約日時"
                type="datetime-local"
                fullWidth
                required
                value={formData.reservation_datetime}
                onChange={(e) => setFormData({ ...formData, reservation_datetime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="所要時間（分）"
                type="number"
                fullWidth
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              />

              <TextField
                label="お客様名"
                fullWidth
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />

              <TextField
                label="メールアドレス"
                type="email"
                fullWidth
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              />

              <TextField
                label="電話番号"
                fullWidth
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              />

              <FormControl fullWidth>
                <InputLabel>担当者</InputLabel>
                <Select
                  value={formData.assigned_user_id}
                  label="担当者"
                  onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                >
                  <MenuItem value="">未割り当て</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateDialog(false)}>キャンセル</Button>
            <Button variant="contained" onClick={handleCreateReservation}>
              作成
            </Button>
          </DialogActions>
        </Dialog>

        {/* 詳細ダイアログ */}
        <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>予約詳細</DialogTitle>
          <DialogContent>
            {selectedReservation && (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">予約ID</Typography>
                  <Typography variant="body1">{selectedReservation.id}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">予約日時</Typography>
                  <Typography variant="body1">
                    {new Date(selectedReservation.reservation_datetime).toLocaleString('ja-JP')}
                    <Chip label={`${selectedReservation.duration_minutes}分`} size="small" sx={{ ml: 1 }} />
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">カレンダー</Typography>
                  <Typography variant="body1">{selectedReservation.calendar.name}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">お客様情報</Typography>
                  <Typography variant="body1">名前: {selectedReservation.customer_name}</Typography>
                  <Typography variant="body2">メール: {selectedReservation.customer_email || '未登録'}</Typography>
                  <Typography variant="body2">電話: {selectedReservation.customer_phone || '未登録'}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">ステータス</Typography>
                  <Chip
                    label={getStatusLabel(selectedReservation.status)}
                    color={getStatusColor(selectedReservation.status)}
                  />
                </Paper>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetailDialog(false)}>閉じる</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
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

export default Reservations;
