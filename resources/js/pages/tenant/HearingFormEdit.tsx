import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Paper,
  CircularProgress,
  Snackbar,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator,
  Close,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface FormItem {
  label: string;
  type: 'text' | 'textarea' | 'email' | 'tel' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'time';
  required: boolean;
  options?: string[];
  placeholder?: string;
  help_text?: string;
}

const HearingFormEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openFieldDialog, setOpenFieldDialog] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [] as FormItem[],
    settings: {
      completion_message: '',
    },
    slack_notify: false,
    slack_webhook: '',
  });
  
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

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/hearing-forms/${id}`);
      const form = response.data.data;
      setFormData({
        name: form.name,
        description: form.description || '',
        items: form.items || [],
        settings: form.settings || { completion_message: '' },
        slack_notify: form.slack_notify || false,
        slack_webhook: form.slack_webhook || '',
      });
    } catch (error: any) {
      console.error('Failed to fetch form:', error);
      setSnackbar({
        open: true,
        message: 'フォームの取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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

    if (formData.slack_notify && !formData.slack_webhook.trim()) {
      setSnackbar({
        open: true,
        message: 'Slack通知を有効にする場合はWebhook URLを入力してください',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put(`/api/hearing-forms/${id}`, formData);
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success',
      });
      setTimeout(() => {
        navigate(`/hearing-forms/${id}`);
      }, 1000);
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
      const newItems = [...formData.items];
      newItems[editingItemIndex] = fieldData;
      setFormData({ ...formData, items: newItems });
    } else {
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
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/hearing-forms/${id}`)}
          sx={{ mb: 2 }}
        >
          詳細に戻る
        </Button>

        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
          フォームを編集
        </Typography>

        <Stack spacing={3}>
          {/* 基本情報 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                基本情報
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                <TextField
                  label="フォーム名"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                
                <TextField
                  label="説明"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* フォーム項目 */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  フォーム項目
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenFieldDialog()}
                >
                  項目を追加
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {formData.items.length === 0 ? (
                <Alert severity="info">項目を追加してください</Alert>
              ) : (
                <Paper variant="outlined">
                  <List>
                    {formData.items.map((item, index) => (
                      <ListItem key={index} divider={index < formData.items.length - 1}>
                        <IconButton size="small" sx={{ mr: 1, cursor: 'grab' }}>
                          <DragIndicator />
                        </IconButton>
                        <ListItemText
                          primary={`${index + 1}. ${item.label}`}
                          secondary={`${item.type} ${item.required ? '(必須)' : '(任意)'}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" size="small" onClick={() => handleOpenFieldDialog(index)} sx={{ mr: 1 }}>
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
            </CardContent>
          </Card>

          {/* 設定 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                設定
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                <TextField
                  label="送信完了メッセージ"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.settings.completion_message}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, completion_message: e.target.value }
                  })}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Slack通知設定 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Slack通知設定
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.slack_notify}
                      onChange={(e) => setFormData({ ...formData, slack_notify: e.target.checked })}
                    />
                  }
                  label="Slack通知を有効にする"
                />
                
                {formData.slack_notify && (
                  <TextField
                    label="Slack Webhook URL"
                    fullWidth
                    required
                    value={formData.slack_webhook}
                    onChange={(e) => setFormData({ ...formData, slack_webhook: e.target.value })}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* アクションボタン */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/hearing-forms/${id}`)}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving && <CircularProgress size={20} />}
            >
              {saving ? '保存中...' : '変更を保存'}
            </Button>
          </Box>
        </Stack>

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

export default HearingFormEdit;

