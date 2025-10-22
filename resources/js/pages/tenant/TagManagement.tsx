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
  Stack,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocalOffer,
} from '@mui/icons-material';
import axios from 'axios';
import TenantLayout from '../../layouts/TenantLayout';

interface Tag {
  id: number;
  name: string;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  line_users_count: number;
  created_at: string;
}

const TagManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: 'default' as Tag['color'],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });

  const colorOptions: { value: Tag['color']; label: string }[] = [
    { value: 'default', label: 'グレー（デフォルト）' },
    { value: 'primary', label: 'ブルー（プライマリ）' },
    { value: 'secondary', label: 'ピンク（セカンダリ）' },
    { value: 'success', label: 'グリーン（成功）' },
    { value: 'warning', label: 'オレンジ（警告）' },
    { value: 'error', label: 'レッド（エラー）' },
    { value: 'info', label: 'ライトブルー（情報）' },
  ];

  // タグ一覧を取得
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await axios.get('/api/tags');
      setTags(response.data.data);
    } catch (error) {
      console.error('タグの取得に失敗:', error);
      setSnackbar({
        open: true,
        message: 'タグの取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tag?: Tag) => {
    if (tag) {
      // 編集モード
      setEditingTag(tag);
      setFormData({ name: tag.name, color: tag.color });
    } else {
      // 新規作成モード
      setEditingTag(null);
      setFormData({ name: '', color: 'default' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTag(null);
    setFormData({ name: '', color: 'default' });
  };

  const handleSave = async () => {
    // バリデーション
    if (!formData.name.trim()) {
      setSnackbar({
        open: true,
        message: 'タグ名を入力してください',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingTag) {
        // 編集モード
        const response = await axios.put(`/api/tags/${editingTag.id}`, {
          name: formData.name,
          color: formData.color,
        });

        // タグリストを更新
        setTags(tags.map(tag => 
          tag.id === editingTag.id ? response.data.data : tag
        ));
        
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success',
        });
      } else {
        // 新規作成モード
        const response = await axios.post('/api/tags', {
          name: formData.name,
          color: formData.color,
        });

        setTags([response.data.data, ...tags]);
        
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success',
        });
      }
      
      handleCloseDialog();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        (editingTag ? 'タグの更新に失敗しました' : 'タグの作成に失敗しました');
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
    if (!confirm('このタグを削除してもよろしいですか？')) {
      return;
    }

    try {
      await axios.delete(`/api/tags/${id}`);
      
      setTags(tags.filter(tag => tag.id !== id));
      
      setSnackbar({
        open: true,
        message: 'タグを削除しました',
        severity: 'success',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'タグの削除に失敗しました';
      setSnackbar({
        open: true,
        message: errorMessage,
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            タグ管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            新しいタグ
          </Button>
        </Box>

        {tags.length === 0 ? (
          <Card>
            <CardContent>
              <Alert severity="info">
                タグが登録されていません。「新しいタグ」ボタンからタグを作成してください。
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalOffer sx={{ mr: 1 }} />
                タグ一覧
              </Typography>
              <Divider sx={{ my: 2 }} />

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>タグ名</TableCell>
                      <TableCell>色</TableCell>
                      <TableCell align="center">使用ユーザー数</TableCell>
                      <TableCell>作成日</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow key={tag.id} hover>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {tag.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tag.name}
                            color={tag.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {tag.line_users_count}人
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(tag.created_at).toLocaleDateString('ja-JP')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="編集">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleOpenDialog(tag)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="削除">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDelete(tag.id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  タグはLINEユーザーに付与して、顧客を分類・管理できます。
                  タグを削除してもユーザーは削除されません。
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* タグ作成・編集ダイアログ */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingTag ? 'タグを編集' : '新しいタグを作成'}</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="タグ名"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: VIP、常連、新規"
                helperText="タグ名は50文字以内で入力してください"
              />

              <FormControl fullWidth required>
                <InputLabel>色</InputLabel>
                <Select
                  value={formData.color}
                  label="色"
                  onChange={(e) => setFormData({ ...formData, color: e.target.value as Tag['color'] })}
                >
                  {colorOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={option.label}
                          color={option.value}
                          size="small"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Alert severity="info">
                <Typography variant="body2">
                  色はタグの視覚的な識別に使用されます。
                  用途に応じて分かりやすい色を選択してください。
                </Typography>
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={saving}>
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={saving}
              startIcon={saving && <CircularProgress size={20} />}
            >
              {saving 
                ? (editingTag ? '更新中...' : '作成中...') 
                : (editingTag ? '更新' : '作成')
              }
            </Button>
          </DialogActions>
        </Dialog>

        {/* スナックバー */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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

export default TagManagement;
