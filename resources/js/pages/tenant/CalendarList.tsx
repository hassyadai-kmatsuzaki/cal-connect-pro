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
  AvatarGroup,
  Tooltip,
  CircularProgress,
  Snackbar,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  People,
  Notifications,
  FilterList,
  LowPriority as PriorityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import PrioritySettingsModal from '../../components/PrioritySettingsModal';
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
  line_auto_reply: boolean;
  line_remind: boolean;
  hearing_form_id: number | null;
  hearing_form?: { id: number; name: string };
  created_at: string;
}

const CalendarList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');
  const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({});
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<Calendar | null>(null);

  // カレンダー一覧を取得
  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/calendars');
      setCalendars(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch calendars:', error);
      setSnackbar({
        open: true,
        message: 'カレンダーの取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, calendarId: number) => {
    setAnchorEl({ ...anchorEl, [calendarId]: event.currentTarget });
  };

  const handleMenuClose = (calendarId: number) => {
    setAnchorEl({ ...anchorEl, [calendarId]: null });
  };

  const handleView = (id: number) => {
    navigate(`/calendars/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/calendars/${id}/edit`);
  };

  const handleDuplicate = (id: number) => {
    console.log('Duplicate calendar:', id);
    // TODO: 複製処理（将来的に実装）
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このカレンダーを削除してもよろしいですか？\n関連する予約データも削除される可能性があります。')) {
      return;
    }

    try {
      setDeleting(id);
      await axios.delete(`/api/calendars/${id}`);
      setCalendars(calendars.filter((c) => c.id !== id));
      setSnackbar({
        open: true,
        message: 'カレンダーを削除しました',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to delete calendar:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'カレンダーの削除に失敗しました',
        severity: 'error',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleOpenPriorityModal = (calendar: Calendar) => {
    setSelectedCalendar(calendar);
    setPriorityModalOpen(true);
    handleMenuClose(calendar.id);
  };

  const handleClosePriorityModal = () => {
    setPriorityModalOpen(false);
    setSelectedCalendar(null);
  };

  const filteredCalendars = calendars
    .filter((calendar) => {
      if (filterType === 'active') return calendar.is_active;
      if (filterType === 'inactive') return !calendar.is_active;
      return true;
    })
    .filter((calendar) =>
      calendar.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getTypeLabel = (type: string) => {
    return type === 'any' ? 'いずれか空き' : '全員空き';
  };

  const getTypeColor = (type: string) => {
    return type === 'any' ? 'info' : 'success';
  };

  return (
    <TenantLayout>
      <Box>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              カレンダー管理
            </Typography>
            <Typography variant="body2" color="text.secondary">
              予約受付用のカレンダーを管理します
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/calendars/new')}
            size="large"
            sx={{ height: 'fit-content' }}
          >
            新規カレンダー作成
          </Button>
        </Box>

        {/* 統計情報 */}
        {!loading && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {calendars.length}
                  </Typography>
                  <Typography variant="body2">総カレンダー数</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {calendars.filter((c) => c.is_active).length}
                  </Typography>
                  <Typography variant="body2">有効なカレンダー</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    0
                  </Typography>
                  <Typography variant="body2">総予約数（近日実装）</Typography>
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
                placeholder="カレンダー名で検索..."
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
              <Stack direction="row" spacing={1}>
                <Button
                  variant={filterType === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setFilterType('all')}
                  size="small"
                  startIcon={<FilterList />}
                >
                  すべて
                </Button>
                <Button
                  variant={filterType === 'active' ? 'contained' : 'outlined'}
                  onClick={() => setFilterType('active')}
                  size="small"
                  color="success"
                >
                  有効
                </Button>
                <Button
                  variant={filterType === 'inactive' ? 'contained' : 'outlined'}
                  onClick={() => setFilterType('inactive')}
                  size="small"
                  color="error"
                >
                  無効
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* ローディング表示 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredCalendars.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            {searchQuery || filterType !== 'all'
              ? '条件に一致するカレンダーが見つかりません'
              : 'カレンダーがまだありません。新規作成してください。'}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredCalendars.map((calendar) => (
              <Grid item xs={12} lg={6} key={calendar.id}>
                  <Card
                  sx={{
                    height: '100%',
                    border: calendar.is_active ? '2px solid' : '1px solid',
                    borderColor: calendar.is_active ? 'primary.main' : 'divider',
                    transition: 'all 0.3s',
                    opacity: deleting === calendar.id ? 0.5 : 1,
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent>
                    {/* ヘッダー */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {calendar.name}
                          </Typography>
                          {calendar.is_active ? (
                            <Chip icon={<CheckCircle />} label="有効" color="success" size="small" />
                          ) : (
                            <Chip icon={<ErrorIcon />} label="無効" color="default" size="small" />
                          )}
                        </Box>
                        <Chip
                          label={getTypeLabel(calendar.type)}
                          color={getTypeColor(calendar.type)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, calendar.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl[calendar.id]}
                        open={Boolean(anchorEl[calendar.id])}
                        onClose={() => handleMenuClose(calendar.id)}
                      >
                        <MenuItem onClick={() => { handleView(calendar.id); handleMenuClose(calendar.id); }}>
                          <ListItemIcon>
                            <VisibilityIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>詳細を見る</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => handleOpenPriorityModal(calendar)}>
                          <ListItemIcon>
                            <PriorityIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>優先度設定</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => { handleEdit(calendar.id); handleMenuClose(calendar.id); }}>
                          <ListItemIcon>
                            <EditIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>編集</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => { handleDuplicate(calendar.id); handleMenuClose(calendar.id); }}>
                          <ListItemIcon>
                            <ContentCopyIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>複製</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => { handleDelete(calendar.id); handleMenuClose(calendar.id); }} sx={{ color: 'error.main' }}>
                          <ListItemIcon>
                            <DeleteIcon fontSize="small" color="error" />
                          </ListItemIcon>
                          <ListItemText>削除</ListItemText>
                        </MenuItem>
                      </Menu>
                    </Box>

                    {/* 基本情報 */}
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {calendar.start_time} - {calendar.end_time}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          表示間隔: {calendar.display_interval}分
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          予約枠: {calendar.event_duration}分
                        </Typography>
                      </Box>
                    </Box>

                    {/* 受付日 */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        受付曜日
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {calendar.accept_days.map((day) => (
                          <Chip key={day} label={day} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>

                    {/* 連携ユーザー */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        連携ユーザー
                      </Typography>
                      {calendar.users && calendar.users.length > 0 ? (
                        <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                          {calendar.users.map((user) => (
                            <Tooltip key={user.id} title={user.name}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                {user.name[0]}
                              </Avatar>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          未設定
                        </Typography>
                      )}
                    </Box>

                    {/* オプション機能 */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        有効な機能
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {calendar.slack_notify && (
                          <Chip icon={<Notifications />} label="Slack通知" size="small" color="primary" />
                        )}
                        {calendar.line_auto_reply && (
                          <Chip label="LINE自動返信" size="small" color="success" />
                        )}
                        {calendar.line_remind && (
                          <Chip label="LINEリマインド" size="small" color="info" />
                        )}
                        {calendar.hearing_form_id && (
                          <Chip label="ヒアリングフォーム" size="small" color="secondary" />
                        )}
                      </Stack>
                    </Box>

                    {/* 統計 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">
                        {calendar.days_in_advance}日先まで受付 / 最短{calendar.min_hours_before_booking}時間前
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleView(calendar.id)}
                      >
                        詳細を見る
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* 優先度設定モーダル */}
        {selectedCalendar && (
          <PrioritySettingsModal
            open={priorityModalOpen}
            onClose={handleClosePriorityModal}
            calendarId={selectedCalendar.id}
            calendarName={selectedCalendar.name}
            onUpdate={fetchCalendars}
          />
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

export default CalendarList;
