import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Preview as PreviewIcon,
  Category as CategoryIcon,
  FilterList as FilterListIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  template_type: 'text' | 'image' | 'flex';
  version: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  flow_steps?: number;
  variables?: number;
}

interface TemplateCategory {
  id: string;
  name: string;
  count: number;
}

const TemplateManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // モックデータ
  useEffect(() => {
    const mockTemplates: Template[] = [
      {
        id: 1,
        name: 'サービス案内フロー',
        description: '新規ユーザー向けのサービス案内と予約誘導フロー',
        category: '案内',
        template_type: 'flex',
        version: 3,
        is_active: true,
        usage_count: 1250,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T15:30:00Z',
        flow_steps: 5,
        variables: 3,
      },
      {
        id: 2,
        name: '予約確認メッセージ',
        description: '予約完了時の確認メッセージテンプレート',
        category: '確認',
        template_type: 'text',
        version: 1,
        is_active: true,
        usage_count: 890,
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-10T09:00:00Z',
        flow_steps: 1,
        variables: 2,
      },
      {
        id: 3,
        name: 'キャンペーン案内',
        description: '特別キャンペーンの案内画像テンプレート',
        category: 'キャンペーン',
        template_type: 'image',
        version: 2,
        is_active: true,
        usage_count: 450,
        created_at: '2024-01-05T14:00:00Z',
        updated_at: '2024-01-18T11:20:00Z',
        flow_steps: 2,
        variables: 1,
      },
      {
        id: 4,
        name: 'リマインド通知',
        description: '予約前日のリマインド通知フロー',
        category: 'リマインド',
        template_type: 'flex',
        version: 1,
        is_active: false,
        usage_count: 320,
        created_at: '2024-01-12T16:00:00Z',
        updated_at: '2024-01-12T16:00:00Z',
        flow_steps: 3,
        variables: 2,
      },
    ];

    const mockCategories: TemplateCategory[] = [
      { id: 'all', name: 'すべて', count: 4 },
      { id: '案内', name: '案内', count: 1 },
      { id: '確認', name: '確認', count: 1 },
      { id: 'キャンペーン', name: 'キャンペーン', count: 1 },
      { id: 'リマインド', name: 'リマインド', count: 1 },
    ];

    setTimeout(() => {
      setTemplates(mockTemplates);
      setCategories(mockCategories);
      setLoading(false);
    }, 1000);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, templateId: number) => {
    setAnchorEl({ ...anchorEl, [templateId]: event.currentTarget });
  };

  const handleMenuClose = (templateId: number) => {
    setAnchorEl({ ...anchorEl, [templateId]: null });
  };

  const handleCreate = () => {
    navigate('/templates/create');
  };

  const handleEdit = (id: number) => {
    navigate(`/templates/${id}/edit`);
    handleMenuClose(id);
  };

  const handleDuplicate = (id: number) => {
    console.log('Duplicate template:', id);
    setSnackbar({
      open: true,
      message: 'テンプレートを複製しました',
      severity: 'success',
    });
    handleMenuClose(id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このテンプレートを削除してもよろしいですか？')) {
      return;
    }

    try {
      setDeleting(id);
      // モック削除処理
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTemplates(templates.filter(t => t.id !== id));
      setSnackbar({
        open: true,
        message: 'テンプレートを削除しました',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      setSnackbar({
        open: true,
        message: 'テンプレートの削除に失敗しました',
        severity: 'error',
      });
    } finally {
      setDeleting(null);
    }
    handleMenuClose(id);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  const handleToggleActive = (id: number) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, is_active: !t.is_active } : t
    ));
    setSnackbar({
      open: true,
      message: 'テンプレートのステータスを更新しました',
      severity: 'success',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flex':
        return <SettingsIcon color="primary" />;
      case 'text':
        return <Typography color="primary">T</Typography>;
      case 'image':
        return <CategoryIcon color="primary" />;
      default:
        return <SettingsIcon color="primary" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'flex':
        return 'Flex';
      case 'text':
        return 'テキスト';
      case 'image':
        return '画像';
      default:
        return type;
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    const matchesType = filterType === 'all' || template.template_type === filterType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

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
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            テンプレート管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            size="large"
          >
            新規テンプレート作成
          </Button>
        </Box>

        {/* 説明 */}
        <Alert severity="info" sx={{ mb: 3 }}>
          メッセージのテンプレートを作成・管理し、再利用可能なメッセージフローを構築できます。
          テキスト、画像、Flexメッセージのテンプレートに対応しています。
        </Alert>

        {/* フィルター */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="テンプレート名で検索..."
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
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>カテゴリ</InputLabel>
                  <Select
                    value={filterCategory}
                    label="カテゴリ"
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name} ({category.count})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>タイプ</InputLabel>
                  <Select
                    value={filterType}
                    label="タイプ"
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem value="all">すべて</MenuItem>
                    <MenuItem value="text">テキスト</MenuItem>
                    <MenuItem value="image">画像</MenuItem>
                    <MenuItem value="flex">Flex</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  fullWidth
                  onClick={() => {
                    setSearchQuery('');
                    setFilterCategory('all');
                    setFilterType('all');
                  }}
                >
                  リセット
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* テンプレート一覧 */}
        {filteredTemplates.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            {searchQuery || filterCategory !== 'all' || filterType !== 'all'
              ? '条件に一致するテンプレートが見つかりません'
              : 'テンプレートがまだありません。新規作成してください。'}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} lg={6} key={template.id}>
                <Card
                  sx={{
                    height: '100%',
                    border: template.is_active ? '2px solid' : '1px solid',
                    borderColor: template.is_active ? 'primary.main' : 'divider',
                    transition: 'all 0.3s',
                    opacity: deleting === template.id ? 0.5 : 1,
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {getTypeIcon(template.template_type)}
                          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                            {template.name}
                          </Typography>
                          <Chip
                            label={template.is_active ? 'アクティブ' : '非アクティブ'}
                            color={template.is_active ? 'primary' : 'default'}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {template.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip label={template.category} size="small" variant="outlined" />
                          <Chip label={getTypeLabel(template.template_type)} size="small" variant="outlined" />
                          <Chip label={`v${template.version}`} size="small" variant="outlined" />
                        </Box>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, template.id)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl[template.id]}
                          open={Boolean(anchorEl[template.id])}
                          onClose={() => handleMenuClose(template.id)}
                        >
                          <MenuItem onClick={() => handleEdit(template.id)}>
                            <EditIcon fontSize="small" sx={{ mr: 1 }} />
                            編集
                          </MenuItem>
                          <MenuItem onClick={() => handleDuplicate(template.id)}>
                            <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
                            複製
                          </MenuItem>
                          <MenuItem onClick={() => handlePreview(template)}>
                            <PreviewIcon fontSize="small" sx={{ mr: 1 }} />
                            プレビュー
                          </MenuItem>
                          <Divider />
                          <MenuItem 
                            onClick={() => handleToggleActive(template.id)}
                            sx={{ color: template.is_active ? 'error.main' : 'success.main' }}
                          >
                            {template.is_active ? (
                              <>
                                <StopIcon fontSize="small" sx={{ mr: 1 }} />
                                無効化
                              </>
                            ) : (
                              <>
                                <PlayArrowIcon fontSize="small" sx={{ mr: 1 }} />
                                有効化
                              </>
                            )}
                          </MenuItem>
                          <MenuItem 
                            onClick={() => handleDelete(template.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                            削除
                          </MenuItem>
                        </Menu>
                      </Box>
                    </Box>

                    {/* 統計情報 */}
                    <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="primary">
                              {template.usage_count.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              使用回数
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="primary">
                              {template.flow_steps || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              フローステップ
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="primary">
                              {template.variables || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              変数
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* アクションボタン */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PreviewIcon />}
                        onClick={() => handlePreview(template)}
                        fullWidth
                      >
                        プレビュー
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(template.id)}
                        fullWidth
                      >
                        編集
                      </Button>
                    </Box>

                    {/* 更新日時 */}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      最終更新: {new Date(template.updated_at).toLocaleDateString('ja-JP')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* プレビューダイアログ */}
        <Dialog 
          open={Boolean(previewTemplate)} 
          onClose={() => setPreviewTemplate(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            テンプレートプレビュー: {previewTemplate?.name}
          </DialogTitle>
          <DialogContent>
            {previewTemplate && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {previewTemplate.description}
                </Typography>
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    プレビュー機能は実装中です...
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewTemplate(null)}>
              閉じる
            </Button>
          </DialogActions>
        </Dialog>

        {/* スナックバー */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Box>
    </TenantLayout>
  );
};

export default TemplateManagement;
