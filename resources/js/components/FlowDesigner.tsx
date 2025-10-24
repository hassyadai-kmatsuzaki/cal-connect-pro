import React, { useState, useCallback, useRef } from 'react';
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
  IconButton,
  Divider,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  AccountTree as AccountTreeIcon,
  LocalOffer as LocalOfferIcon,
  ArrowForward as ArrowForwardIcon,
  CallSplit as CallSplitIcon,
} from '@mui/icons-material';

interface FlowStep {
  id: string;
  name: string;
  type: 'message' | 'condition' | 'action';
  messageId?: string;
  condition?: FlowCondition;
  action?: FlowAction;
  nextSteps: FlowNextStep[];
  position: { x: number; y: number };
}

interface FlowCondition {
  type: 'user_tag' | 'user_attribute' | 'time' | 'date' | 'custom';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: string;
  field?: string;
}

interface FlowAction {
  type: 'add_tag' | 'remove_tag' | 'send_message' | 'wait' | 'jump';
  value: string;
  targetStepId?: string;
}

interface FlowNextStep {
  condition?: string;
  stepId: string;
  label: string;
}

interface FlowDesignerProps {
  steps: FlowStep[];
  onStepsChange: (steps: FlowStep[]) => void;
  onPreview: (steps: FlowStep[]) => void;
}

