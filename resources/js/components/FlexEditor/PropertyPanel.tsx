import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Divider,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ColorLens as ColorIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { FlexMessage, FlexComponent } from '../../types/flexMessage';
import { findComponentById } from '../../utils/flexMessageUtils';
import { 
  sizeOptions, 
  colorPresets, 
  actionTypes, 
  layoutOptions, 
  aspectRatioOptions 
} from '../../utils/mockData';

interface PropertyPanelProps {
  selectedComponent?: string;
  flexMessage: FlexMessage;
  onUpdateComponent: (componentId: string, updates: Partial<FlexComponent>) => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedComponent,
  flexMessage,
  onUpdateComponent
}) => {
  const [component, setComponent] = useState<FlexComponent | null>(null);
  const [tempValues, setTempValues] = useState<Partial<FlexComponent>>({});

  // 選択されたコンポーネントを取得
  useEffect(() => {
    if (selectedComponent && flexMessage.body) {
      const found = findComponentById(flexMessage.body, selectedComponent);
      if (found) {
        setComponent(found);
        setTempValues(found);
      } else {
        setComponent(null);
        setTempValues({});
      }
    } else {
      setComponent(null);
      setTempValues({});
    }
  }, [selectedComponent, flexMessage]);

  // プロパティの更新
  const handlePropertyChange = useCallback((key: string, value: any) => {
    setTempValues(prev => ({ ...prev, [key]: value }));
  }, []);

  // プロパティの保存
  const handleSave = useCallback(() => {
    if (selectedComponent && Object.keys(tempValues).length > 0) {
      onUpdateComponent(selectedComponent, tempValues);
      setTempValues({});
    }
  }, [selectedComponent, tempValues, onUpdateComponent]);

  // プロパティのリセット
  const handleReset = useCallback(() => {
    if (component) {
      setTempValues(component);
    }
  }, [component]);

  // カラーピッカーの表示
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  if (!component) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="h2">
            プロパティ
          </Typography>
        </Box>
        <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Alert severity="info">
            コンポーネントを選択してプロパティを編集してください
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h2">
            プロパティ
          </Typography>
          <Chip
            label={component.type}
            size="small"
            color="primary"
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {component.type}コンポーネントの設定
        </Typography>
      </Box>

      {/* プロパティ一覧 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* 基本設定 */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">基本設定</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* テキスト */}
              {component.type === 'text' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="テキスト"
                    value={tempValues.text || ''}
                    onChange={(e) => handlePropertyChange('text', e.target.value)}
                    multiline
                    rows={3}
                  />
                </Grid>
              )}

              {/* 画像URL */}
              {component.type === 'image' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="画像URL"
                    value={tempValues.url || ''}
                    onChange={(e) => handlePropertyChange('url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </Grid>
              )}

              {/* ボタンラベル */}
              {component.type === 'button' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="ボタンテキスト"
                    value={tempValues.action?.label || ''}
                    onChange={(e) => handlePropertyChange('action', {
                      ...tempValues.action,
                      label: e.target.value
                    })}
                  />
                </Grid>
              )}

              {/* アイコンURL */}
              {component.type === 'icon' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="アイコンURL"
                    value={tempValues.url || ''}
                    onChange={(e) => handlePropertyChange('url', e.target.value)}
                    placeholder="https://example.com/icon.svg"
                  />
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* サイズ・レイアウト */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">サイズ・レイアウト</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* サイズ */}
              {(component.type === 'text' || component.type === 'image' || component.type === 'icon') && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>サイズ</InputLabel>
                    <Select
                      value={tempValues.size || 'md'}
                      onChange={(e) => handlePropertyChange('size', e.target.value)}
                    >
                      {sizeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* レイアウト */}
              {component.type === 'box' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>レイアウト</InputLabel>
                    <Select
                      value={tempValues.layout || 'vertical'}
                      onChange={(e) => handlePropertyChange('layout', e.target.value)}
                    >
                      {layoutOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* アスペクト比 */}
              {component.type === 'image' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>アスペクト比</InputLabel>
                    <Select
                      value={tempValues.aspectRatio || '1:1'}
                      onChange={(e) => handlePropertyChange('aspectRatio', e.target.value)}
                    >
                      {aspectRatioOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* アスペクトモード */}
              {component.type === 'image' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>アスペクトモード</InputLabel>
                    <Select
                      value={tempValues.aspectMode || 'cover'}
                      onChange={(e) => handlePropertyChange('aspectMode', e.target.value)}
                    >
                      <MenuItem value="cover">Cover</MenuItem>
                      <MenuItem value="fit">Fit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* ボタンスタイル */}
              {component.type === 'button' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>スタイル</InputLabel>
                    <Select
                      value={tempValues.style || 'primary'}
                      onChange={(e) => handlePropertyChange('style', e.target.value)}
                    >
                      <MenuItem value="primary">Primary</MenuItem>
                      <MenuItem value="secondary">Secondary</MenuItem>
                      <MenuItem value="link">Link</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* ボタンの高さ */}
              {component.type === 'button' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>高さ</InputLabel>
                    <Select
                      value={tempValues.height || 'sm'}
                      onChange={(e) => handlePropertyChange('height', e.target.value)}
                    >
                      <MenuItem value="sm">Small</MenuItem>
                      <MenuItem value="md">Medium</MenuItem>
                      <MenuItem value="lg">Large</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* 色・スタイル */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">色・スタイル</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* テキストの色 */}
              {component.type === 'text' && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="テキスト色"
                      value={tempValues.color || '#000000'}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      placeholder="#000000"
                    />
                    <IconButton
                      onClick={() => setShowColorPicker(showColorPicker === 'color' ? null : 'color')}
                    >
                      <ColorIcon />
                    </IconButton>
                  </Box>
                  {showColorPicker === 'color' && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" gutterBottom>
                        色のプリセット
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {colorPresets.map((color) => (
                          <Box
                            key={color}
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: color,
                              borderRadius: 1,
                              cursor: 'pointer',
                              border: tempValues.color === color ? '2px solid #000' : '1px solid #ccc',
                            }}
                            onClick={() => handlePropertyChange('color', color)}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>
              )}

              {/* 背景色 */}
              {(component.type === 'box' || component.type === 'button') && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="背景色"
                      value={tempValues.backgroundColor || '#ffffff'}
                      onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                      placeholder="#ffffff"
                    />
                    <IconButton
                      onClick={() => setShowColorPicker(showColorPicker === 'backgroundColor' ? null : 'backgroundColor')}
                    >
                      <ColorIcon />
                    </IconButton>
                  </Box>
                  {showColorPicker === 'backgroundColor' && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" gutterBottom>
                        色のプリセット
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {colorPresets.map((color) => (
                          <Box
                            key={color}
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: color,
                              borderRadius: 1,
                              cursor: 'pointer',
                              border: tempValues.backgroundColor === color ? '2px solid #000' : '1px solid #ccc',
                            }}
                            onClick={() => handlePropertyChange('backgroundColor', color)}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>
              )}

              {/* フォントウェイト */}
              {component.type === 'text' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>フォントウェイト</InputLabel>
                    <Select
                      value={tempValues.weight || 'regular'}
                      onChange={(e) => handlePropertyChange('weight', e.target.value)}
                    >
                      <MenuItem value="regular">Regular</MenuItem>
                      <MenuItem value="bold">Bold</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* テキストスタイル */}
              {component.type === 'text' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>スタイル</InputLabel>
                    <Select
                      value={tempValues.style || 'normal'}
                      onChange={(e) => handlePropertyChange('style', e.target.value)}
                    >
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="italic">Italic</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* テキスト装飾 */}
              {component.type === 'text' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>装飾</InputLabel>
                    <Select
                      value={tempValues.decoration || 'none'}
                      onChange={(e) => handlePropertyChange('decoration', e.target.value)}
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="underline">Underline</MenuItem>
                      <MenuItem value="line-through">Line Through</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* テキスト配置 */}
              {component.type === 'text' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>配置</InputLabel>
                    <Select
                      value={tempValues.align || 'start'}
                      onChange={(e) => handlePropertyChange('align', e.target.value)}
                    >
                      <MenuItem value="start">Start</MenuItem>
                      <MenuItem value="center">Center</MenuItem>
                      <MenuItem value="end">End</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* 余白・パディング */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">余白・パディング</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* マージン */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>マージン</InputLabel>
                  <Select
                    value={tempValues.margin || 'none'}
                    onChange={(e) => handlePropertyChange('margin', e.target.value)}
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="xs">XS</MenuItem>
                    <MenuItem value="sm">SM</MenuItem>
                    <MenuItem value="md">MD</MenuItem>
                    <MenuItem value="lg">LG</MenuItem>
                    <MenuItem value="xl">XL</MenuItem>
                    <MenuItem value="xxl">XXL</MenuItem>
                    <MenuItem value="3xl">3XL</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* パディング */}
              {(component.type === 'box' || component.type === 'button') && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>パディング</InputLabel>
                    <Select
                      value={tempValues.paddingAll || 'none'}
                      onChange={(e) => handlePropertyChange('paddingAll', e.target.value)}
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="xs">XS</MenuItem>
                      <MenuItem value="sm">SM</MenuItem>
                      <MenuItem value="md">MD</MenuItem>
                      <MenuItem value="lg">LG</MenuItem>
                      <MenuItem value="xl">XL</MenuItem>
                      <MenuItem value="xxl">XXL</MenuItem>
                      <MenuItem value="3xl">3XL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* スペーシング */}
              {component.type === 'box' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>スペーシング</InputLabel>
                    <Select
                      value={tempValues.spacing || 'none'}
                      onChange={(e) => handlePropertyChange('spacing', e.target.value)}
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="xs">XS</MenuItem>
                      <MenuItem value="sm">SM</MenuItem>
                      <MenuItem value="md">MD</MenuItem>
                      <MenuItem value="lg">LG</MenuItem>
                      <MenuItem value="xl">XL</MenuItem>
                      <MenuItem value="xxl">XXL</MenuItem>
                      <MenuItem value="3xl">3XL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* アクション */}
        {component.type === 'button' && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">アクション</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>アクションタイプ</InputLabel>
                    <Select
                      value={tempValues.action?.type || 'postback'}
                      onChange={(e) => handlePropertyChange('action', {
                        ...tempValues.action,
                        type: e.target.value
                      })}
                    >
                      {actionTypes.map((action) => (
                        <MenuItem key={action.value} value={action.value}>
                          {action.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {tempValues.action?.type === 'postback' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="データ"
                      value={tempValues.action?.data || ''}
                      onChange={(e) => handlePropertyChange('action', {
                        ...tempValues.action,
                        data: e.target.value
                      })}
                      placeholder="button_clicked"
                    />
                  </Grid>
                )}

                {tempValues.action?.type === 'message' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="メッセージ"
                      value={tempValues.action?.text || ''}
                      onChange={(e) => handlePropertyChange('action', {
                        ...tempValues.action,
                        text: e.target.value
                      })}
                      placeholder="送信するメッセージ"
                    />
                  </Grid>
                )}

                {tempValues.action?.type === 'uri' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="URL"
                      value={tempValues.action?.uri || ''}
                      onChange={(e) => handlePropertyChange('action', {
                        ...tempValues.action,
                        uri: e.target.value
                      })}
                      placeholder="https://example.com"
                    />
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>

      {/* フッター */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={Object.keys(tempValues).length === 0}
            fullWidth
          >
            保存
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={Object.keys(tempValues).length === 0}
          >
            リセット
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PropertyPanel;
