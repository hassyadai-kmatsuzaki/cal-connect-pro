import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface HearingForm {
  id: number;
  name: string;
  description: string;
  total_responses: number;
}

interface FormResponse {
  id: number;
  line_user: {
    id: number;
    display_name: string;
    picture_url: string;
  };
  status: string;
  submitted_at: string;
  answers: Array<{
    id: number;
    hearing_form_item_id: number;
    answer_text: string;
    item: {
      id: number;
      label: string;
      type: string;
    };
  }>;
}

interface UserResponse {
  line_user_id: number;
  display_name: string;
  picture_url: string;
  response_count: number;
  latest_response_at: string;
}

const HearingFormResponses: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<HearingForm | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMenuResponse, setSelectedMenuResponse] = useState<FormResponse | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // フォーム情報を取得
      const formRes = await axios.get(`/api/tenant/hearing-forms/${id}`);
      setForm(formRes.data.data);

      // 回答データを取得（回答ごと）
      const responsesRes = await axios.get(`/api/tenant/hearing-forms/${id}/responses`);
      setResponses(responsesRes.data.data);

      // 回答データを取得（ユーザーごと）
      const userResponsesRes = await axios.get(`/api/tenant/hearing-forms/${id}/responses/by-user`);
      setUserResponses(userResponsesRes.data.data);

    } catch (err: any) {
      console.error('データ取得エラー:', err);
      setError(err.response?.data?.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResponse = (response: FormResponse) => {
    setSelectedResponse(response);
    setDialogOpen(true);
  };

  const handleDeleteClick = (response: FormResponse) => {
    setSelectedMenuResponse(response);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedMenuResponse) return;

    try {
      setDeletingId(selectedMenuResponse.id);
      await axios.delete(`/api/tenant/hearing-forms/${id}/responses/${selectedMenuResponse.id}`);
      setDeleteDialogOpen(false);
      setSelectedMenuResponse(null);
      fetchData();
    } catch (err: any) {
      console.error('削除エラー:', err);
      alert(err.response?.data?.message || '削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`/api/tenant/hearing-forms/${id}/responses/export`, {
        responseType: 'blob',
        params: {
          format: 'csv',
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form_responses_${id}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('エクスポートエラー:', err);
      alert(err.response?.data?.message || 'エクスポートに失敗しました');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, response: FormResponse) => {
    setAnchorEl(event.currentTarget);
    setSelectedMenuResponse(response);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <TenantLayout>
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      </TenantLayout>
    );
  }

  if (error || !form) {
    return (
      <TenantLayout>
        <Box sx={{ py: 4 }}>
          <Alert severity="error">{error || 'フォームが見つかりません'}</Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/hearing-forms')}
            sx={{ mt: 2 }}
          >
            戻る
          </Button>
        </Box>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Box sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(`/hearing-forms/${id}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            {form.name} - 回答一覧
          </Typography>
          <Typography variant="body2" color="text.secondary">
            全{form.total_responses}件の回答
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          CSVエクスポート
        </Button>
      </Box>

      {/* タブ */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab icon={<AssignmentIcon />} label="回答ごと" iconPosition="start" />
          <Tab icon={<PersonIcon />} label="ユーザーごと" iconPosition="start" />
        </Tabs>
      </Card>

      {/* 回答ごとの表示 */}
      {tab === 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ユーザー</TableCell>
                  <TableCell>送信日時</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {responses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary" py={4}>
                        回答がありません
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  responses.map((response) => (
                    <TableRow key={response.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img
                            src={response.line_user.picture_url || '/default-avatar.png'}
                            alt={response.line_user.display_name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                          <Typography>{response.line_user.display_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(response.submitted_at)}</TableCell>
                      <TableCell>
                        <Chip
                          label={response.status === 'completed' ? '完了' : '下書き'}
                          color={response.status === 'completed' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewResponse(response)}
                          sx={{ mr: 1 }}
                        >
                          詳細
                        </Button>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, response)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ユーザーごとの表示 */}
      {tab === 1 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ユーザー</TableCell>
                  <TableCell>回答数</TableCell>
                  <TableCell>最終回答日時</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userResponses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary" py={4}>
                        回答がありません
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  userResponses.map((user) => (
                    <TableRow key={user.line_user_id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img
                            src={user.picture_url || '/default-avatar.png'}
                            alt={user.display_name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                          <Typography>{user.display_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${user.response_count}件`} size="small" />
                      </TableCell>
                      <TableCell>{formatDate(user.latest_response_at)}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            const userResponsesList = responses.filter(
                              (r) => r.line_user.id === user.line_user_id
                            );
                            if (userResponsesList.length > 0) {
                              handleViewResponse(userResponsesList[0]);
                            }
                          }}
                        >
                          詳細を表示
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* 詳細ダイアログ */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedResponse && (
              <>
                <img
                  src={selectedResponse.line_user.picture_url || '/default-avatar.png'}
                  alt={selectedResponse.line_user.display_name}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
                <Box>
                  <Typography variant="h6">{selectedResponse.line_user.display_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(selectedResponse.submitted_at)}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedResponse && (
            <Box sx={{ py: 2 }}>
              {selectedResponse.answers.map((answer) => (
                <Box key={answer.id} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {answer.item.label}
                  </Typography>
                  <Typography variant="body1">{answer.answer_text}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>回答を削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>この操作は取り消せません。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={!!deletingId}
          >
            {deletingId ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* メニュー */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => selectedMenuResponse && handleViewResponse(selectedMenuResponse)}>
          <ListItemIcon>
            <AssignmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>詳細を表示</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedMenuResponse && handleDeleteClick(selectedMenuResponse)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </Menu>
      </Box>
    </TenantLayout>
  );
};

export default HearingFormResponses;

