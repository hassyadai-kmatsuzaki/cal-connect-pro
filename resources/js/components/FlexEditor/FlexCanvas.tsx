import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoveUp as MoveUpIcon,
  MoveDown as MoveDownIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useDrop } from 'react-dnd';
import { FlexMessage, FlexComponent, DragItem } from '../../types/flexMessage';
import { 
  findComponentById, 
  removeComponentById, 
  addComponentToParent,
  deepCloneComponent 
} from '../../utils/flexMessageUtils';
import FlexComponentRenderer from './FlexComponentRenderer';

interface FlexCanvasProps {
  data: FlexMessage;
  selectedComponent?: string;
  onSelectComponent: (componentId: string | undefined) => void;
  onUpdateComponent: (componentId: string, updates: Partial<FlexComponent>) => void;
  onDeleteComponent: (componentId: string) => void;
  onCopyComponent: (componentId: string) => void;
  onPasteComponent: (parentId?: string) => void;
  clipboard?: FlexComponent;
}

const FlexCanvas: React.FC<FlexCanvasProps> = ({
  data,
  selectedComponent,
  onSelectComponent,
  onUpdateComponent,
  onDeleteComponent,
  onCopyComponent,
  onPasteComponent,
  clipboard
}) => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    componentId?: string;
  } | null>(null);

  // ドロップ処理
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'component',
    drop: (item: DragItem, monitor) => {
      if (!monitor.didDrop()) {
        // キャンバスに直接ドロップされた場合
        onPasteComponent();
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // コンテキストメニューの処理
  const handleContextMenu = useCallback((event: React.MouseEvent, componentId?: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      componentId,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // コンポーネントの選択
  const handleComponentClick = useCallback((event: React.MouseEvent, componentId: string) => {
    event.stopPropagation();
    onSelectComponent(componentId);
  }, [onSelectComponent]);

  // キャンバスのクリック（選択解除）
  const handleCanvasClick = useCallback(() => {
    onSelectComponent(undefined);
  }, [onSelectComponent]);

  // コンポーネントの削除
  const handleDelete = useCallback((componentId: string) => {
    onDeleteComponent(componentId);
    handleCloseContextMenu();
  }, [onDeleteComponent, handleCloseContextMenu]);

  // コンポーネントのコピー
  const handleCopy = useCallback((componentId: string) => {
    onCopyComponent(componentId);
    handleCloseContextMenu();
  }, [onCopyComponent, handleCloseContextMenu]);

  // コンポーネントの貼り付け
  const handlePaste = useCallback((parentId?: string) => {
    onPasteComponent(parentId);
    handleCloseContextMenu();
  }, [onPasteComponent, handleCloseContextMenu]);

  // コンポーネントの移動
  const handleMoveUp = useCallback((componentId: string) => {
    // TODO: 実装
    handleCloseContextMenu();
  }, [handleCloseContextMenu]);

  const handleMoveDown = useCallback((componentId: string) => {
    // TODO: 実装
    handleCloseContextMenu();
  }, [handleCloseContextMenu]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h2">
            キャンバス
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {clipboard && (
              <Chip
                label="クリップボードにコンテンツ"
                size="small"
                color="primary"
                onClick={() => onPasteComponent()}
              />
            )}
            {selectedComponent && (
              <Chip
                label="コンポーネント選択中"
                size="small"
                color="secondary"
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* キャンバスエリア */}
      <Box
        ref={drop}
        sx={{
          flex: 1,
          p: 3,
          overflow: 'auto',
          backgroundColor: isOver && canDrop ? 'action.hover' : 'background.default',
          transition: 'background-color 0.2s',
          position: 'relative',
        }}
        onClick={handleCanvasClick}
      >
        {/* ドロップゾーンの表示 */}
        {isOver && canDrop && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              backgroundColor: 'primary.light',
              opacity: 0.1,
              zIndex: 1,
            }}
          />
        )}

        {/* Flexメッセージの表示 */}
        <Paper
          elevation={2}
          sx={{
            maxWidth: 400,
            mx: 'auto',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Bubble */}
          <Box
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            {data.header && (
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
                onContextMenu={(e) => handleContextMenu(e, data.header?.id)}
                onClick={(e) => data.header?.id && handleComponentClick(e, data.header.id)}
              >
                <FlexComponentRenderer
                  component={data.header}
                  isSelected={selectedComponent === data.header.id}
                  onUpdate={(updates) => data.header?.id && onUpdateComponent(data.header.id, updates)}
                />
              </Box>
            )}

            {/* Hero */}
            {data.hero && (
              <Box
                onContextMenu={(e) => handleContextMenu(e, data.hero?.id)}
                onClick={(e) => data.hero?.id && handleComponentClick(e, data.hero.id)}
              >
                <FlexComponentRenderer
                  component={data.hero}
                  isSelected={selectedComponent === data.hero.id}
                  onUpdate={(updates) => data.hero?.id && onUpdateComponent(data.hero.id, updates)}
                />
              </Box>
            )}

            {/* Body */}
            {data.body && (
              <Box
                sx={{
                  p: 2,
                }}
                onContextMenu={(e) => handleContextMenu(e, data.body?.id)}
                onClick={(e) => data.body?.id && handleComponentClick(e, data.body.id)}
              >
                <FlexComponentRenderer
                  component={data.body}
                  isSelected={selectedComponent === data.body.id}
                  onUpdate={(updates) => data.body?.id && onUpdateComponent(data.body.id, updates)}
                />
              </Box>
            )}

            {/* Footer */}
            {data.footer && (
              <Box
                sx={{
                  borderTop: 1,
                  borderColor: 'divider',
                  p: 2,
                }}
                onContextMenu={(e) => handleContextMenu(e, data.footer?.id)}
                onClick={(e) => data.footer?.id && handleComponentClick(e, data.footer.id)}
              >
                <FlexComponentRenderer
                  component={data.footer}
                  isSelected={selectedComponent === data.footer.id}
                  onUpdate={(updates) => data.footer?.id && onUpdateComponent(data.footer.id, updates)}
                />
              </Box>
            )}
          </Box>
        </Paper>

        {/* 空の状態 */}
        {!data.body && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Flexメッセージを作成
            </Typography>
            <Typography variant="body2" textAlign="center">
              左側のコンポーネントパレットから<br />
              コンポーネントをドラッグ&ドロップして配置してください
            </Typography>
          </Box>
        )}
      </Box>

      {/* コンテキストメニュー */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenu?.componentId && (
          <>
            <MenuItem onClick={() => handleCopy(contextMenu.componentId!)}>
              <ListItemIcon>
                <CopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>コピー</ListItemText>
            </MenuItem>
            
            {clipboard && (
              <MenuItem onClick={() => handlePaste(contextMenu.componentId)}>
                <ListItemIcon>
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>貼り付け</ListItemText>
              </MenuItem>
            )}
            
            <Divider />
            
            <MenuItem onClick={() => handleMoveUp(contextMenu.componentId!)}>
              <ListItemIcon>
                <MoveUpIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>上に移動</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => handleMoveDown(contextMenu.componentId!)}>
              <ListItemIcon>
                <MoveDownIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>下に移動</ListItemText>
            </MenuItem>
            
            <Divider />
            
            <MenuItem 
              onClick={() => handleDelete(contextMenu.componentId!)}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>削除</ListItemText>
            </MenuItem>
          </>
        )}
        
        {!contextMenu?.componentId && clipboard && (
          <MenuItem onClick={() => handlePaste()}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>貼り付け</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default FlexCanvas;
