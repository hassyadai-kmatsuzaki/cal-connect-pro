import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useDrop } from 'react-dnd';
import { FlexComponent, DragItem } from '../../types/flexMessage';
import { addComponentId } from '../../utils/flexMessageUtils';

interface FlexComponentRendererProps {
  component: FlexComponent;
  isSelected?: boolean;
  onUpdate?: (updates: Partial<FlexComponent>) => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onAddChild?: (component: FlexComponent) => void;
  depth?: number;
}

const FlexComponentRenderer: React.FC<FlexComponentRendererProps> = ({
  component,
  isSelected = false,
  onUpdate,
  onDelete,
  onCopy,
  onAddChild,
  depth = 0
}) => {
  // ドロップ処理
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'component',
    drop: (item: DragItem) => {
      if (item.component && onAddChild) {
        onAddChild(addComponentId(item.component));
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // コンポーネントのクリック処理
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  // テキストコンポーネントのレンダリング
  const renderText = useCallback(() => {
    return (
      <Typography
        variant="body1"
        sx={{
          fontSize: getFontSize(component.size),
          fontWeight: component.weight === 'bold' ? 'bold' : 'normal',
          fontStyle: component.style === 'italic' ? 'italic' : 'normal',
          color: component.color || '#000000',
          textAlign: component.align || 'start',
          textDecoration: component.decoration === 'underline' ? 'underline' : 
                         component.decoration === 'line-through' ? 'line-through' : 'none',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          maxLines: component.maxLines,
          lineHeight: component.lineSpacing === 'none' ? 1 : 
                     component.lineSpacing === 'xs' ? 1.2 :
                     component.lineSpacing === 'sm' ? 1.4 :
                     component.lineSpacing === 'md' ? 1.6 :
                     component.lineSpacing === 'lg' ? 1.8 :
                     component.lineSpacing === 'xl' ? 2 : 1.5,
        }}
      >
        {component.text || 'テキスト'}
      </Typography>
    );
  }, [component]);

  // 画像コンポーネントのレンダリング
  const renderImage = useCallback(() => {
    return (
      <Box
        sx={{
          width: '100%',
          height: getImageHeight(component.size, component.aspectRatio),
          backgroundColor: component.backgroundColor || '#f5f5f5',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {component.url ? (
          <img
            src={component.url}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: component.aspectMode === 'cover' ? 'cover' : 'contain',
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            画像URLを設定
          </Typography>
        )}
      </Box>
    );
  }, [component]);

  // ボタンコンポーネントのレンダリング
  const renderButton = useCallback(() => {
    const buttonStyle = component.style || 'primary';
    const backgroundColor = buttonStyle === 'primary' ? '#0066cc' :
                          buttonStyle === 'secondary' ? '#f0f0f0' :
                          buttonStyle === 'link' ? 'transparent' : '#0066cc';
    const textColor = buttonStyle === 'primary' ? '#ffffff' :
                     buttonStyle === 'secondary' ? '#333333' :
                     buttonStyle === 'link' ? '#0066cc' : '#ffffff';

    return (
      <Button
        variant={buttonStyle === 'link' ? 'text' : 'contained'}
        sx={{
          backgroundColor: component.color || backgroundColor,
          color: textColor,
          height: getButtonHeight(component.height),
          borderRadius: 1,
          textTransform: 'none',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: component.color || backgroundColor,
            opacity: 0.8,
          },
        }}
        onClick={handleClick}
      >
        {component.action?.label || 'ボタン'}
      </Button>
    );
  }, [component]);

  // ボックスコンポーネントのレンダリング
  const renderBox = useCallback(() => {
    return (
      <Box
        ref={drop}
        sx={{
          display: 'flex',
          flexDirection: component.layout === 'horizontal' ? 'row' : 'column',
          alignItems: component.layout === 'baseline' ? 'baseline' : 'stretch',
          backgroundColor: component.backgroundColor || 'transparent',
          borderRadius: getBorderRadius(component.cornerRadius),
          border: component.borderWidth && component.borderWidth !== 'none' ? 
                 `${getBorderWidth(component.borderWidth)} solid ${component.borderColor || '#e0e0e0'}` : 'none',
          padding: getSpacing(component.paddingAll),
          paddingTop: getSpacing(component.paddingTop),
          paddingBottom: getSpacing(component.paddingBottom),
          paddingLeft: getSpacing(component.paddingStart),
          paddingRight: getSpacing(component.paddingEnd),
          margin: getSpacing(component.margin),
          width: component.width,
          height: component.height,
          maxWidth: component.maxWidth,
          maxHeight: component.maxHeight,
          flex: component.flex,
          gap: getSpacing(component.spacing),
          position: component.position === 'absolute' ? 'absolute' : 'relative',
          top: component.offsetTop,
          bottom: component.offsetBottom,
          left: component.offsetStart,
          right: component.offsetEnd,
          ...(isOver && canDrop ? {
            border: '2px dashed #0066cc',
            backgroundColor: 'rgba(0, 102, 204, 0.1)'
          } : {}),
        }}
        onClick={handleClick}
      >
        {component.contents?.map((child, index) => (
          <FlexComponentRenderer
            key={child.id || index}
            component={child}
            isSelected={isSelected}
            onUpdate={(updates) => onUpdate?.({ 
              ...component, 
              contents: component.contents?.map((c, i) => 
                i === index ? { ...c, ...updates } : c
              )
            })}
            onDelete={() => onUpdate?.({
              ...component,
              contents: component.contents?.filter((_, i) => i !== index)
            })}
            onCopy={() => onCopy?.()}
            onAddChild={(newChild) => onAddChild?.(newChild)}
            depth={depth + 1}
          />
        ))}
        
        {/* 空のボックス表示 */}
        {(!component.contents || component.contents.length === 0) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 40,
              color: 'text.secondary',
              fontSize: '0.875rem',
              border: '1px dashed #ccc',
              borderRadius: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            }}
          >
            {component.layout === 'horizontal' ? '水平ボックス' : '垂直ボックス'}
          </Box>
        )}
      </Box>
    );
  }, [component, isSelected, isOver, canDrop, drop, handleClick, onUpdate, onCopy, depth]);

  // アイコンコンポーネントのレンダリング
  const renderIcon = useCallback(() => {
    return (
      <Box
        sx={{
          width: getIconSize(component.size),
          height: getIconSize(component.size),
          backgroundColor: component.backgroundColor || 'transparent',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {component.url ? (
          <img
            src={component.url}
            alt=""
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            🎨
          </Typography>
        )}
      </Box>
    );
  }, [component]);

  // セパレータコンポーネントのレンダリング
  const renderSeparator = useCallback(() => {
    return (
      <Box
        sx={{
          height: component.height || '1px',
          backgroundColor: component.color || '#e0e0e0',
          margin: getSpacing(component.margin),
        }}
      />
    );
  }, [component]);

  // メインのレンダリング
  const renderComponent = useCallback(() => {
    switch (component.type) {
      case 'text':
        return renderText();
      case 'image':
        return renderImage();
      case 'button':
        return renderButton();
      case 'box':
        return renderBox();
      case 'icon':
        return renderIcon();
      case 'separator':
        return renderSeparator();
      default:
        return (
          <Typography variant="body2" color="error">
            不明なコンポーネントタイプ: {component.type}
          </Typography>
        );
    }
  }, [component.type, renderText, renderImage, renderButton, renderBox, renderIcon, renderSeparator]);

  return (
    <Box
      sx={{
        position: 'relative',
        border: isSelected ? '2px solid #0066cc' : '2px solid transparent',
        borderRadius: 1,
        '&:hover': {
          border: '2px solid #0066cc',
          '& .component-actions': {
            opacity: 1,
          },
        },
      }}
    >
      {/* コンポーネントアクション */}
      <Box
        className="component-actions"
        sx={{
          position: 'absolute',
          top: -8,
          right: -8,
          display: 'flex',
          gap: 0.5,
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.2s',
          backgroundColor: 'white',
          borderRadius: 1,
          boxShadow: 1,
          zIndex: 10,
        }}
      >
        <Tooltip title="編集">
          <IconButton size="small" onClick={handleClick}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="コピー">
          <IconButton size="small" onClick={onCopy}>
            <CopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="削除">
          <IconButton size="small" onClick={onDelete} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* コンポーネントのレンダリング */}
      {renderComponent()}
    </Box>
  );
};

// ユーティリティ関数
const getFontSize = (size?: string): string => {
  switch (size) {
    case 'xs': return '0.75rem';
    case 'sm': return '0.875rem';
    case 'md': return '1rem';
    case 'lg': return '1.125rem';
    case 'xl': return '1.25rem';
    case 'xxl': return '1.5rem';
    case '3xl': return '1.875rem';
    case '4xl': return '2.25rem';
    case '5xl': return '3rem';
    default: return '1rem';
  }
};

const getImageHeight = (size?: string, aspectRatio?: string): string => {
  if (aspectRatio) {
    const [width, height] = aspectRatio.split(':').map(Number);
    return `calc(100% * ${height / width})`;
  }
  
  switch (size) {
    case 'xs': return '60px';
    case 'sm': return '80px';
    case 'md': return '120px';
    case 'lg': return '160px';
    case 'xl': return '200px';
    case 'xxl': return '240px';
    case '3xl': return '300px';
    case '4xl': return '400px';
    case '5xl': return '500px';
    case 'full': return '100%';
    default: return '120px';
  }
};

const getButtonHeight = (height?: string): string => {
  switch (height) {
    case 'sm': return '32px';
    case 'md': return '40px';
    case 'lg': return '48px';
    default: return '40px';
  }
};

const getSpacing = (spacing?: string): string => {
  switch (spacing) {
    case 'none': return '0';
    case 'xs': return '4px';
    case 'sm': return '8px';
    case 'md': return '16px';
    case 'lg': return '24px';
    case 'xl': return '32px';
    case 'xxl': return '40px';
    case '3xl': return '48px';
    default: return '0';
  }
};

const getBorderRadius = (cornerRadius?: string): string => {
  switch (cornerRadius) {
    case 'none': return '0';
    case 'xs': return '2px';
    case 'sm': return '4px';
    case 'md': return '8px';
    case 'lg': return '12px';
    case 'xl': return '16px';
    case 'xxl': return '20px';
    case '3xl': return '24px';
    default: return '0';
  }
};

const getBorderWidth = (borderWidth?: string): string => {
  switch (borderWidth) {
    case 'light': return '1px';
    case 'normal': return '2px';
    case 'medium': return '3px';
    case 'semi-bold': return '4px';
    case 'bold': return '6px';
    default: return '1px';
  }
};

const getIconSize = (size?: string): string => {
  switch (size) {
    case 'xs': return '16px';
    case 'sm': return '20px';
    case 'md': return '24px';
    case 'lg': return '32px';
    case 'xl': return '40px';
    case 'xxl': return '48px';
    case '3xl': return '64px';
    case '4xl': return '80px';
    case '5xl': return '96px';
    default: return '24px';
  }
};

export default FlexComponentRenderer;
