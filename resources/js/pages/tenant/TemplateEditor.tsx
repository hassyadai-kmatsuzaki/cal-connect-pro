import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Stack,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  Settings as SettingsIcon,
  TextFields as TextFieldsIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import TenantLayout from '../../layouts/TenantLayout';
import FlexMessageEditor from '../../components/FlexMessageEditor';
import FlowDesigner from '../../components/FlowDesigner';
import MessagePreview from '../../components/MessagePreview';

interface TemplateStep {
  id: string;
  order: number;
  type: 'text' | 'image' | 'flex';
  content: any;
  conditions?: any;
  next_steps?: any;
  tag_operations?: any;
}

interface FlexMessage {
  type: 'bubble' | 'carousel';
  header?: any;
  hero?: any;
  body?: any;
  footer?: any;
  styles?: any;
}

interface FlowStep {
  id: string;
  name: string;
  type: 'message' | 'condition' | 'action';
  messageId?: string;
  condition?: any;
  action?: any;
  nextSteps: any[];
}

interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'list';
  default_value: string;
  description: string;
  is_required: boolean;
}

interface Template {
  id?: number;
  name: string;
  description: string;
  category: string;
  template_type: 'text' | 'image' | 'flex';
  is_active: boolean;
  steps: TemplateStep[];
  variables: TemplateVariable[];
}

const TemplateEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  
  const [activeStep, setActiveStep] = useState(0);
  const [template, setTemplate] = useState<Template>({
    name: '',
    description: '',
    category: '',
    template_type: 'text',
    is_active: true,
    steps: [],
    variables: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openVariableDialog, setOpenVariableDialog] = useState(false);
  const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // 新しい状態変数を追加
  const [flexMessage, setFlexMessage] = useState<FlexMessage>({
    type: 'bubble',
    header: undefined,
    hero: undefined,
    body: undefined,
    footer: undefined,
  });
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [previewData, setPreviewData] = useState<FlexMessage | FlowStep[] | null>(null);
  const [previewType, setPreviewType] = useState<'flex' | 'flow'>('flex');

  const categories = [
    '案内',
    '確認',
    'キャンペーン',
    'リマインド',
    'フォローアップ',
    'その他',
  ];

  const steps = [
    {
      label: '基本情報',
      description: 'テンプレートの基本情報を設定',
    },
    {
      label: 'メッセージ作成',
      description: 'メッセージの内容を作成',
    },
    {
      label: 'フロー設定',
      description: '条件分岐とフローを設定',
    },
    {
      label: '変数設定',
      description: '動的コンテンツの変数を設定',
    },
    {
      label: 'プレビュー・保存',
      description: '最終確認と保存',
    },
  ];

  useEffect(() => {
    if (isEdit && id) {
      // モックデータで編集モードをシミュレート
      setTemplate({
        id: parseInt(id),
        name: 'サービス案内フロー',
        description: '新規ユーザー向けのサービス案内と予約誘導フロー',
        category: '案内',
        template_type: 'flex',
        is_active: true,
        steps: [
          {
            id: '1',
            order: 1,
            type: 'flex',
            content: {
              type: 'bubble',
              header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'サービス案内',
                    weight: 'bold',
                    size: 'xl',
                  },
                ],
              },
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '当社のサービスをご案内いたします。',
                    wrap: true,
                  },
                ],
              },
              footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'button',
                    action: {
                      type: 'postback',
                      label: '予約する',
                      data: 'action=reserve',
                    },
                    style: 'primary',
                  },
                  {
                    type: 'button',
                    action: {
                      type: 'postback',
                      label: '詳細を見る',
                      data: 'action=details',
                    },
                    style: 'secondary',
                  },
                ],
              },
            },
            conditions: {},
            next_steps: {
              'action=reserve': 'step_2',
              'action=details': 'step_3',
            },
            tag_operations: {
              'action=reserve': {
                add_tags: ['予約希望'],
                remove_tags: ['キャンセル希望'],
              },
              'action=details': {
                add_tags: ['詳細希望'],
                remove_tags: ['即予約希望'],
              },
            },
          },
        ],
        variables: [
          {
            id: '1',
            name: 'customer_name',
            type: 'text',
            default_value: 'お客様',
            description: '顧客の名前',
            is_required: true,
          },
          {
            id: '2',
            name: 'service_name',
            type: 'text',
            default_value: '当社サービス',
            description: 'サービス名',
            is_required: true,
          },
        ],
      });
    }
  }, [isEdit, id]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // モック保存処理
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSnackbar({
        open: true,
        message: isEdit ? 'テンプレートを更新しました' : 'テンプレートを作成しました',
        severity: 'success',
      });
      setTimeout(() => {
        navigate('/templates');
      }, 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: '保存に失敗しました',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = () => {
    const newStep: TemplateStep = {
      id: Date.now().toString(),
      order: template.steps.length + 1,
      type: 'text',
      content: { text: '' },
      conditions: {},
      next_steps: {},
      tag_operations: {},
    };
    setTemplate({
      ...template,
      steps: [...template.steps, newStep],
    });
  };

  const handleDeleteStep = (stepId: string) => {
    setTemplate({
      ...template,
      steps: template.steps.filter(step => step.id !== stepId),
    });
  };

  const handleAddVariable = () => {
    setEditingVariable({
      id: '',
      name: '',
      type: 'text',
      default_value: '',
      description: '',
      is_required: false,
    });
    setOpenVariableDialog(true);
  };

  const handleEditVariable = (variable: TemplateVariable) => {
    setEditingVariable(variable);
    setOpenVariableDialog(true);
  };

  const handleSaveVariable = () => {
    if (!editingVariable) return;

    if (editingVariable.id) {
      // 編集
      setTemplate({
        ...template,
        variables: template.variables.map(v => 
          v.id === editingVariable.id ? editingVariable : v
        ),
      });
    } else {
      // 新規追加
      const newVariable = {
        ...editingVariable,
        id: Date.now().toString(),
      };
      setTemplate({
        ...template,
        variables: [...template.variables, newVariable],
      });
    }

    setOpenVariableDialog(false);
    setEditingVariable(null);
  };

  const handleDeleteVariable = (variableId: string) => {
    setTemplate({
      ...template,
      variables: template.variables.filter(v => v.id !== variableId),
    });
  };

  // Flexメッセージエディタ用のハンドラー
  const handleFlexMessageChange = (message: FlexMessage) => {
    setFlexMessage(message);
  };

  const handleFlexPreview = (message: FlexMessage) => {
    setPreviewData(message);
    setPreviewType('flex');
  };

  // フロー設計用のハンドラー
  const handleFlowStepsChange = (steps: FlowStep[]) => {
    setFlowSteps(steps);
  };

  const handleFlowPreview = (steps: FlowStep[]) => {
    setPreviewData(steps);
    setPreviewType('flow');
  };

  const handleClosePreview = () => {
    setPreviewData(null);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="テンプレート名"
              fullWidth
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              required
            />
            <TextField
              label="説明"
              fullWidth
              multiline
              rows={3}
              value={template.description}
              onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={template.category}
                label="カテゴリ"
                onChange={(e) => setTemplate({ ...template, category: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>テンプレートタイプ</InputLabel>
              <Select
                value={template.template_type}
                label="テンプレートタイプ"
                onChange={(e) => setTemplate({ ...template, template_type: e.target.value as any })}
              >
                <MenuItem value="text">テキスト</MenuItem>
                <MenuItem value="image">画像</MenuItem>
                <MenuItem value="flex">Flex</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={template.is_active}
                  onChange={(e) => setTemplate({ ...template, is_active: e.target.checked })}
                />
              }
              label="アクティブ"
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">メッセージステップ</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddStep}
              >
                ステップ追加
              </Button>
            </Box>
            
            {template.steps.length === 0 ? (
              <Alert severity="info">
                メッセージステップがありません。「ステップ追加」ボタンから追加してください。
              </Alert>
            ) : (
              <Stack spacing={2}>
                {template.steps.map((step, index) => (
                  <Card key={step.id}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          ステップ {step.order}: {step.type === 'text' ? 'テキスト' : step.type === 'image' ? '画像' : 'Flex'}
                        </Typography>
                        <Box>
                          <IconButton size="small" onClick={() => handleDeleteStep(step.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      {step.type === 'text' && (
                        <TextField
                          label="テキスト内容"
                          fullWidth
                          multiline
                          rows={4}
                          value={step.content.text || ''}
                          onChange={(e) => {
                            const updatedSteps = template.steps.map(s => 
                              s.id === step.id ? { ...s, content: { ...s.content, text: e.target.value } } : s
                            );
                            setTemplate({ ...template, steps: updatedSteps });
                          }}
                        />
                      )}
                      
                      {step.type === 'image' && (
                        <Box sx={{ textAlign: 'center', py: 4, border: '2px dashed #ccc', borderRadius: 1 }}>
                          <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            画像アップロード機能は実装中です
                          </Typography>
                        </Box>
                      )}
                      
                      {step.type === 'flex' && (
                        <FlexMessageEditor
                          value={flexMessage}
                          onChange={handleFlexMessageChange}
                          onPreview={handleFlexPreview}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        );

      case 2:
        return (
          <FlowDesigner
            steps={flowSteps}
            onStepsChange={handleFlowStepsChange}
            onPreview={handleFlowPreview}
          />
        );

      case 3:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">変数設定</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddVariable}
              >
                変数追加
              </Button>
            </Box>
            
            {template.variables.length === 0 ? (
              <Alert severity="info">
                変数が設定されていません。「変数追加」ボタンから追加してください。
              </Alert>
            ) : (
              <List>
                {template.variables.map((variable) => (
                  <ListItem key={variable.id} divider>
                    <ListItemText
                      primary={variable.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            タイプ: {variable.type} | デフォルト値: {variable.default_value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {variable.description}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => handleEditVariable(variable)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteVariable(variable.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              プレビュー・保存
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              テンプレートの設定が完了しました。保存してテンプレート一覧に戻ります。
            </Alert>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                プレビュー機能は実装中です...
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <TenantLayout>
      <Box>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/templates')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {isEdit ? 'テンプレート編集' : '新規テンプレート作成'}
          </Typography>
        </Box>

        {/* ステッパー */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep} orientation="horizontal">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* ステップコンテンツ */}
        <Card>
          <CardContent>
            {renderStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', pt: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                戻る
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saving ? '保存中...' : '保存'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  次へ
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* 変数編集ダイアログ */}
        <Dialog open={openVariableDialog} onClose={() => setOpenVariableDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingVariable?.id ? '変数編集' : '変数追加'}
          </DialogTitle>
          <DialogContent>
            {editingVariable && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="変数名"
                  fullWidth
                  value={editingVariable.name}
                  onChange={(e) => setEditingVariable({ ...editingVariable, name: e.target.value })}
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>タイプ</InputLabel>
                  <Select
                    value={editingVariable.type}
                    label="タイプ"
                    onChange={(e) => setEditingVariable({ ...editingVariable, type: e.target.value as any })}
                  >
                    <MenuItem value="text">テキスト</MenuItem>
                    <MenuItem value="number">数値</MenuItem>
                    <MenuItem value="date">日付</MenuItem>
                    <MenuItem value="boolean">真偽値</MenuItem>
                    <MenuItem value="list">リスト</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="デフォルト値"
                  fullWidth
                  value={editingVariable.default_value}
                  onChange={(e) => setEditingVariable({ ...editingVariable, default_value: e.target.value })}
                />
                <TextField
                  label="説明"
                  fullWidth
                  multiline
                  rows={2}
                  value={editingVariable.description}
                  onChange={(e) => setEditingVariable({ ...editingVariable, description: e.target.value })}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingVariable.is_required}
                      onChange={(e) => setEditingVariable({ ...editingVariable, is_required: e.target.checked })}
                    />
                  }
                  label="必須"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenVariableDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveVariable} variant="contained">
              保存
            </Button>
          </DialogActions>
        </Dialog>

        {/* プレビューダイアログ */}
        {previewData && (
          <MessagePreview
            type={previewType}
            data={previewData}
            onClose={handleClosePreview}
          />
        )}

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

export default TemplateEditor;
