import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  Chip
} from '@mui/material';
import {
  TextFields as TextIcon,
  Image as ImageIcon,
  SmartButton as ButtonIcon,
  ViewInAr as BoxIcon,
  PhotoCamera as IconIcon,
  HorizontalRule as SeparatorIcon,
  Visibility as VisibleIcon,
  VisibilityOff as HiddenIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { FlexComponent } from '../../types/flexMessage';

interface LayerPanelProps {
  flexMessage: any;
  selectedComponent?: string;
  onSelectComponent: (componentId: string | undefined) => void;
  onDeleteComponent: (componentId: string) => void;
  onToggleVisibility?: (componentId: string) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({
  flexMessage,
  selectedComponent,
  onSelectComponent,
  onDeleteComponent,
  onToggleVisibility
}) => {
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <TextIcon fontSize="small" />;
      case 'image':
        return <ImageIcon fontSize="small" />;
      case 'button':
        return <ButtonIcon fontSize="small" />;
      case 'box':
        return <BoxIcon fontSize="small" />;
      case 'icon':
        return <IconIcon fontSize="small" />;
      case 'separator':
        return <SeparatorIcon fontSize="small" />;
      default:
        return <BoxIcon fontSize="small" />;
    }
  };

  const getComponentName = (component: FlexComponent) => {
    switch (component.type) {
      case 'text':
        return component.text || 'テキスト';
      case 'image':
        return '画像';
      case 'button':
        return component.action?.label || 'ボタン';
      case 'box':
        return component.layout === 'horizontal' ? '水平ボックス' : '垂直ボックス';
      case 'icon':
        return 'アイコン';
      case 'separator':
        return 'セパレータ';
      default:
        return component.type;
    }
  };

  const renderComponentTree = (component: FlexComponent, depth: number = 0) => {
    const isSelected = selectedComponent === component.id;
    const hasChildren = component.contents && component.contents.length > 0;

    return (
      <React.Fragment key={component.id}>
        <ListItem disablePadding sx={{ pl: depth * 2 }}>
          <ListItemButton
            selected={isSelected}
            onClick={() => onSelectComponent(component.id)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {getComponentIcon(component.type)}
            </ListItemIcon>
            <ListItemText
              primary={getComponentName(component)}
              secondary={component.type}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isSelected ? 'bold' : 'normal',
              }}
              secondaryTypographyProps={{
                fontSize: '0.75rem',
              }}
            />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {onToggleVisibility && (
                <Tooltip title="表示/非表示">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(component.id!);
                    }}
                  >
                    <VisibleIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="削除">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComponent(component.id!);
                  }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </ListItemButton>
        </ListItem>
        
        {/* 子コンポーネント */}
        {hasChildren && (
          <Box sx={{ pl: 2 }}>
            {component.contents!.map((child) => renderComponentTree(child, depth + 1))}
          </Box>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="h2">
          レイヤー
        </Typography>
        <Typography variant="body2" color="text.secondary">
          コンポーネントの階層構造
        </Typography>
      </Box>

      {/* レイヤー一覧 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List dense>
          {/* Body */}
          {flexMessage.body && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedComponent === flexMessage.body.id}
                  onClick={() => onSelectComponent(flexMessage.body.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: 'grey.100',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <BoxIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Body"
                    secondary="メインコンテナ"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                    }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ mx: 2, my: 1 }} />
              {flexMessage.body.contents?.map((component: FlexComponent) => 
                renderComponentTree(component, 0)
              )}
            </>
          )}

          {/* Header */}
          {flexMessage.header && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedComponent === flexMessage.header.id}
                  onClick={() => onSelectComponent(flexMessage.header.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: 'grey.100',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <BoxIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Header"
                    secondary="ヘッダー"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                    }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ mx: 2, my: 1 }} />
              {flexMessage.header.contents?.map((component: FlexComponent) => 
                renderComponentTree(component, 0)
              )}
            </>
          )}

          {/* Hero */}
          {flexMessage.hero && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedComponent === flexMessage.hero.id}
                  onClick={() => onSelectComponent(flexMessage.hero.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: 'grey.100',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <BoxIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Hero"
                    secondary="ヒーロー画像"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                    }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ mx: 2, my: 1 }} />
            </>
          )}

          {/* Footer */}
          {flexMessage.footer && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedComponent === flexMessage.footer.id}
                  onClick={() => onSelectComponent(flexMessage.footer.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: 'grey.100',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <BoxIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Footer"
                    secondary="フッター"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                    }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ mx: 2, my: 1 }} />
              {flexMessage.footer.contents?.map((component: FlexComponent) => 
                renderComponentTree(component, 0)
              )}
            </>
          )}
        </List>
      </Box>

      {/* フッター */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          💡 ヒント: コンポーネントをクリックして選択し、プロパティを編集できます
        </Typography>
      </Box>
    </Box>
  );
};

export default LayerPanel;
