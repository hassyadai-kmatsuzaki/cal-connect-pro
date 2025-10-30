import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import axios from 'axios';

interface FormSubmission {
  id: number;
  hearing_form_id: number;
  line_user_id: number;
  status: 'pending' | 'read' | 'replied' | 'archived';
  submitted_at: string;
  hearingForm?: {
    id: number;
    name: string;
  };
  lineUser?: {
    id: number;
    display_name: string;
    picture_url?: string;
  };
  inflowSource?: {
    id: number;
    name: string;
  };
  answers_count?: number;
}

interface HearingForm {
  id: number;
  name: string;
}

const FormSubmissions: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [forms, setForms] = useState<HearingForm[]>([]);
  
  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // フィルター
  const [filters, setFilters] = useState({
    hearing_form_id: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    fetchForms();
    fetchSubmissions();
  }, [page, rowsPerPage, filters]);

  const fetchForms = async () => {
    try {
      const response = await axios.get('/api/hearing-forms');
      setForms(response.data.data);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
        ...filters,
      };

      // 空の値を除外
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await axios.get('/api/form-submissions', { params });
      setSubmissions(response.data.data);
      setTotalCount(response.data.total);
    } catch (error) {
      console.error('Failed to fetch form submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({
      ...filters,
      [field]: value,
    });
    setPage(0);
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

  if (loading && submissions.length === 0) {
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
            フォーム回答
          </Typography>
        </Box>

        {/* フィルター */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>フォーム</InputLabel>
                  <Select
                    value={filters.hearing_form_id}
                    label="フォーム"
                    onChange={(e) => handleFilterChange('hearing_form_id', e.target.value)}
                  >
                    <MenuItem value="">すべて</MenuItem>
                    {forms.map((form) => (
                      <MenuItem key={form.id} value={form.id.toString()}>
                        {form.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>ステータス</InputLabel>
                  <Select
                    value={filters.status}
                    label="ステータス"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="pending">未読</MenuItem>
                    <MenuItem value="read">既読</MenuItem>
                    <MenuItem value="replied">返信済み</MenuItem>
                    <MenuItem value="archived">アーカイブ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="検索"
                  placeholder="ユーザー名、回答内容"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* テーブル */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ユーザー</TableCell>
                  <TableCell>フォーム</TableCell>
                  <TableCell>流入経路</TableCell>
                  <TableCell>送信日時</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        回答がありません
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission) => (
                    <TableRow
                      key={submission.id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => navigate(`/form-submissions/${submission.id}`)}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            src={submission.lineUser?.picture_url}
                            sx={{ width: 32, height: 32 }}
                          >
                            {submission.lineUser?.display_name?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {submission.lineUser?.display_name || '不明'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {submission.hearingForm?.name || '不明'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {submission.inflowSource?.name && (
                          <Chip
                            label={submission.inflowSource.name}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(submission.submitted_at).toLocaleString('ja-JP')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(submission.status)}
                          color={getStatusColor(submission.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/form-submissions/${submission.id}`);
                          }}
                        >
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 15, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="表示件数:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}件`}
          />
        </Paper>
      </Box>
    </TenantLayout>
  );
};

export default FormSubmissions;

