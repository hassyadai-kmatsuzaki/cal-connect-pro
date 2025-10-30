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
  CircularProgress,
  Snackbar,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface HearingForm {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  form_key: string;
  liff_url: string;
  total_responses: number;
  items_count?: number;
  created_at: string;
  is_used_in_active_calendar?: boolean;
}

const HearingFormList: React.FC = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<HearingForm[]>([]);
  const [filteredForms, setFilteredForms] = useState<HearingForm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedForm, setSelectedForm] = useState<HearingForm | null>(null);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    // 検索フィルター
    if (searchQuery.trim() === '') {
      setFilteredForms(forms);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredForms(
        forms.filter(
          (form) =>
            form.name.toLowerCase().includes(query) ||
            form.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, forms]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/hearing-forms');
      setForms(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch forms:', error);
      setSnackbar({
        open: true,
        message: 'フォームの取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, form: HearingForm) => {
    setAnchorEl(event.currentTarget);
    setSelectedForm(form);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedForm(null);
  };

  const handleView = () => {
    if (selectedForm) {
      navigate(`/hearing-forms/${selectedForm.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedForm) {
      navigate(`/hearing-forms/${selectedForm.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDuplicate = async () => {
    if (!selectedForm) return;

    try {
      const response = await axios.post(`/api/hearing-forms/${selectedForm.id}/duplicate`);
      setForms([response.data.data, ...forms]);
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to duplicate form:', error);
      setSnackbar({
        open: true,
        message: 'フォームの複製に失敗しました',
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedForm) return;

    if (!confirm(`「${selectedForm.name}」を削除してもよろしいですか？\nカレンダーで使用中の場合は削除できません。`)) {
      handleMenuClose();
      return;
    }

    try {
      await axios.delete(`/api/hearing-forms/${selectedForm.id}`);
      setForms(forms.filter((f) => f.id !== selectedForm.id));
      setSnackbar({
        open: true,
        message: 'フォームを削除しました',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to delete form:', error);
      const errorMessage = error.response?.data?.message || 'フォームの削除に失敗しました';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const copyLiffUrl = async (form: HearingForm) => {
    try {
      const response = await axios.get(`/api/hearing-forms/${form.id}/liff-url`);
      const liffUrl = response.data.data.liff_url;
      
      if (liffUrl) {
        navigator.clipboard.writeText(liffUrl);
        setSnackbar({
          open: true,
          message: 'LIFF URLをコピーしました',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'LIFF URLが設定されていません',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Failed to get LIFF URL:', error);
      setSnackbar({
        open: true,
        message: 'LIFF URLの取得に失敗しました',
        severity: 'error',
      });
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
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              ヒアリングフォーム
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              予約時や独立したフォームとしてユーザーに入力してもらうフォームを管理します
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/hearing-forms/new')}
            size="large"
          >
            新規作成
          </Button>
        </Box>

        {/* 検索バー */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="フォーム名や説明で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* 統計情報 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {forms.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  総フォーム数
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {forms.filter((f) => f.is_active).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  有効なフォーム
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {forms.reduce((sum, f) => sum + (f.total_responses || 0), 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  総回答数
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* フォーム一覧 */}
        {filteredForms.length === 0 ? (
          <Card>
            <CardContent>
              <Alert severity="info">
                {searchQuery
                  ? '検索条件に一致するフォームがありません'
                  : 'ヒアリングフォームがまだありません。「新規作成」ボタンから作成してください。'}
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredForms.map((form) => (
              <Grid item xs={12} md={6} lg={4} key={form.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: form.is_active ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => navigate(`/hearing-forms/${form.id}`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {form.name}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <Chip
                            label={form.is_active ? '有効' : '無効'}
                            color={form.is_active ? 'success' : 'default'}
                            size="small"
                          />
                          {form.is_used_in_active_calendar && (
                            <Chip label="カレンダー使用中" color="primary" size="small" />
                          )}
                        </Stack>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, form);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {form.description || '説明なし'}
                    </Typography>

                    <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            フィールド数
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {form.items_count || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            回答数
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {form.total_responses || 0}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<LinkIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLiffUrl(form);
                        }}
                        fullWidth
                      >
                        URL
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AssessmentIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/hearing-forms/${form.id}/responses`);
                        }}
                        fullWidth
                      >
                        回答
                      </Button>
                    </Box>

                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                      作成日: {new Date(form.created_at).toLocaleDateString('ja-JP')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* メニュー */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleView}>詳細を見る</MenuItem>
          <MenuItem onClick={handleEdit}>編集</MenuItem>
          <MenuItem onClick={handleDuplicate}>複製</MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            削除
          </MenuItem>
        </Menu>

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

export default HearingFormList;

