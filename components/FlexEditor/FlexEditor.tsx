import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Slider,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Copy as CopyIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FlexMessage, FlexComponent, FlexEditorState } from '../../types/flexMessage';
import { 
  createDefaultFlexMessage, 
  deepCloneComponent, 
  addComponentId,
  exportFlexMessage,
  importFlexMessage,
  saveToLocalStorage,
  loadFromLocalStorage
} from '../../utils/flexMessageUtils';
import ComponentPalette from './ComponentPalette';
import FlexCanvas from './FlexCanvas';
import PropertyPanel from './PropertyPanel';
import LayerPanel from './LayerPanel';
import FlexPreview from '../FlexPreview/FlexPreview';
import { mockFlexTemplates } from '../../utils/mockData';

interface FlexEditorProps {
  initialData?: FlexMessage;
  onSave?: (data: FlexMessage) => void;
  onClose?: () => void;
}

const FlexEditor: React.FC<FlexEditorProps> = ({
  initialData,
  onSave,
  onClose
}) => {
  // エディタの状態管理
  const [flexMessage, setFlexMessage] = useState<FlexMessage>(
    initialData || createDefaultFlexMessage()
  );
  const [selectedComponent, setSelectedComponent] = useState<string | undefined>();
  const [editorState, setEditorState] = useState<FlexEditorState>({
    selectedComponent: undefined,
    clipboard: undefined,
    history: [createDefaultFlexMessage()],
    historyIndex: 0,
    isPreviewMode: false,
    previewDevice: 'mobile',
    previewTheme: 'light'
  });

  // UI状態
  const [showPreview, setShowPreview] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [codeEditorValue, setCodeEditorValue] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // テンプレート保存用の状態
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('その他');

  // 履歴管理
  const addToHistory = useCallback((newMessage: FlexMessage) => {
    setEditorState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newMessage);
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  // Flexメッセージの更新
  const updateFlexMessage = useCallback((newMessage: FlexMessage) => {
    setFlexMessage(newMessage);
    addToHistory(newMessage);
  }, [addToHistory]);

  // コンポーネントの選択
  const handleSelectComponent = useCallback((componentId: string | undefined) => {
    setSelectedComponent(componentId);
    setEditorState(prev => ({
      ...prev,
      selectedComponent: componentId
    }));
  }, []);

  // コンポーネントの追加
  const handleAddComponent = useCallback((component: FlexComponent, parentId?: string) => {
    const newComponent = addComponentId(component);
    let newMessage: FlexMessage;

    if (parentId) {
      // 指定された親コンポーネントに追加
      const updatedBody = addComponentToParent(
        flexMessage.body!,
        parentId,
        newComponent,
        'inside'
      );
      newMessage = {
        ...flexMessage,
        body: updatedBody
      };
    } else {
      // bodyのcontentsに追加
      const updatedBody = {
        ...flexMessage.body!,
        contents: [...(flexMessage.body?.contents || []), newComponent]
      };
      newMessage = {
        ...flexMessage,
        body: updatedBody
      };
    }

    updateFlexMessage(newMessage);
  }, [flexMessage, updateFlexMessage]);

  // コンポーネントの削除
  const handleDeleteComponent = useCallback((componentId: string) => {
    if (!flexMessage.body) return;

    const updatedBody = removeComponentById(flexMessage.body, componentId);
    if (updatedBody) {
      const newMessage = {
        ...flexMessage,
        body: updatedBody
      };
      updateFlexMessage(newMessage);
      
      if (selectedComponent === componentId) {
        handleSelectComponent(undefined);
      }
    }
  }, [flexMessage, selectedComponent, updateFlexMessage, handleSelectComponent]);

  // コンポーネントの更新
  const handleUpdateComponent = useCallback((componentId: string, updates: Partial<FlexComponent>) => {
    if (!flexMessage.body) return;

    const updatedBody = updateComponentById(flexMessage.body, componentId, updates);
    const newMessage = {
      ...flexMessage,
      body: updatedBody
    };
    updateFlexMessage(newMessage);
  }, [flexMessage, updateFlexMessage]);

  // コピー・ペースト
  const handleCopyComponent = useCallback((componentId: string) => {
    if (!flexMessage.body) return;

    const component = findComponentById(flexMessage.body, componentId);
    if (component) {
      setEditorState(prev => ({
        ...prev,
        clipboard: deepCloneComponent(component)
      }));
      showSnackbar('コンポーネントをコピーしました', 'success');
    }
  }, [flexMessage]);

  const handlePasteComponent = useCallback((parentId?: string) => {
    if (!editorState.clipboard) return;

    const newComponent = addComponentId(editorState.clipboard);
    handleAddComponent(newComponent, parentId);
    showSnackbar('コンポーネントを貼り付けました', 'success');
  }, [editorState.clipboard, handleAddComponent]);

  // アンドゥ・リドゥ
  const handleUndo = useCallback(() => {
    if (editorState.historyIndex > 0) {
      const newIndex = editorState.historyIndex - 1;
      setFlexMessage(editorState.history[newIndex]);
      setEditorState(prev => ({
        ...prev,
        historyIndex: newIndex
      }));
    }
  }, [editorState]);

  const handleRedo = useCallback(() => {
    if (editorState.historyIndex < editorState.history.length - 1) {
      const newIndex = editorState.historyIndex + 1;
      setFlexMessage(editorState.history[newIndex]);
      setEditorState(prev => ({
        ...prev,
        historyIndex: newIndex
      }));
    }
  }, [editorState]);

  // プレビューの切り替え
  const handleTogglePreview = useCallback(() => {
    setShowPreview(!showPreview);
  }, [showPreview]);

  // コードエディタの切り替え
  const handleToggleCodeEditor = useCallback(() => {
    if (!showCodeEditor) {
      setCodeEditorValue(exportFlexMessage(flexMessage));
    }
    setShowCodeEditor(!showCodeEditor);
  }, [showCodeEditor, flexMessage]);

  // コードエディタからの更新
  const handleCodeEditorSave = useCallback(() => {
    const result = importFlexMessage(codeEditorValue);
    if (result.success && result.data) {
      setFlexMessage(result.data);
      addToHistory(result.data);
      setShowCodeEditor(false);
      showSnackbar('コードから更新しました', 'success');
    } else {
      showSnackbar(result.error || 'コードの解析に失敗しました', 'error');
    }
  }, [codeEditorValue, addToHistory]);

  // テンプレートの保存
  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim()) {
      showSnackbar('テンプレート名を入力してください', 'error');
      return;
    }

    const template = {
      name: templateName,
      description: templateDescription,
      category: templateCategory,
      data: flexMessage,
      version: 1,
      isActive: true,
      usageCount: 0
    };

    saveToLocalStorage('flex_templates', [
      ...loadFromLocalStorage('flex_templates') || [],
      template
    ]);

    setShowTemplateDialog(false);
    setTemplateName('');
    setTemplateDescription('');
    setTemplateCategory('その他');
    showSnackbar('テンプレートを保存しました', 'success');
  }, [templateName, templateDescription, templateCategory, flexMessage]);

  // エクスポート
  const handleExport = useCallback(() => {
    const jsonString = exportFlexMessage(flexMessage);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flex-message-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSnackbar('Flexメッセージをエクスポートしました', 'success');
  }, [flexMessage]);

  // インポート
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importFlexMessage(content);
      if (result.success && result.data) {
        setFlexMessage(result.data);
        addToHistory(result.data);
        showSnackbar('Flexメッセージをインポートしました', 'success');
      } else {
        showSnackbar(result.error || 'ファイルの読み込みに失敗しました', 'error');
      }
    };
    reader.readAsText(file);
  }, [addToHistory]);

  // スナックバーの表示
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* ヘッダー */}
        <Paper sx={{ p: 2, borderRadius: 0, boxShadow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="h1">
              Flexメッセージエディタ
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="元に戻す">
                <IconButton 
                  onClick={handleUndo}
                  disabled={editorState.historyIndex <= 0}
                >
                  <UndoIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="やり直し">
                <IconButton 
                  onClick={handleRedo}
                  disabled={editorState.historyIndex >= editorState.history.length - 1}
                >
                  <RedoIcon />
                </IconButton>
              </Tooltip>
              
              <Divider orientation="vertical" flexItem />
              
              <Tooltip title="プレビュー">
                <IconButton onClick={handleTogglePreview}>
                  <PreviewIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="コードエディタ">
                <IconButton onClick={handleToggleCodeEditor}>
                  <CodeIcon />
                </IconButton>
              </Tooltip>
              
              <Divider orientation="vertical" flexItem />
              
              <Tooltip title="テンプレート保存">
                <IconButton onClick={() => setShowTemplateDialog(true)}>
                  <SaveIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="エクスポート">
                <IconButton onClick={handleExport}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="インポート">
                <IconButton component="label">
                  <UploadIcon />
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    style={{ display: 'none' }}
                  />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* メインコンテンツ */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {!showPreview ? (
            <>
              {/* コンポーネントパレット */}
              <Box sx={{ width: 280, borderRight: 1, borderColor: 'divider' }}>
                <ComponentPalette onAddComponent={handleAddComponent} />
              </Box>

              {/* キャンバス */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <FlexCanvas
                  data={flexMessage}
                  selectedComponent={selectedComponent}
                  onSelectComponent={handleSelectComponent}
                  onUpdateComponent={handleUpdateComponent}
                  onDeleteComponent={handleDeleteComponent}
                  onCopyComponent={handleCopyComponent}
                  onPasteComponent={handlePasteComponent}
                  clipboard={editorState.clipboard}
                />
              </Box>

              {/* プロパティパネル */}
              <Box sx={{ width: 320, borderLeft: 1, borderColor: 'divider' }}>
                <PropertyPanel
                  selectedComponent={selectedComponent}
                  flexMessage={flexMessage}
                  onUpdateComponent={handleUpdateComponent}
                />
              </Box>
            </>
          ) : (
            /* プレビュー */
            <Box sx={{ flex: 1 }}>
              <FlexPreview
                data={flexMessage}
                device={editorState.previewDevice}
                theme={editorState.previewTheme}
              />
            </Box>
          )}
        </Box>

        {/* コードエディタダイアログ */}
        <Dialog
          open={showCodeEditor}
          onClose={() => setShowCodeEditor(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>コードエディタ</DialogTitle>
          <DialogContent>
            <TextField
              multiline
              rows={20}
              fullWidth
              value={codeEditorValue}
              onChange={(e) => setCodeEditorValue(e.target.value)}
              variant="outlined"
              sx={{ fontFamily: 'monospace' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCodeEditor(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCodeEditorSave} variant="contained">
              保存
            </Button>
          </DialogActions>
        </Dialog>

        {/* テンプレート保存ダイアログ */}
        <Dialog
          open={showTemplateDialog}
          onClose={() => setShowTemplateDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>テンプレートを保存</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="テンプレート名"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="説明"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
              >
                <MenuItem value="案内">案内</MenuItem>
                <MenuItem value="確認">確認</MenuItem>
                <MenuItem value="キャンペーン">キャンペーン</MenuItem>
                <MenuItem value="お知らせ">お知らせ</MenuItem>
                <MenuItem value="リマインド">リマインド</MenuItem>
                <MenuItem value="その他">その他</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowTemplateDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveTemplate} variant="contained">
              保存
            </Button>
          </DialogActions>
        </Dialog>

        {/* スナックバー */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </DndProvider>
  );
};

export default FlexEditor;
