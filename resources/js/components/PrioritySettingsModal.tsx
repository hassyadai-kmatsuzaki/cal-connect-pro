import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Stack,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  priority: number;
}

interface AllUser {
  id: number;
  name: string;
  email: string;
}

interface PrioritySettingsModalProps {
  open: boolean;
  onClose: () => void;
  calendarId: number;
  calendarName: string;
  onUpdate: () => void;
}

const PrioritySettingsModal: React.FC<PrioritySettingsModalProps> = ({
  open,
  onClose,
  calendarId,
  calendarName,
  onUpdate,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState<number | ''>('');
  const [newPriority, setNewPriority] = useState<number>(5);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, calendarId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // カレンダーの担当者一覧を取得
      const usersRes = await axios.get(`/api/calendars/${calendarId}/users`);
      setUsers(usersRes.data.data);

      // 全ユーザー一覧を取得
      const allUsersRes = await axios.get('/api/calendar-users');
      setAllUsers(allUsersRes.data.data);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (newUserId === '') {
      setError('ユーザーを選択してください');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await axios.post(`/api/calendars/${calendarId}/users`, {
        user_id: newUserId,
        priority: newPriority,
      });

      // 再取得
      await fetchData();
      setNewUserId('');
      setNewPriority(5);
    } catch (err: any) {
      console.error('Failed to add user:', err);
      setError(err.response?.data?.message || '担当者の追加に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePriority = async (userId: number, priority: number) => {
    try {
      setSaving(true);
      setError(null);

      await axios.put(`/api/calendars/${calendarId}/users/${userId}`, {
        priority: priority,
      });

      // ローカルで更新
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, priority } : u))
      );
    } catch (err: any) {
      console.error('Failed to update priority:', err);
      setError('優先度の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!confirm('この担当者を削除してもよろしいですか？')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await axios.delete(`/api/calendars/${calendarId}/users/${userId}`);

      // ローカルで削除
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err: any) {
      console.error('Failed to remove user:', err);
      setError('担当者の削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
    onUpdate(); // 親コンポーネントを更新
  };

  // 追加可能なユーザー（まだ紐づいていないユーザー）
  const availableUsers = allUsers.filter(
    (au) => !users.some((u) => u.id === au.id)
  );

  // 優先度順にソート
  const sortedUsers = [...users].sort((a, b) => b.priority - a.priority);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        担当者の優先度設定
        <Typography variant="body2" color="text.secondary">
          {calendarName}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                優先度のルール
              </Typography>
              <Typography variant="body2">
                • 数字が大きいほど優先的にアサインされます（1-100）
              </Typography>
              <Typography variant="body2">
                • 同じ優先度で複数人が空いている場合はランダムに選択されます
              </Typography>
            </Alert>

            {/* 現在の担当者一覧 */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              現在の担当者
            </Typography>

            {sortedUsers.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                担当者が設定されていません
              </Alert>
            ) : (
              <Stack spacing={2} sx={{ mb: 3 }}>
                {sortedUsers.map((user) => (
                  <Box
                    key={user.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>優先度</InputLabel>
                      <Select
                        value={user.priority}
                        label="優先度"
                        onChange={(e) =>
                          handleUpdatePriority(user.id, Number(e.target.value))
                        }
                        disabled={saving}
                      >
                        {Array.from({ length: 10 }, (_, i) => (i + 1) * 10).map((val) => (
                          <MenuItem key={val} value={val}>
                            {val}
                          </MenuItem>
                        ))}
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                          <MenuItem key={val} value={val}>
                            {val}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <IconButton
                      color="error"
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={saving}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}

            <Divider sx={{ my: 3 }} />

            {/* 担当者追加 */}
            <Typography variant="h6" gutterBottom>
              担当者を追加
            </Typography>

            {availableUsers.length === 0 ? (
              <Alert severity="info">
                追加可能な担当者がいません
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>ユーザー</InputLabel>
                  <Select
                    value={newUserId}
                    label="ユーザー"
                    onChange={(e) => setNewUserId(Number(e.target.value))}
                    disabled={saving}
                  >
                    {availableUsers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>優先度</InputLabel>
                  <Select
                    value={newPriority}
                    label="優先度"
                    onChange={(e) => setNewPriority(Number(e.target.value))}
                    disabled={saving}
                  >
                    {Array.from({ length: 10 }, (_, i) => (i + 1) * 10).map((val) => (
                      <MenuItem key={val} value={val}>
                        {val}
                      </MenuItem>
                    ))}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                      <MenuItem key={val} value={val}>
                        {val}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddUser}
                  disabled={saving || newUserId === ''}
                >
                  追加
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrioritySettingsModal;

