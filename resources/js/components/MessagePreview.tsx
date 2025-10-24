import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Stack,
  Alert,
  Paper,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Close as CloseIcon,
  Smartphone as SmartphoneIcon,
  Computer as ComputerIcon,
  Tablet as TabletIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Message as MessageIcon,
  AccountTree as AccountTreeIcon,
  LocalOffer as LocalOfferIcon,
} from '@mui/icons-material';

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

interface PreviewProps {
  type: 'flex' | 'flow';
  data: FlexMessage | FlowStep[];
  onClose: () => void;
}

const MessagePreview: React.FC<PreviewProps> = ({ type, data, onClose }) => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const renderFlexMessage = (message: FlexMessage) => {
    return (
      <Box
        sx={{
          maxWidth: deviceType === 'mobile' ? 300 : deviceType === 'tablet' ? 400 : 500,
          mx: 'auto',
          bgcolor: 'white',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 2,
        }}
      >
        {/* ヘッダー */}
        {message.header && (
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
            {message.header.properties?.contents?.map((content: any, index: number) => (
              <Box key={index} sx={{ mb: 1 }}>
                {content.type === 'text' && (
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: content.properties?.weight === 'bold' ? 'bold' : 'normal',
                      fontSize: getFontSize(content.properties?.size),
                      color: content.properties?.color || '#000000',
                    }}
                  >
                    {content.properties?.text}
                  </Typography>
                )}
                {content.type === 'image' && (
                  <Box
                    sx={{
                      width: '100%',
                      height: 150,
                      bgcolor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      画像: {content.properties?.url}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* ヒーロー */}
        {message.hero && (
          <Box sx={{ p: 2 }}>
            {message.hero.properties?.contents?.map((content: any, index: number) => (
              <Box key={index} sx={{ mb: 1 }}>
                {content.type === 'image' && (
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      bgcolor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      ヒーロー画像: {content.properties?.url}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* ボディ */}
        {message.body && (
          <Box sx={{ p: 2 }}>
            {message.body.properties?.contents?.map((content: any, index: number) => (
              <Box key={index} sx={{ mb: 1 }}>
                {content.type === 'text' && (
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: content.properties?.weight === 'bold' ? 'bold' : 'normal',
                      fontSize: getFontSize(content.properties?.size),
                      color: content.properties?.color || '#000000',
                    }}
                  >
                    {content.properties?.text}
                  </Typography>
                )}
                {content.type === 'image' && (
                  <Box
                    sx={{
                      width: '100%',
                      height: 150,
                      bgcolor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      画像: {content.properties?.url}
                    </Typography>
                  </Box>
                )}
                {content.type === 'separator' && (
                  <Divider sx={{ my: 1 }} />
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* フッター */}
        {message.footer && (
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
            {message.footer.properties?.contents?.map((content: any, index: number) => (
              <Box key={index} sx={{ mb: 1 }}>
                {content.type === 'button' && (
                  <Button
                    variant={content.properties?.style === 'primary' ? 'contained' : 'outlined'}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    {content.properties?.action?.label}
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const renderFlowPreview = (steps: FlowStep[]) => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return null;

    return (
      <Box sx={{ maxWidth: 400, mx: 'auto' }}>
        {/* 現在のステップ */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip
                label={currentStep.type === 'message' ? 'メッセージ' : currentStep.type === 'condition' ? '条件' : 'アクション'}
                size="small"
                color={currentStep.type === 'message' ? 'primary' : currentStep.type === 'condition' ? 'secondary' : 'success'}
                sx={{ mr: 1 }}
              />
              <Typography variant="h6">{currentStep.name}</Typography>
            </Box>

            {currentStep.type === 'message' && (
              <Alert severity="info">
                メッセージ: {currentStep.messageId || '未設定'}
              </Alert>
            )}

            {currentStep.type === 'condition' && currentStep.condition && (
              <Alert severity="warning">
                条件: {currentStep.condition.type} {currentStep.condition.operator} {currentStep.condition.value}
              </Alert>
            )}

            {currentStep.type === 'action' && currentStep.action && (
              <Alert severity="success">
                アクション: {currentStep.action.type} - {currentStep.action.value}
              </Alert>
            )}

            {/* 次のステップ */}
            {currentStep.nextSteps.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  次のステップ:
                </Typography>
                <Stack spacing={1}>
                  {currentStep.nextSteps.map((nextStep, index) => (
                    <Paper key={index} sx={{ p: 1, bgcolor: '#f5f5f5' }}>
                      <Typography variant="body2">
                        {nextStep.label}
                        {nextStep.condition && (
                          <Chip label={nextStep.condition} size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* フロー全体の表示 */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              フロー全体
            </Typography>
            <List>
              {steps.map((step, index) => (
                <ListItem key={step.id} sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    {index === currentStepIndex ? (
                      <PlayArrowIcon color="primary" />
                    ) : (
                      <MessageIcon color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={step.name}
                    secondary={
                      <Box>
                        <Chip
                          label={step.type === 'message' ? 'メッセージ' : step.type === 'condition' ? '条件' : 'アクション'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {step.nextSteps.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            次のステップ: {step.nextSteps.length}個
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const getFontSize = (size: string) => {
    const sizeMap: { [key: string]: string } = {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    };
    return sizeMap[size] || '1rem';
  };

  const handlePlayPause = () => {
    if (type === 'flow') {
      setIsPlaying(!isPlaying);
      if (!isPlaying) {
        const interval = setInterval(() => {
          setCurrentStepIndex(prev => {
            const steps = data as FlowStep[];
            if (prev >= steps.length - 1) {
              clearInterval(interval);
              setIsPlaying(false);
              return 0;
            }
            return prev + 1;
          });
        }, 2000);
      }
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {type === 'flex' ? 'Flexメッセージプレビュー' : 'フロープレビュー'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* デバイス選択 */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton
                size="small"
                color={deviceType === 'mobile' ? 'primary' : 'default'}
                onClick={() => setDeviceType('mobile')}
              >
                <SmartphoneIcon />
              </IconButton>
              <IconButton
                size="small"
                color={deviceType === 'tablet' ? 'primary' : 'default'}
                onClick={() => setDeviceType('tablet')}
              >
                <TabletIcon />
              </IconButton>
              <IconButton
                size="small"
                color={deviceType === 'desktop' ? 'primary' : 'default'}
                onClick={() => setDeviceType('desktop')}
              >
                <ComputerIcon />
              </IconButton>
            </Box>

            {/* フロー制御 */}
            {type === 'flow' && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" onClick={handlePlayPause}>
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton size="small" onClick={handleReset}>
                  <StopIcon />
                </IconButton>
                <IconButton size="small" onClick={() => setCurrentStepIndex(0)}>
                  <RefreshIcon />
                </IconButton>
              </Box>
            )}

            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              {type === 'flex' ? renderFlexMessage(data as FlexMessage) : renderFlowPreview(data as FlowStep[])}
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  プレビュー情報
                </Typography>

                {type === 'flex' && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      メッセージタイプ: {(data as FlexMessage).type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      デバイス: {deviceType === 'mobile' ? 'モバイル' : deviceType === 'tablet' ? 'タブレット' : 'デスクトップ'}
                    </Typography>
                    <Alert severity="info">
                      実際のLINEアプリでの表示をシミュレートしています。
                    </Alert>
                  </Box>
                )}

                {type === 'flow' && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      ステップ数: {(data as FlowStep[]).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      現在のステップ: {currentStepIndex + 1} / {(data as FlowStep[]).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      ステータス: {isPlaying ? '再生中' : '停止中'}
                    </Typography>
                    <Alert severity="info">
                      フローの動作をシミュレートしています。各ステップは2秒間表示されます。
                    </Alert>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessagePreview;
