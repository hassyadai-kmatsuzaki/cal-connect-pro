import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Stack,
  Avatar,
  Tooltip,
  CircularProgress,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarTodayIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import { getApiBasePath } from '../../utils/api';
import axios from 'axios';

interface Reservation {
  id: number;
  calendar_id: number;
  reservation_datetime: string;
  duration_minutes: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
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
  };
  inflowSource?: {
    id: number;
    name: string;
  };
}

interface Calendar {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
}

const ReservationManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [filterCalendar, setFilterCalendar] = useState<number | 'all'>('all');
  const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({});
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // 予約一覧を取得
  useEffect(() => {
    fetchReservations();
    fetchCalendars();
    fetchUsers();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCalendar !== 'all') params.append('calendar_id', filterCalendar.toString());
      
      const apiBasePath = getApiBasePath();
      const response = await axios.get(`${apiBasePath}/reservations?${params.toString()}`);
      setReservations(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch reservations:', error);
      setSnackbar({
        open: true,
        message: '予約の取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const apiBasePath = getApiBasePath();
      console.log('[ReservationManagement] Fetching calendars from:', `${apiBasePath}/calendars`);
      console.log('[ReservationManagement] Current URL:', window.location.href);
      console.log('[ReservationManagement] Axios base URL:', axios.defaults.baseURL);
      
      const response = await axios.get(`${apiBasePath}/calendars`);
      console.log('[ReservationManagement] Calendar response:', response);
      setCalendars(response.data.data);
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
      console.error('Error details:', error.response);
    }
  };

  const fetchUsers = async () => {
    try {
      const apiBasePath = getApiBasePath();
      const response = await axios.get(`${apiBasePath}/calendar-users`);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reservationId: number) => {
    setAnchorEl({ ...anchorEl, [reservationId]: event.currentTarget });
  };

  const handleMenuClose = (reservationId: number) => {
    setAnchorEl({ ...anchorEl, [reservationId]: null });
  };

  const handleView = (id: number) => {
    navigate(`/reservations/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/reservations/${id}/edit`);
  };

  const handleCancel = async (id: number) => {
    if (!confirm('この予約をキャンセルしてもよろしいですか？')) {
      return;
    }

    try {
      const apiBasePath = getApiBasePath();
      await axios.post(`${apiBasePath}/reservations/${id}/cancel`);
      await fetchReservations();
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
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      const apiBasePath = getApiBasePath();
      await axios.post(`${apiBasePath}/reservations/${id}/confirm`);
      await fetchReservations();
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
    }
  };

  const handleComplete = async (id: number) => {
    try {
      const apiBasePath = getApiBasePath();
      await axios.post(`${apiBasePath}/reservations/${id}/complete`);
      await fetchReservations();
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
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この予約を削除してもよろしいですか？\nこの操作は取り消せません。')) {
      return;
    }

    try {
      setDeleting(id);
      const apiBasePath = getApiBasePath();
      await axios.delete(`${apiBasePath}/reservations/${id}`);
      setReservations(reservations.filter((r) => r.id !== id));
      setSnackbar({
        open: true,
        message: '予約を削除しました',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to delete reservation:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '予約の削除に失敗しました',
        severity: 'error',
      });
    } finally {
      setDeleting(null);
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

  return (
    <TenantLayout>
      <Box>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              予約管理
            </Typography>
            <Typography variant="body2" color="text.secondary">
              予約の確認・管理・編集を行います
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/reservations/new')}
            size="large"
            sx={{ height: 'fit-content' }}
          >
            新規予約作成
          </Button>
        </Box>

        {/* 統計情報 */}
        {!loading && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {reservations.length}
                  </Typography>
                  <Typography variant="body2">総予約数</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {reservations.filter((r) => r.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2">保留中</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {reservations.filter((r) => r.status === 'confirmed').length}
                  </Typography>
                  <Typography variant="body2">確定済み</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {reservations.filter((r) => r.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2">完了済み</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* 検索・フィルター */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                placeholder="お客様名・メール・電話番号で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={filterStatus}
                  label="ステータス"
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <SelectMenuItem value="all">すべて</SelectMenuItem>
                  <SelectMenuItem value="pending">保留中</SelectMenuItem>
                  <SelectMenuItem value="confirmed">確定</SelectMenuItem>
                  <SelectMenuItem value="completed">完了</SelectMenuItem>
                  <SelectMenuItem value="cancelled">キャンセル</SelectMenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>カレンダー</InputLabel>
                <Select
                  value={filterCalendar}
                  label="カレンダー"
                  onChange={(e) => setFilterCalendar(e.target.value as any)}
                >
                  <SelectMenuItem value="all">すべて</SelectMenuItem>
                  {calendars.map((calendar) => (
                    <SelectMenuItem key={calendar.id} value={calendar.id}>
                      {calendar.name}
                    </SelectMenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchReservations}
                size="small"
              >
                更新
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* ローディング表示 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : reservations.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            {searchQuery || filterStatus !== 'all' || filterCalendar !== 'all'
              ? '条件に一致する予約が見つかりません'
              : '予約がまだありません。'}
          </Alert>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ mr: 1 }} />
                予約一覧
              </Typography>
              <Divider sx={{ my: 2 }} />

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>お客様情報</TableCell>
                      <TableCell>予約日時</TableCell>
                      <TableCell>カレンダー</TableCell>
                      <TableCell>担当者</TableCell>
                      <TableCell>ステータス</TableCell>
                      <TableCell>流入経路</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {reservation.customer_name}
                            </Typography>
                            {reservation.customer_email && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <EmailIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {reservation.customer_email}
                                </Typography>
                              </Box>
                            )}
                            {reservation.customer_phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {reservation.customer_phone}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {formatDateTime(reservation.reservation_datetime)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {reservation.duration_minutes}分
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {reservation.calendar?.name || '不明'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {reservation.assignedUser ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {reservation.assignedUser.name[0]}
                              </Avatar>
                              <Typography variant="body2">
                                {reservation.assignedUser.name}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              未設定
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(reservation.status)}
                            color={getStatusColor(reservation.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {reservation.inflowSource?.name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="詳細を見る">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleView(reservation.id)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="編集">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleEdit(reservation.id)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            {reservation.status === 'pending' && (
                              <Tooltip title="確定">
                                <IconButton
                                  color="success"
                                  size="small"
                                  onClick={() => handleConfirm(reservation.id)}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {reservation.status === 'confirmed' && (
                              <Tooltip title="完了">
                                <IconButton
                                  color="success"
                                  size="small"
                                  onClick={() => handleComplete(reservation.id)}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                              <Tooltip title="キャンセル">
                                <IconButton
                                  color="warning"
                                  size="small"
                                  onClick={() => handleCancel(reservation.id)}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="削除">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDelete(reservation.id)}
                                disabled={deleting === reservation.id}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

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

export default ReservationManagement;
