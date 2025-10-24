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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Email,
  PersonAdd,
  CheckCircle,
  Schedule,
  Cancel,
} from '@mui/icons-material';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface UserInvitation {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  token: string;
  invited_by: number;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  inviter: {
    id: number;
    name: string;
  };
}

const UserInvitationManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user-invitations');
      setInvitations(response.data.data.data);
    } catch (error: any) {
      console.error('Failed to fetch invitations:', error);
      setSnackbar({
        open: true,
        message: '招待一覧の取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      name: '',
      email: '',
      role: 'user',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      email: '',
      role: 'user',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setSnackbar({
        open: true,
        message: '名前とメールアドレスを入力してください',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post('/api/user-invitations', formData);
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success',
      });
      handleCloseDialog();
      await fetchInvitations();
    } catch (error: any) {
      console.error('Failed to create invitation:', error);
      const errorMessage = error.response?.data?.message || '招待の作成に失敗しました';
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
    if (!confirm('この招待を削除してもよろしいですか？')) {
      return;
    }

    try {
      await axios.delete(`/api/user-invitations/${id}`);
      setSnackbar({
        open: true,
        message: '招待を削除しました',
        severity: 'success',
      });
      await fetchInvitations();
    } catch (error: any) {
      console.error('Failed to delete invitation:', error);
      const errorMessage = error.response?.data?.message || '削除に失敗しました';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleResend = async (id: number) => {
    try {
      await axios.post(`/api/user-invitations/${id}/resend`);
      setSnackbar({
        open: true,
        message: '招待メールを再送信しました',
        severity: 'success',
      });
      await fetchInvitations();
    } catch (error: any) {
      console.error('Failed to resend invitation:', error);
      const errorMessage = error.response?.data?.message || '再送信に失敗しました';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const getStatusChip = (invitation: UserInvitation) => {
    if (invitation.accepted_at) {
      return <Chip label="完了" color="success" size="small" icon={<CheckCircle />} />;
    }
    
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      return <Chip label="期限切れ" color="error" size="small" icon={<Cancel />} />;
    }
    
    return <Chip label="未使用" color="warning" size="small" icon={<Schedule />} />;
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
            ユーザー招待管理
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchInvitations}
            >
              更新
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenDialog}
              size="large"
            >
              新規招待
            </Button>
          </Stack>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          ユーザーを招待して、チームメンバーとして追加できます。招待されたユーザーはメールでアカウント作成を行います。
        </Alert>

        {/* 招待一覧 */}
        {invitations.length === 0 ? (
          <Card>
            <CardContent>
              <Alert severity="info">
                招待がまだありません。「新規招待」ボタンから招待してください。
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
                      <TableCell>名前</TableCell>
                      <TableCell>メールアドレス</TableCell>
                      <TableCell align="center">権限</TableCell>
                      <TableCell align="center">状態</TableCell>
                      <TableCell align="center">招待者</TableCell>
                      <TableCell align="center">有効期限</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {invitation.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {invitation.email}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={invitation.role === 'admin' ? '管理者' : 'ユーザー'}
                            color={invitation.role === 'admin' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {getStatusChip(invitation)}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {invitation.inviter.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {new Date(invitation.expires_at).toLocaleDateString('ja-JP')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {!invitation.accepted_at && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleResend(invitation.id)}
                                title="再送信"
                              >
                                <Refresh fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(invitation.id)}
                                title="削除"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* 招待作成ダイアログ */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonAdd sx={{ mr: 1 }} />
              ユーザーを招待
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="名前"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: 田中太郎"
              />

              <TextField
                label="メールアドレス"
                fullWidth
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="例: tanaka@example.com"
              />

              <FormControl fullWidth>
                <InputLabel>権限</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                  label="権限"
                >
                  <MenuItem value="user">ユーザー</MenuItem>
                  <MenuItem value="admin">管理者</MenuItem>
                </Select>
              </FormControl>

              <Alert severity="info">
                招待されたユーザーにはメールが送信され、7日間有効な招待リンクが含まれます。
              </Alert>
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
              {saving ? '送信中...' : '招待メールを送信'}
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

export default UserInvitationManagement;