const FlowDesigner: React.FC<FlowDesignerProps> = ({
  steps,
  onStepsChange,
  onPreview,
}) => {
  const [selectedStep, setSelectedStep] = useState<FlowStep | null>(null);
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null);
  const [openStepDialog, setOpenStepDialog] = useState(false);
  const [stepType, setStepType] = useState<string>('message');
  const [draggedStep, setDraggedStep] = useState<FlowStep | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const defaultSteps: FlowStep[] = [
    {
      id: 'start',
      name: '開始',
      type: 'message',
      nextSteps: [{ stepId: 'step1', label: '次へ' }],
      position: { x: 100, y: 50 },
    },
    {
      id: 'step1',
      name: 'ウェルカムメッセージ',
      type: 'message',
      messageId: 'welcome',
      nextSteps: [
        { stepId: 'condition1', label: '条件分岐', condition: 'user_tag=new_user' },
        { stepId: 'step2', label: '既存ユーザー' },
      ],
      position: { x: 100, y: 200 },
    },
    {
      id: 'condition1',
      name: '新規ユーザー判定',
      type: 'condition',
      condition: {
        type: 'user_tag',
        operator: 'equals',
        value: 'new_user',
      },
      nextSteps: [
        { stepId: 'step3', label: '新規ユーザー' },
        { stepId: 'step2', label: '既存ユーザー' },
      ],
      position: { x: 100, y: 350 },
    },
    {
      id: 'step2',
      name: '既存ユーザー向けメッセージ',
      type: 'message',
      messageId: 'existing_user',
      nextSteps: [],
      position: { x: 300, y: 350 },
    },
    {
      id: 'step3',
      name: '新規ユーザー向けメッセージ',
      type: 'message',
      messageId: 'new_user',
      nextSteps: [],
      position: { x: 100, y: 500 },
    },
  ];

  const handleAddStep = (type: string) => {
    const newStep: FlowStep = {
      id: `step-${Date.now()}`,
      name: `新しい${type === 'message' ? 'メッセージ' : type === 'condition' ? '条件' : 'アクション'}`,
      type: type as any,
      nextSteps: [],
      position: { x: 200, y: 200 },
    };

    onStepsChange([...steps, newStep]);
  };

  const handleEditStep = (step: FlowStep) => {
    setEditingStep(step);
    setOpenStepDialog(true);
  };

  const handleDeleteStep = (stepId: string) => {
    const updatedSteps = steps.filter(step => step.id !== stepId);
    // 他のステップからこのステップへの参照も削除
    updatedSteps.forEach(step => {
      step.nextSteps = step.nextSteps.filter(nextStep => nextStep.stepId !== stepId);
    });
    onStepsChange(updatedSteps);
  };

  const handleAddNextStep = (stepId: string) => {
    const updatedSteps = steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          nextSteps: [
            ...step.nextSteps,
            { stepId: '', label: '新しい分岐' },
          ],
        };
      }
      return step;
    });
    onStepsChange(updatedSteps);
  };

  const handleNextStepChange = (stepId: string, index: number, field: string, value: string) => {
    const updatedSteps = steps.map(step => {
      if (step.id === stepId) {
        const updatedNextSteps = [...step.nextSteps];
        updatedNextSteps[index] = {
          ...updatedNextSteps[index],
          [field]: value,
        };
        return {
          ...step,
          nextSteps: updatedNextSteps,
        };
      }
      return step;
    });
    onStepsChange(updatedSteps);
  };

  const handleStepPropertyChange = (field: string, value: any) => {
    if (!editingStep) return;

    const updatedStep = {
      ...editingStep,
      [field]: value,
    };

    const updatedSteps = steps.map(step =>
      step.id === editingStep.id ? updatedStep : step
    );

    onStepsChange(updatedSteps);
    setEditingStep(updatedStep);
  };

  const handleConditionChange = (field: string, value: any) => {
    if (!editingStep) return;

    const updatedCondition = {
      ...editingStep.condition,
      [field]: value,
    };

    handleStepPropertyChange('condition', updatedCondition);
  };

  const handleActionChange = (field: string, value: any) => {
    if (!editingStep) return;

    const updatedAction = {
      ...editingStep.action,
      [field]: value,
    };

    handleStepPropertyChange('action', updatedAction);
  };

  const renderStepEditor = () => {
    if (!editingStep) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="ステップ名"
          value={editingStep.name}
          onChange={(e) => handleStepPropertyChange('name', e.target.value)}
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel>タイプ</InputLabel>
          <Select
            value={editingStep.type}
            label="タイプ"
            onChange={(e) => handleStepPropertyChange('type', e.target.value)}
          >
            <MenuItem value="message">メッセージ</MenuItem>
            <MenuItem value="condition">条件分岐</MenuItem>
            <MenuItem value="action">アクション</MenuItem>
          </Select>
        </FormControl>

        {editingStep.type === 'message' && (
          <FormControl fullWidth>
            <InputLabel>メッセージ</InputLabel>
            <Select
              value={editingStep.messageId || ''}
              label="メッセージ"
              onChange={(e) => handleStepPropertyChange('messageId', e.target.value)}
            >
              <MenuItem value="welcome">ウェルカムメッセージ</MenuItem>
              <MenuItem value="service_info">サービス案内</MenuItem>
              <MenuItem value="reservation_guide">予約案内</MenuItem>
              <MenuItem value="thank_you">お礼メッセージ</MenuItem>
            </Select>
          </FormControl>
        )}

        {editingStep.type === 'condition' && (
          <>
            <FormControl fullWidth>
              <InputLabel>条件タイプ</InputLabel>
              <Select
                value={editingStep.condition?.type || 'user_tag'}
                label="条件タイプ"
                onChange={(e) => handleConditionChange('type', e.target.value)}
              >
                <MenuItem value="user_tag">ユーザータグ</MenuItem>
                <MenuItem value="user_attribute">ユーザー属性</MenuItem>
                <MenuItem value="time">時間</MenuItem>
                <MenuItem value="date">日付</MenuItem>
                <MenuItem value="custom">カスタム</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>演算子</InputLabel>
              <Select
                value={editingStep.condition?.operator || 'equals'}
                label="演算子"
                onChange={(e) => handleConditionChange('operator', e.target.value)}
              >
                <MenuItem value="equals">等しい</MenuItem>
                <MenuItem value="not_equals">等しくない</MenuItem>
                <MenuItem value="contains">含む</MenuItem>
                <MenuItem value="not_contains">含まない</MenuItem>
                <MenuItem value="greater_than">より大きい</MenuItem>
                <MenuItem value="less_than">より小さい</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="値"
              value={editingStep.condition?.value || ''}
              onChange={(e) => handleConditionChange('value', e.target.value)}
              fullWidth
            />
          </>
        )}

        {editingStep.type === 'action' && (
          <>
            <FormControl fullWidth>
              <InputLabel>アクションタイプ</InputLabel>
              <Select
                value={editingStep.action?.type || 'add_tag'}
                label="アクションタイプ"
                onChange={(e) => handleActionChange('type', e.target.value)}
              >
                <MenuItem value="add_tag">タグ追加</MenuItem>
                <MenuItem value="remove_tag">タグ削除</MenuItem>
                <MenuItem value="send_message">メッセージ送信</MenuItem>
                <MenuItem value="wait">待機</MenuItem>
                <MenuItem value="jump">ジャンプ</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="値"
              value={editingStep.action?.value || ''}
              onChange={(e) => handleActionChange('value', e.target.value)}
              fullWidth
            />
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6">次のステップ</Typography>
        {editingStep.nextSteps.map((nextStep, index) => (
          <Paper key={index} sx={{ p: 2, mb: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={4}>
                <TextField
                  label="ラベル"
                  value={nextStep.label}
                  onChange={(e) => handleNextStepChange(editingStep.id, index, 'label', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>次のステップ</InputLabel>
                  <Select
                    value={nextStep.stepId}
                    label="次のステップ"
                    onChange={(e) => handleNextStepChange(editingStep.id, index, 'stepId', e.target.value)}
                  >
                    {steps.filter(step => step.id !== editingStep.id).map(step => (
                      <MenuItem key={step.id} value={step.id}>
                        {step.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="条件"
                  value={nextStep.condition || ''}
                  onChange={(e) => handleNextStepChange(editingStep.id, index, 'condition', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    const updatedSteps = steps.map(step => {
                      if (step.id === editingStep.id) {
                        return {
                          ...step,
                          nextSteps: step.nextSteps.filter((_, i) => i !== index),
                        };
                      }
                      return step;
                    });
                    onStepsChange(updatedSteps);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => handleAddNextStep(editingStep.id)}
          fullWidth
        >
          次のステップを追加
        </Button>
      </Box>
    );
  };

  const renderFlowCanvas = () => {
    return (
      <Box
        ref={canvasRef}
        sx={{
          width: '100%',
          height: '600px',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          position: 'relative',
          overflow: 'auto',
          bgcolor: '#fafafa',
        }}
      >
        {steps.map((step) => (
          <Card
            key={step.id}
            sx={{
              position: 'absolute',
              left: step.position.x,
              top: step.position.y,
              width: 200,
              cursor: 'move',
              border: selectedStep?.id === step.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
              '&:hover': {
                boxShadow: 4,
              },
            }}
            onClick={() => setSelectedStep(step)}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Chip
                  label={step.type === 'message' ? 'メッセージ' : step.type === 'condition' ? '条件' : 'アクション'}
                  size="small"
                  color={step.type === 'message' ? 'primary' : step.type === 'condition' ? 'secondary' : 'success'}
                />
                <Box>
                  <IconButton size="small" onClick={() => handleEditStep(step)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteStep(step.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {step.name}
              </Typography>
              {step.type === 'message' && step.messageId && (
                <Typography variant="caption" color="text.secondary">
                  {step.messageId}
                </Typography>
              )}
              {step.type === 'condition' && step.condition && (
                <Typography variant="caption" color="text.secondary">
                  {step.condition.type}: {step.condition.value}
                </Typography>
              )}
              {step.type === 'action' && step.action && (
                <Typography variant="caption" color="text.secondary">
                  {step.action.type}: {step.action.value}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}

        {/* 接続線の描画（簡易版） */}
        {steps.map((step) =>
          step.nextSteps.map((nextStep, index) => {
            const targetStep = steps.find(s => s.id === nextStep.stepId);
            if (!targetStep) return null;

            return (
              <Box
                key={`${step.id}-${nextStep.stepId}-${index}`}
                sx={{
                  position: 'absolute',
                  left: step.position.x + 100,
                  top: step.position.y + 100,
                  width: Math.abs(targetStep.position.x - step.position.x),
                  height: Math.abs(targetStep.position.y - step.position.y),
                  border: '1px solid #1976d2',
                  borderLeft: 'none',
                  borderTop: 'none',
                  pointerEvents: 'none',
                }}
              />
            );
          })
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">フロー設計</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={() => onPreview(steps)}
            sx={{ mr: 1 }}
          >
            プレビュー
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleAddStep('message')}
            sx={{ mr: 1 }}
          >
            メッセージ追加
          </Button>
          <Button
            variant="outlined"
            startIcon={<CallSplitIcon />}
            onClick={() => handleAddStep('condition')}
            sx={{ mr: 1 }}
          >
            条件追加
          </Button>
          <Button
            variant="outlined"
            startIcon={<LocalOfferIcon />}
            onClick={() => handleAddStep('action')}
          >
            アクション追加
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {renderFlowCanvas()}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                ステップ一覧
              </Typography>
              <List>
                {steps.map((step) => (
                  <ListItem key={step.id} divider>
                    <ListItemText
                      primary={step.name}
                      secondary={
                        <Box>
                          <Chip
                            label={step.type === 'message' ? 'メッセージ' : step.type === 'condition' ? '条件' : 'アクション'}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            次のステップ: {step.nextSteps.length}個
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => handleEditStep(step)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteStep(step.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ステップ編集ダイアログ */}
      <Dialog open={openStepDialog} onClose={() => setOpenStepDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          ステップ編集: {editingStep?.name}
        </DialogTitle>
        <DialogContent>
          {renderStepEditor()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStepDialog(false)}>
            キャンセル
          </Button>
          <Button onClick={() => setOpenStepDialog(false)} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlowDesigner;
