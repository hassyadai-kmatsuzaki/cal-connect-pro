import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Stack,
  CircularProgress,
  Snackbar,
  Paper,
  Divider,
} from '@mui/material';
import {
  PersonAdd,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface InvitationData {
  invitation: {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'user';
    expires_at: string;
    inviter: {
      name: string;
    };
  };
  tenant_name: string;
}

const InviteAccept: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
    terms_accepted: false,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    const token = window.location.pathname.split('/').pop();
    if (token) {
      fetchInvitation(token);
    } else {
      setError('無効な招待リンクです');
      setLoading(false);
    }
  }, []);

  const fetchInvitation = async (token: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/invite/${token}`);
      setInvitationData(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch invitation:', error);
      setError(error.response?.data?.message || '招待の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!formData.password || !formData.password_confirmation) {
      setSnackbar({
        open: true,
        message: 'パスワードを入力してください',
        severity: 'error',
      });
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setSnackbar({
        open: true,
        message: 'パスワードが一致しません',
        severity: 'error',
      });
      return;
    }

    if (!formData.terms_accepted) {
      setSnackbar({
        open: true,
        message: '利用規約に同意してください',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const token = window.location.pathname.split('/').pop();
      const response = await axios.post('/api/invite/accept', {
        token,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        terms_accepted: formData.terms_accepted,
      });

      setSnackbar({
        open: true,
        message: 'アカウントが作成されました！',
        severity: 'success',
      });

      // ダッシュボードにリダイレクト
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      const errorMessage = error.response?.data?.message || 'アカウントの作成に失敗しました';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'grey.50'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'grey.50',
        p: 3
      }}>
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                エラー
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {error}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!invitationData) {
    return null;
  }

  const { invitation, tenant_name } = invitationData;
  const expiresAt = new Date(invitation.expires_at);
  const roleText = invitation.role === 'admin' ? '管理者' : 'ユーザー';

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'grey.50',
      py: 4
    }}>
      <Box sx={{ maxWidth: 600, mx: 'auto', px: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <PersonAdd sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                {tenant_name}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                アカウント招待
              </Typography>
            </Box>

            <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                招待内容
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    お名前
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {invitation.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    メールアドレス
                  </Typography>
                  <Typography variant="body1">
                    {invitation.email}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    権限
                  </Typography>
                  <Typography variant="body1">
                    {roleText}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    招待者
                  </Typography>
                  <Typography variant="body1">
                    {invitation.inviter.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    有効期限
                  </Typography>
                  <Typography variant="body1">
                    {expiresAt.toLocaleDateString('ja-JP')} {expiresAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              アカウント作成
            </Typography>

            <Stack spacing={3}>
              <TextField
                label="パスワード"
                type="password"
                fullWidth
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                helperText="8文字以上で入力してください"
              />

              <TextField
                label="パスワード確認"
                type="password"
                fullWidth
                required
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
              />

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="terms_accepted"
                  checked={formData.terms_accepted}
                  onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                  style={{ marginRight: 8 }}
                />
                <label htmlFor="terms_accepted">
                  <Typography variant="body2">
                    利用規約に同意する
                  </Typography>
                </label>
              </Box>

              <Alert severity="info">
                アカウント作成後、自動的にログインされ、ダッシュボードに移動します。
              </Alert>

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleAccept}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <CheckCircle />}
                sx={{ py: 1.5 }}
              >
                {saving ? '作成中...' : 'アカウントを作成'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Snackbar通知 */}
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
  );
};

export default InviteAccept;
