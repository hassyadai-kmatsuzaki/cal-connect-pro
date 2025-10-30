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
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Source as SourceIcon,
  Chat as ChatIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface FormSubmissionAnswer {
  id: number;
  hearing_form_item_id: number;
  answer_text: string;
  hearingFormItem: {
    id: number;
    label: string;
    type: string;
  };
}

interface FormSubmission {
  id: number;
  hearing_form_id: number;
  line_user_id: number;
  status: 'pending' | 'read' | 'replied' | 'archived';
  submitted_at: string;
  read_at?: string;
  replied_at?: string;
  notes?: string;
  hearingForm?: {
    id: number;
    name: string;
    description: string;
  };
  lineUser?: {
    id: number;
    line_user_id: string;
    display_name: string;
    picture_url?: string;
  };
  inflowSource?: {
    id: number;
    name: string;
  };
  answers: FormSubmissionAnswer[];
}

const FormSubmissionDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [openReplyDialog, setOpenReplyDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    if (id) {
      fetchSubmission();
    }
  }, [id]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/form-submissions/${id}`);
      setSubmission(response.data.data);
      setStatus(response.data.data.status);
      setNotes(response.data.data.notes || '');
    } catch (error) {
      console.error('Failed to fetch form submission:', error);
      setSnackbar({
        open: true,
        message: '回答の取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      setSnackbar({
        open: true,
        message: 'メッセージを入力してください',
        severity: 'error',
      });
      return;
    }

    try {
      setSending(true);
      await axios.post(`/api/form-submissions/${id}/reply`, {
        message: replyMessage,
      });

      setSnackbar({
        open: true,
        message: 'LINEメッセージを送信しました',
        severity: 'success',
      });

      setOpenReplyDialog(false);
      setReplyMessage('');
      fetchSubmission(); // 再読み込み
    } catch (error: any) {
      console.error('Failed to send reply:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '送信に失敗しました',
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await axios.patch(`/api/form-submissions/${id}`, {
        status,
        notes,
      });

      setSnackbar({
        open: true,
        message: '更新しました',
        severity: 'success',
      });

      fetchSubmission();
    } catch (error) {
      console.error('Failed to update submission:', error);
      setSnackbar({
        open: true,
        message: '更新に失敗しました',
        severity: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('この回答を削除してもよろしいですか？')) {
      return;
    }

    try {
      await axios.delete(`/api/form-submissions/${id}`);
      setSnackbar({
        open: true,
        message: '削除しました',
        severity: 'success',
      });
      navigate('/form-submissions');
    } catch (error) {
      console.error('Failed to delete submission:', error);
      setSnackbar({
        open: true,
        message: '削除に失敗しました',
        severity: 'error',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'read':
        return 'info';
      case 'replied':
        return 'success';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '未読';
      case 'read':
        return '既読';
      case 'replied':
        return '返信済み';
      case 'archived':
        return 'アーカイブ';
      default:
        return status;
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

  if (!submission) {
    return (
      <TenantLayout>
        <Alert severity="error">回答が見つかりません</Alert>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/form-submissions')}
          sx={{ mb: 3 }}
        >
          一覧に戻る
        </Button>

        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
          フォーム回答詳細
        </Typography>

        <Grid container spacing={3}>
          {/* 左側：回答情報 */}
          <Grid item xs={12} md={8}>
            {/* フォーム情報 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {submission.hearingForm?.name}
                </Typography>
                {submission.hearingForm?.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {submission.hearingForm.description}
                  </Typography>
                )}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip
                    label={getStatusLabel(submission.status)}
                    color={getStatusColor(submission.status)}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    送信日時: {new Date(submission.submitted_at).toLocaleString('ja-JP')}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* LINEユーザー情報 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  LINEユーザー情報
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={submission.lineUser?.picture_url}
                    sx={{ width: 56, height: 56 }}
                  >
                    {submission.lineUser?.display_name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {submission.lineUser?.display_name || '不明'}
                    </Typography>
                    {submission.inflowSource && (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <SourceIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          流入経路: {submission.inflowSource.name}
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* 回答内容 */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <ChatIcon sx={{ mr: 1 }} />
                  回答内容
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={3}>
                  {submission.answers.map((answer) => (
                    <Box key={answer.id}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {answer.hearingFormItem.label}
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: 'background.default',
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {answer.answer_text}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* 右側：操作パネル */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  操作
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                  {/* ステータス変更 */}
                  <FormControl fullWidth size="small">
                    <InputLabel>ステータス</InputLabel>
                    <Select
                      value={status}
                      label="ステータス"
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <MenuItem value="pending">未読</MenuItem>
                      <MenuItem value="read">既読</MenuItem>
                      <MenuItem value="replied">返信済み</MenuItem>
                      <MenuItem value="archived">アーカイブ</MenuItem>
                    </Select>
                  </FormControl>

                  {/* 管理者メモ */}
                  <TextField
                    label="管理者メモ"
                    multiline
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    size="small"
                  />

                  <Button
                    variant="contained"
                    onClick={handleUpdateStatus}
                    fullWidth
                  >
                    更新
                  </Button>

                  <Divider />

                  {/* LINE返信 */}
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<SendIcon />}
                    onClick={() => setOpenReplyDialog(true)}
                    fullWidth
                  >
                    LINEで返信
                  </Button>

                  <Divider />

                  {/* 削除 */}
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    fullWidth
                  >
                    削除
                  </Button>
                </Stack>

                {submission.replied_at && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    返信済み: {new Date(submission.replied_at).toLocaleString('ja-JP')}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 返信ダイアログ */}
        <Dialog open={openReplyDialog} onClose={() => setOpenReplyDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>LINEで返信</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="メッセージ"
              fullWidth
              multiline
              rows={6}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="返信メッセージを入力してください"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReplyDialog(false)}>キャンセル</Button>
            <Button onClick={handleSendReply} variant="contained" disabled={sending}>
              {sending ? '送信中...' : '送信'}
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

export default FormSubmissionDetail;

