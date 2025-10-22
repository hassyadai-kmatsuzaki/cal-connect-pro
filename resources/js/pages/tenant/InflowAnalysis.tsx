import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  InputAdornment,
  Tooltip,
  Stack,
  CircularProgress,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  ContentCopy,
  Edit,
  Delete,
  TrendingUp,
  QrCode2,
  Link as LinkIcon,
  Visibility,
  CheckCircle,
  Analytics,
  Refresh,
} from '@mui/icons-material';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface InflowSource {
  id: number;
  name: string;
  source_key: string;
  liff_url: string;
  calendar_id: number;
  calendar: {
    id: number;
    name: string;
  };
  views: number;
  conversions: number;
  conversion_rate: number;
  is_active: boolean;
  created_at: string;
}

interface Calendar {
  id: number;
  name: string;
}

interface StatsData {
  summary: {
    total_views: number;
    total_conversions: number;
    conversion_rate: number;
    total_sources: number;
    active_sources: number;
  };
  sources: any[];
}

const InflowAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sources, setSources] = useState<InflowSource[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  
  // ダイアログ状態
  const [openDialog, setOpenDialog] = useState(false);
  const [openQrDialog, setOpenQrDialog] = useState(false);
  const [selectedSource, setSelectedSource] = useState<InflowSource | null>(null);
  
  // フォームデータ
  const [formData, setFormData] = useState({
    name: '',
    source_key: '',
    calendar_id: '',
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSources(),
        fetchCalendars(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await axios.get('/api/inflow-sources');
      setSources(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch sources:', error);
      setSnackbar({
        open: true,
        message: '流入経路の取得に失敗しました',
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

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/inflow-sources/stats/summary');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setSnackbar({
      open: true,
      message: 'URLをコピーしました',
      severity: 'success',
    });
  };

  const handleOpenDialog = (source?: InflowSource) => {
    if (source) {
      setSelectedSource(source);
      setFormData({
        name: source.name,
        source_key: source.source_key,
        calendar_id: source.calendar_id.toString(),
      });
    } else {
      setSelectedSource(null);
      setFormData({
        name: '',
        source_key: '',
        calendar_id: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSource(null);
    setFormData({
      name: '',
      source_key: '',
      calendar_id: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setSnackbar({
        open: true,
        message: '流入経路名を入力してください',
        severity: 'error',
      });
      return;
    }

    if (!formData.calendar_id) {
      setSnackbar({
        open: true,
        message: 'カレンダーを選択してください',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      if (selectedSource) {
        // 更新
        const response = await axios.put(`/api/inflow-sources/${selectedSource.id}`, {
          name: formData.name,
          calendar_id: formData.calendar_id,
        });
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success',
        });
      } else {
        // 新規作成
        const response = await axios.post('/api/inflow-sources', {
          name: formData.name,
          source_key: formData.source_key || undefined,
          calendar_id: formData.calendar_id,
        });
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success',
        });
      }
      
      handleCloseDialog();
      await fetchData();
    } catch (error: any) {
      console.error('Failed to save source:', error);
      const errorMessage = error.response?.data?.message || '保存に失敗しました';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この流入経路を削除してもよろしいですか？')) {
      return;
    }

    try {
      await axios.delete(`/api/inflow-sources/${id}`);
      setSnackbar({
        open: true,
        message: '流入経路を削除しました',
        severity: 'success',
      });
      await fetchData();
    } catch (error: any) {
      console.error('Failed to delete source:', error);
      const errorMessage = error.response?.data?.message || '削除に失敗しました';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await axios.post(`/api/inflow-sources/${id}/toggle`);
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success',
      });
      await fetchData();
    } catch (error: any) {
      console.error('Failed to toggle source:', error);
      setSnackbar({
        open: true,
        message: 'ステータスの更新に失敗しました',
        severity: 'error',
      });
    }
  };

  const handleShowQr = (source: InflowSource) => {
    setSelectedSource(source);
    setOpenQrDialog(true);
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
            流入経路分析
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
              onClick={() => handleOpenDialog()}
              size="large"
            >
              新規作成
            </Button>
          </Stack>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          流入経路ごとのURLを発行し、アクセス数やコンバージョン率を分析できます。
          各SNSや広告媒体ごとに異なるURLを作成して、効果測定にご活用ください。
        </Alert>

        {/* 統計サマリー */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Visibility color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      総アクセス数
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.summary.total_views.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircle color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      総コンバージョン
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.summary.total_conversions.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp color="warning" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      平均CVR
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.summary.conversion_rate.toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Analytics color="info" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      流入経路数
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.summary.active_sources} / {stats.summary.total_sources}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    アクティブ / 全体
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* 流入経路一覧 */}
        {sources.length === 0 ? (
          <Card>
            <CardContent>
              <Alert severity="info">
                流入経路がまだありません。「新規作成」ボタンから作成してください。
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>流入経路名</TableCell>
                      <TableCell>カレンダー</TableCell>
                      <TableCell align="center">アクセス数</TableCell>
                      <TableCell align="center">CV数</TableCell>
                      <TableCell align="center">CVR</TableCell>
                      <TableCell align="center">ステータス</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sources.map((source) => (
                      <TableRow key={source.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {source.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            識別キー: {source.source_key}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={source.calendar.name} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {source.views.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {source.conversions.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {(source.conversion_rate || 0).toFixed(2)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(source.conversion_rate || 0, 100)}
                              sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={source.is_active ? '有効' : '無効'}
                            color={source.is_active ? 'success' : 'default'}
                            size="small"
                            onClick={() => handleToggleActive(source.id)}
                            sx={{ cursor: 'pointer' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="URLをコピー">
                            <IconButton size="small" onClick={() => handleCopyUrl(source.liff_url)}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="QRコード">
                            <IconButton size="small" onClick={() => handleShowQr(source)}>
                              <QrCode2 fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="編集">
                            <IconButton size="small" onClick={() => handleOpenDialog(source)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="削除">
                            <IconButton size="small" color="error" onClick={() => handleDelete(source.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* 作成/編集ダイアログ */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedSource ? '流入経路を編集' : '新規流入経路作成'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="流入経路名"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: Instagram投稿、Twitter広告"
                helperText="どこからの流入か分かりやすい名前を付けてください"
              />

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

              {!selectedSource && (
                <TextField
                  label="識別キー（オプション）"
                  fullWidth
                  value={formData.source_key}
                  onChange={(e) => setFormData({ ...formData, source_key: e.target.value })}
                  placeholder="例: instagram_post_01"
                  helperText="空欄の場合は自動生成されます"
                />
              )}

              {selectedSource && (
                <Alert severity="info" icon={<LinkIcon />}>
                  識別キーは作成後は変更できません
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={saving}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving && <CircularProgress size={20} />}
            >
              {saving ? '保存中...' : (selectedSource ? '更新' : '作成')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* QRコードダイアログ */}
        <Dialog open={openQrDialog} onClose={() => setOpenQrDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>QRコード</DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              {selectedSource && (
                <>
                  <Typography variant="h6" gutterBottom>
                    {selectedSource.name}
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      bgcolor: 'background.default',
                      display: 'inline-block',
                      my: 2,
                    }}
                  >
                    <QrCode2 sx={{ fontSize: 250, color: 'text.secondary' }} />
                  </Paper>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    QRコードライブラリは別途実装が必要です
                  </Alert>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, wordBreak: 'break-all' }}>
                    {selectedSource.liff_url}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopy />}
                    onClick={() => handleCopyUrl(selectedSource.liff_url)}
                  >
                    URLをコピー
                  </Button>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenQrDialog(false)}>閉じる</Button>
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

export default InflowAnalysis;
