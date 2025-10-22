import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Paper,
  CircularProgress,
  Snackbar,
  Checkbox,
  Radio,
  RadioGroup,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator,
  Preview,
  Close,
} from '@mui/icons-material';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface FormItem {
  id?: number;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'tel' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'time';
  required: boolean;
  options?: string[];
  placeholder?: string;
  help_text?: string;
}

interface HearingForm {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  items: FormItem[];
  items_count?: number;
  created_at: string;
}

const HearingForms: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState<HearingForm[]>([]);
  
  // ダイアログ状態
  const [openDialog, setOpenDialog] = useState(false);
  const [editingForm, setEditingForm] = useState<HearingForm | null>(null);
  const [previewForm, setPreviewForm] = useState<HearingForm | null>(null);
  const [openFieldDialog, setOpenFieldDialog] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  // フォームデータ
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [] as FormItem[],
  });
  
  // フィールドダイアログデータ
  const [fieldData, setFieldData] = useState<FormItem>({
    label: '',
    type: 'text',
    required: false,
    options: [],
    placeholder: '',
    help_text: '',
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // フォーム一覧を取得
  useEffect(() => {
    fetchForms();
  }, []);

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

  const handleOpenDialog = async (form?: HearingForm) => {
    if (form) {
      // 詳細を取得
      try {
        const response = await axios.get(`/api/hearing-forms/${form.id}`);
        const formDetail = response.data.data;
        setEditingForm(formDetail);
        setFormData({
          name: formDetail.name,
          description: formDetail.description || '',
          items: formDetail.items || [],
        });
      } catch (error: any) {
        console.error('Failed to fetch form detail:', error);
        setSnackbar({
          open: true,
          message: 'フォーム詳細の取得に失敗しました',
          severity: 'error',
        });
        return;
      }
    } else {
      setEditingForm(null);
      setFormData({
        name: '',
        description: '',
        items: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingForm(null);
    setFormData({
      name: '',
      description: '',
      items: [],
    });
  };

  const handleSaveForm = async () => {
    // バリデーション
    if (!formData.name.trim()) {
      setSnackbar({
        open: true,
        message: 'フォーム名を入力してください',
        severity: 'error',
      });
      return;
    }

    if (formData.items.length === 0) {
      setSnackbar({
        open: true,
        message: '最低1つの項目を追加してください',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingForm) {
        // 更新
        const response = await axios.put(`/api/hearing-forms/${editingForm.id}`, formData);
        setForms(forms.map(f => f.id === editingForm.id ? response.data.data : f));
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success',
        });
      } else {
        // 新規作成
        const response = await axios.post('/api/hearing-forms', formData);
        setForms([response.data.data, ...forms]);
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success',
        });
      }
      handleCloseDialog();
    } catch (error: any) {
      console.error('Failed to save form:', error);
      const errorMessage = error.response?.data?.message || 'フォームの保存に失敗しました';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await axios.post(`/api/hearing-forms/${id}/toggle`);
      setForms(forms.map(f => f.id === id ? response.data.data : f));
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to toggle form:', error);
      setSnackbar({
        open: true,
        message: 'ステータスの更新に失敗しました',
        severity: 'error',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このフォームを削除してもよろしいですか？\nカレンダーで使用中の場合は削除できません。')) {
      return;
    }

    try {
      await axios.delete(`/api/hearing-forms/${id}`);
      setForms(forms.filter(f => f.id !== id));
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
  };

  const handleOpenFieldDialog = (index?: number) => {
    if (index !== undefined) {
      setEditingItemIndex(index);
      setFieldData(formData.items[index]);
    } else {
      setEditingItemIndex(null);
      setFieldData({
        label: '',
        type: 'text',
        required: false,
        options: [],
        placeholder: '',
        help_text: '',
      });
    }
    setOpenFieldDialog(true);
  };

  const handleCloseFieldDialog = () => {
    setOpenFieldDialog(false);
    setEditingItemIndex(null);
  };

  const handleSaveField = () => {
    if (!fieldData.label.trim()) {
      setSnackbar({
        open: true,
        message: 'ラベルを入力してください',
        severity: 'error',
      });
      return;
    }

    if (['select', 'radio', 'checkbox'].includes(fieldData.type) && (!fieldData.options || fieldData.options.length === 0)) {
      setSnackbar({
        open: true,
        message: '選択肢を最低1つ追加してください',
        severity: 'error',
      });
      return;
    }

    if (editingItemIndex !== null) {
      // 編集
      const newItems = [...formData.items];
      newItems[editingItemIndex] = fieldData;
      setFormData({ ...formData, items: newItems });
    } else {
      // 新規追加
      setFormData({ ...formData, items: [...formData.items, fieldData] });
    }
    
    handleCloseFieldDialog();
  };

  const handleDeleteField = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleAddOption = () => {
    setFieldData({
      ...fieldData,
      options: [...(fieldData.options || []), ''],
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...(fieldData.options || [])];
    newOptions[index] = value;
    setFieldData({
      ...fieldData,
      options: newOptions,
    });
  };

  const handleDeleteOption = (index: number) => {
    setFieldData({
      ...fieldData,
      options: (fieldData.options || []).filter((_, i) => i !== index),
    });
  };

  const renderFieldPreview = (field: FormItem) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <TextField
            fullWidth
            label={field.label}
            required={field.required}
            type={field.type}
            placeholder={field.placeholder}
            helperText={field.help_text}
          />
        );
      case 'textarea':
        return (
          <TextField
            fullWidth
            label={field.label}
            required={field.required}
            multiline
            rows={4}
            placeholder={field.placeholder}
            helperText={field.help_text}
          />
        );
      case 'select':
        return (
          <FormControl fullWidth required={field.required}>
            <InputLabel>{field.label}</InputLabel>
            <Select label={field.label}>
              {field.options?.map((option, i) => (
                <MenuItem key={i} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'radio':
        return (
          <FormControl component="fieldset" required={field.required}>
            <Typography variant="subtitle2" gutterBottom>
              {field.label}
            </Typography>
            <RadioGroup>
              {field.options?.map((option, i) => (
                <FormControlLabel key={i} value={option} control={<Radio />} label={option} />
              ))}
            </RadioGroup>
          </FormControl>
        );
      case 'checkbox':
        return (
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              {field.label}
            </Typography>
            {field.options?.map((option, i) => (
              <FormControlLabel key={i} control={<Checkbox />} label={option} />
            ))}
          </FormControl>
        );
      case 'date':
        return (
          <TextField
            fullWidth
            label={field.label}
            required={field.required}
            type="date"
            InputLabelProps={{ shrink: true }}
            helperText={field.help_text}
          />
        );
      case 'time':
        return (
          <TextField
            fullWidth
            label={field.label}
            required={field.required}
            type="time"
            InputLabelProps={{ shrink: true }}
            helperText={field.help_text}
          />
        );
      default:
        return <TextField fullWidth label={field.label} required={field.required} />;
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
            ヒアリングフォーム
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            新規フォーム作成
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          予約時にお客様に入力していただくヒアリングフォームを作成・管理できます。
          フォームは複数作成でき、カレンダーごとに使い分けることができます。
        </Alert>

        {forms.length === 0 ? (
          <Card>
            <CardContent>
              <Alert severity="info">
                ヒアリングフォームがまだありません。「新規フォーム作成」ボタンから作成してください。
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {forms.map((form) => (
              <Grid item xs={12} md={6} key={form.id}>
                <Card
                  sx={{
                    height: '100%',
                    border: form.is_active ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {form.name}
                        </Typography>
                        <Chip
                          label={form.is_active ? '使用中' : '停止中'}
                          color={form.is_active ? 'primary' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(form)}
                          sx={{ mr: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(form.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {form.description || '説明なし'}
                    </Typography>

                    <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        フィールド数: {form.items_count || form.items?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        作成日: {new Date(form.created_at).toLocaleDateString('ja-JP')}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Preview />}
                        onClick={() => setPreviewForm(form)}
                        fullWidth
                      >
                        プレビュー
                      </Button>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.is_active}
                            onChange={() => handleToggleActive(form.id)}
                            color="primary"
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* フォーム作成/編集ダイアログ */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingForm ? 'フォームを編集' : '新規フォーム作成'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="フォーム名"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                label="説明"
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              
              <Divider />
              
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    フィールド設定
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenFieldDialog()}
                  >
                    フィールド追加
                  </Button>
                </Box>
                
                {formData.items.length === 0 ? (
                  <Alert severity="info">フィールドを追加してください</Alert>
                ) : (
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <List>
                      {formData.items.map((item, index) => (
                        <ListItem key={index}>
                          <IconButton size="small" sx={{ mr: 1 }}>
                            <DragIndicator />
                          </IconButton>
                          <ListItemText
                            primary={item.label}
                            secondary={`${item.type} ${item.required ? '(必須)' : '(任意)'}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" size="small" onClick={() => handleOpenFieldDialog(index)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton edge="end" size="small" color="error" onClick={() => handleDeleteField(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={saving}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveForm}
              disabled={saving}
              startIcon={saving && <CircularProgress size={20} />}
            >
              {saving ? '保存中...' : (editingForm ? '更新' : '作成')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* フィールド追加/編集ダイアログ */}
        <Dialog open={openFieldDialog} onClose={handleCloseFieldDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingItemIndex !== null ? 'フィールドを編集' : 'フィールドを追加'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="ラベル"
                fullWidth
                required
                value={fieldData.label}
                onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
              />
              
              <FormControl fullWidth required>
                <InputLabel>フィールドタイプ</InputLabel>
                <Select
                  value={fieldData.type}
                  label="フィールドタイプ"
                  onChange={(e) => setFieldData({ ...fieldData, type: e.target.value as any })}
                >
                  <MenuItem value="text">テキスト</MenuItem>
                  <MenuItem value="textarea">テキストエリア（複数行）</MenuItem>
                  <MenuItem value="email">メールアドレス</MenuItem>
                  <MenuItem value="tel">電話番号</MenuItem>
                  <MenuItem value="number">数値</MenuItem>
                  <MenuItem value="select">セレクトボックス</MenuItem>
                  <MenuItem value="radio">ラジオボタン</MenuItem>
                  <MenuItem value="checkbox">チェックボックス</MenuItem>
                  <MenuItem value="date">日付</MenuItem>
                  <MenuItem value="time">時刻</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={fieldData.required}
                    onChange={(e) => setFieldData({ ...fieldData, required: e.target.checked })}
                  />
                }
                label="必須項目"
              />
              
              {!['select', 'radio', 'checkbox'].includes(fieldData.type) && (
                <TextField
                  label="プレースホルダー"
                  fullWidth
                  value={fieldData.placeholder}
                  onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
                />
              )}
              
              <TextField
                label="ヘルプテキスト"
                fullWidth
                multiline
                rows={2}
                value={fieldData.help_text}
                onChange={(e) => setFieldData({ ...fieldData, help_text: e.target.value })}
              />
              
              {['select', 'radio', 'checkbox'].includes(fieldData.type) && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">選択肢</Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={handleAddOption}>
                      追加
                    </Button>
                  </Box>
                  <Stack spacing={1}>
                    {(fieldData.options || []).map((option, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={option}
                          onChange={(e) => handleUpdateOption(index, e.target.value)}
                          placeholder={`選択肢 ${index + 1}`}
                        />
                        <IconButton size="small" color="error" onClick={() => handleDeleteOption(index)}>
                          <Close />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseFieldDialog}>キャンセル</Button>
            <Button variant="contained" onClick={handleSaveField}>
              {editingItemIndex !== null ? '更新' : '追加'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* プレビューダイアログ */}
        <Dialog
          open={!!previewForm}
          onClose={() => setPreviewForm(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>フォームプレビュー</DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              {previewForm?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {previewForm?.description}
            </Typography>
            
            <Stack spacing={2}>
              {previewForm?.items?.map((field, index) => (
                <Box key={index}>{renderFieldPreview(field)}</Box>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewForm(null)}>閉じる</Button>
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

export default HearingForms;
