import React, { useState, useCallback } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Image as ImageIcon,
  TextFields as TextFieldsIcon,
  SmartButton as SmartButtonIcon,
  ViewModule as ViewModuleIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';

interface FlexComponent {
  id: string;
  type: 'box' | 'text' | 'image' | 'button' | 'separator';
  properties: any;
  children?: FlexComponent[];
}

interface FlexMessage {
  type: 'bubble' | 'carousel';
  header?: FlexComponent;
  hero?: FlexComponent;
  body?: FlexComponent;
  footer?: FlexComponent;
  styles?: any;
}

interface FlexMessageEditorProps {
  value: FlexMessage;
  onChange: (value: FlexMessage) => void;
  onPreview: (value: FlexMessage) => void;
}

const FlexMessageEditor: React.FC<FlexMessageEditorProps> = ({
  value,
  onChange,
  onPreview,
}) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [editingComponent, setEditingComponent] = useState<FlexComponent | null>(null);
  const [openComponentDialog, setOpenComponentDialog] = useState(false);
  const [componentType, setComponentType] = useState<string>('text');

  const defaultFlexMessage: FlexMessage = {
    type: 'bubble',
    header: {
      id: 'header',
      type: 'box',
      properties: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            id: 'header-text',
            type: 'text',
            properties: {
              type: 'text',
              text: 'ヘッダー',
              weight: 'bold',
              size: 'xl',
              color: '#1DB446',
            },
          },
        ],
      },
    },
    body: {
      id: 'body',
      type: 'box',
      properties: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            id: 'body-text',
            type: 'text',
            properties: {
              type: 'text',
              text: 'メッセージ内容を入力してください',
              wrap: true,
              color: '#666666',
            },
          },
        ],
      },
    },
    footer: {
      id: 'footer',
      type: 'box',
      properties: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            id: 'button-1',
            type: 'button',
            properties: {
              type: 'button',
              action: {
                type: 'postback',
                label: '選択肢1',
                data: 'action=option1',
              },
              style: 'primary',
            },
          },
        ],
      },
    },
  };

  const handleAddComponent = (section: 'header' | 'hero' | 'body' | 'footer', type: string) => {
    const newComponent: FlexComponent = {
      id: `component-${Date.now()}`,
      type: type as any,
      properties: getDefaultProperties(type),
    };

    const updatedValue = { ...value };
    if (!updatedValue[section]) {
      updatedValue[section] = {
        id: section,
        type: 'box',
        properties: {
          type: 'box',
          layout: 'vertical',
          contents: [],
        },
      };
    }

    updatedValue[section]!.properties.contents.push(newComponent);
    onChange(updatedValue);
  };

  const getDefaultProperties = (type: string) => {
    switch (type) {
      case 'text':
        return {
          type: 'text',
          text: 'テキスト',
          size: 'md',
          color: '#000000',
        };
      case 'image':
        return {
          type: 'image',
          url: 'https://via.placeholder.com/300x200',
          size: 'md',
        };
      case 'button':
        return {
          type: 'button',
          action: {
            type: 'postback',
            label: 'ボタン',
            data: 'action=button',
          },
          style: 'primary',
        };
      case 'box':
        return {
          type: 'box',
          layout: 'vertical',
          contents: [],
        };
      case 'separator':
        return {
          type: 'separator',
          margin: 'md',
        };
      default:
        return {};
    }
  };

  const handleEditComponent = (component: FlexComponent) => {
    setEditingComponent(component);
    setOpenComponentDialog(true);
  };

  const handleDeleteComponent = (section: 'header' | 'hero' | 'body' | 'footer', componentId: string) => {
    const updatedValue = { ...value };
    if (updatedValue[section]) {
      updatedValue[section]!.properties.contents = updatedValue[section]!.properties.contents.filter(
        (comp: FlexComponent) => comp.id !== componentId
      );
      onChange(updatedValue);
    }
  };

  const handleComponentPropertyChange = (property: string, newValue: any) => {
    if (!editingComponent) return;

    const updatedComponent = {
      ...editingComponent,
      properties: {
        ...editingComponent.properties,
        [property]: newValue,
      },
    };

    const updatedValue = { ...value };
    Object.keys(updatedValue).forEach(section => {
      if (updatedValue[section as keyof FlexMessage] && 
          typeof updatedValue[section as keyof FlexMessage] === 'object') {
        const sectionObj = updatedValue[section as keyof FlexMessage] as FlexComponent;
        if (sectionObj.properties.contents) {
          sectionObj.properties.contents = sectionObj.properties.contents.map((comp: FlexComponent) =>
            comp.id === editingComponent.id ? updatedComponent : comp
          );
        }
      }
    });

    onChange(updatedValue);
    setEditingComponent(updatedComponent);
  };

  const renderComponentEditor = () => {
    if (!editingComponent) return null;

    const { type, properties } = editingComponent;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="ID"
          value={editingComponent.id}
          onChange={(e) => {
            setEditingComponent({ ...editingComponent, id: e.target.value });
          }}
          fullWidth
        />

        {type === 'text' && (
          <>
            <TextField
              label="テキスト"
              multiline
              rows={3}
              value={properties.text || ''}
              onChange={(e) => handleComponentPropertyChange('text', e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>サイズ</InputLabel>
              <Select
                value={properties.size || 'md'}
                label="サイズ"
                onChange={(e) => handleComponentPropertyChange('size', e.target.value)}
              >
                <MenuItem value="xs">XS</MenuItem>
                <MenuItem value="sm">SM</MenuItem>
                <MenuItem value="md">MD</MenuItem>
                <MenuItem value="lg">LG</MenuItem>
                <MenuItem value="xl">XL</MenuItem>
                <MenuItem value="xxl">XXL</MenuItem>
                <MenuItem value="3xl">3XL</MenuItem>
                <MenuItem value="4xl">4XL</MenuItem>
                <MenuItem value="5xl">5XL</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="色"
              value={properties.color || '#000000'}
              onChange={(e) => handleComponentPropertyChange('color', e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>太さ</InputLabel>
              <Select
                value={properties.weight || 'normal'}
                label="太さ"
                onChange={(e) => handleComponentPropertyChange('weight', e.target.value)}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="bold">Bold</MenuItem>
              </Select>
            </FormControl>
          </>
        )}

        {type === 'image' && (
          <>
            <TextField
              label="画像URL"
              value={properties.url || ''}
              onChange={(e) => handleComponentPropertyChange('url', e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>サイズ</InputLabel>
              <Select
                value={properties.size || 'md'}
                label="サイズ"
                onChange={(e) => handleComponentPropertyChange('size', e.target.value)}
              >
                <MenuItem value="xs">XS</MenuItem>
                <MenuItem value="sm">SM</MenuItem>
                <MenuItem value="md">MD</MenuItem>
                <MenuItem value="lg">LG</MenuItem>
                <MenuItem value="xl">XL</MenuItem>
                <MenuItem value="xxl">XXL</MenuItem>
                <MenuItem value="3xl">3XL</MenuItem>
                <MenuItem value="4xl">4XL</MenuItem>
                <MenuItem value="5xl">5XL</MenuItem>
              </Select>
            </FormControl>
          </>
        )}

        {type === 'button' && (
          <>
            <TextField
              label="ラベル"
              value={properties.action?.label || ''}
              onChange={(e) => handleComponentPropertyChange('action', {
                ...properties.action,
                label: e.target.value,
              })}
              fullWidth
            />
            <TextField
              label="データ"
              value={properties.action?.data || ''}
              onChange={(e) => handleComponentPropertyChange('action', {
                ...properties.action,
                data: e.target.value,
              })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>スタイル</InputLabel>
              <Select
                value={properties.style || 'primary'}
                label="スタイル"
                onChange={(e) => handleComponentPropertyChange('style', e.target.value)}
              >
                <MenuItem value="primary">Primary</MenuItem>
                <MenuItem value="secondary">Secondary</MenuItem>
                <MenuItem value="link">Link</MenuItem>
              </Select>
            </FormControl>
          </>
        )}

        {type === 'box' && (
          <>
            <FormControl fullWidth>
              <InputLabel>レイアウト</InputLabel>
              <Select
                value={properties.layout || 'vertical'}
                label="レイアウト"
                onChange={(e) => handleComponentPropertyChange('layout', e.target.value)}
              >
                <MenuItem value="vertical">Vertical</MenuItem>
                <MenuItem value="horizontal">Horizontal</MenuItem>
                <MenuItem value="baseline">Baseline</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
      </Box>
    );
  };

  const renderSection = (section: 'header' | 'hero' | 'body' | 'footer', title: string) => {
    const sectionData = value[section];
    const contents = sectionData?.properties?.contents || [];

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{title}</Typography>
            <Box>
              <Tooltip title="テキスト追加">
                <IconButton size="small" onClick={() => handleAddComponent(section, 'text')}>
                  <TextFieldsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="画像追加">
                <IconButton size="small" onClick={() => handleAddComponent(section, 'image')}>
                  <ImageIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="ボタン追加">
                <IconButton size="small" onClick={() => handleAddComponent(section, 'button')}>
                  <SmartButtonIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="ボックス追加">
                <IconButton size="small" onClick={() => handleAddComponent(section, 'box')}>
                  <ViewModuleIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {contents.length === 0 ? (
            <Alert severity="info">
              {title}にコンポーネントがありません。上記のボタンから追加してください。
            </Alert>
          ) : (
            <Stack spacing={1}>
              {contents.map((component: FlexComponent, index: number) => (
                <Paper
                  key={component.id}
                  sx={{
                    p: 2,
                    border: selectedComponent === component.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                  onClick={() => setSelectedComponent(component.id)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={component.type} size="small" />
                      <Typography variant="body2">
                        {component.type === 'text' && component.properties.text}
                        {component.type === 'image' && '画像'}
                        {component.type === 'button' && component.properties.action?.label}
                        {component.type === 'box' && 'ボックス'}
                        {component.type === 'separator' && '区切り線'}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleEditComponent(component)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteComponent(section, component.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Flexメッセージエディタ</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => onPreview(value)}
            sx={{ mr: 1 }}
          >
            プレビュー
          </Button>
          <Button
            variant="outlined"
            startIcon={<UndoIcon />}
            onClick={() => onChange(defaultFlexMessage)}
          >
            リセット
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {renderSection('header', 'ヘッダー')}
          {renderSection('hero', 'ヒーロー')}
          {renderSection('body', 'ボディ')}
          {renderSection('footer', 'フッター')}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                コンポーネント設定
              </Typography>
              {selectedComponent ? (
                <Alert severity="info">
                  コンポーネントを選択して編集ボタンをクリックしてください。
                </Alert>
              ) : (
                <Alert severity="info">
                  左側のコンポーネントをクリックして選択してください。
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* コンポーネント編集ダイアログ */}
      <Dialog open={openComponentDialog} onClose={() => setOpenComponentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          コンポーネント編集: {editingComponent?.type}
        </DialogTitle>
        <DialogContent>
          {renderComponentEditor()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenComponentDialog(false)}>
            キャンセル
          </Button>
          <Button onClick={() => setOpenComponentDialog(false)} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlexMessageEditor;
