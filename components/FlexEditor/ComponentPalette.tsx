import React from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  TextFields as TextIcon,
  Image as ImageIcon,
  SmartButton as ButtonIcon,
  ViewInAr as BoxIcon,
  PhotoCamera as IconIcon,
  HorizontalRule as SeparatorIcon
} from '@mui/icons-material';
import { useDrag } from 'react-dnd';
import { FlexComponent } from '../../types/flexMessage';
import { 
  createDefaultText, 
  createDefaultImage, 
  createDefaultButton, 
  createDefaultBox, 
  createDefaultIcon, 
  createDefaultSeparator 
} from '../../utils/flexMessageUtils';
import { componentTypes } from '../../utils/mockData';

interface ComponentPaletteProps {
  onAddComponent: (component: FlexComponent, parentId?: string) => void;
}

interface DraggableComponentProps {
  type: string;
  label: string;
  icon: React.ReactNode;
  onAdd: () => void;
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({ type, label, icon, onAdd }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <ListItem disablePadding>
      <ListItemButton
        ref={drag}
        onClick={onAdd}
        sx={{
          opacity: isDragging ? 0.5 : 1,
          cursor: 'grab',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <ListItemIcon>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {icon}
          </Avatar>
        </ListItemIcon>
        <ListItemText 
          primary={label}
          secondary={`${type}コンポーネント`}
        />
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAdd(); }}>
          <AddIcon />
        </IconButton>
      </ListItemButton>
    </ListItem>
  );
};

const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  const handleAddComponent = (type: string) => {
    let component: FlexComponent;

    switch (type) {
      case 'text':
        component = createDefaultText();
        break;
      case 'image':
        component = createDefaultImage();
        break;
      case 'button':
        component = createDefaultButton();
        break;
      case 'box':
        component = createDefaultBox();
        break;
      case 'icon':
        component = createDefaultIcon();
        break;
      case 'separator':
        component = createDefaultSeparator();
        break;
      default:
        component = createDefaultText();
    }

    onAddComponent(component);
  };

  const getIcon = (type: string) => {
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
        return <TextIcon fontSize="small" />;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="h2">
          コンポーネント
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ドラッグ&ドロップで配置
        </Typography>
      </Box>

      {/* コンポーネント一覧 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">基本コンポーネント</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense>
              {componentTypes.map((componentType) => (
                <DraggableComponent
                  key={componentType.value}
                  type={componentType.value}
                  label={componentType.label}
                  icon={getIcon(componentType.value)}
                  onAdd={() => handleAddComponent(componentType.value)}
                />
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">レイアウト</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense>
              <DraggableComponent
                type="box"
                label="垂直ボックス"
                icon={<BoxIcon fontSize="small" />}
                onAdd={() => {
                  const component = createDefaultBox();
                  component.layout = 'vertical';
                  onAddComponent(component);
                }}
              />
              <DraggableComponent
                type="box"
                label="水平ボックス"
                icon={<BoxIcon fontSize="small" />}
                onAdd={() => {
                  const component = createDefaultBox();
                  component.layout = 'horizontal';
                  onAddComponent(component);
                }}
              />
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">テキスト</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense>
              <DraggableComponent
                type="text"
                label="見出し"
                icon={<TextIcon fontSize="small" />}
                onAdd={() => {
                  const component = createDefaultText('見出し');
                  component.size = 'xl';
                  component.weight = 'bold';
                  onAddComponent(component);
                }}
              />
              <DraggableComponent
                type="text"
                label="本文"
                icon={<TextIcon fontSize="small" />}
                onAdd={() => {
                  const component = createDefaultText('本文テキスト');
                  component.size = 'md';
                  component.weight = 'regular';
                  onAddComponent(component);
                }}
              />
              <DraggableComponent
                type="text"
                label="キャプション"
                icon={<TextIcon fontSize="small" />}
                onAdd={() => {
                  const component = createDefaultText('キャプション');
                  component.size = 'sm';
                  component.color = '#666666';
                  onAddComponent(component);
                }}
              />
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">ボタン</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense>
              <DraggableComponent
                type="button"
                label="プライマリボタン"
                icon={<ButtonIcon fontSize="small" />}
                onAdd={() => {
                  const component = createDefaultButton('ボタン');
                  component.style = 'primary';
                  component.color = '#ffffff';
                  onAddComponent(component);
                }}
              />
              <DraggableComponent
                type="button"
                label="セカンダリボタン"
                icon={<ButtonIcon fontSize="small" />}
                onAdd={() => {
                  const component = createDefaultButton('ボタン');
                  component.style = 'secondary';
                  component.color = '#666666';
                  onAddComponent(component);
                }}
              />
              <DraggableComponent
                type="button"
                label="リンクボタン"
                icon={<ButtonIcon fontSize="small" />}
                onAdd={() => {
                  const component = createDefaultButton('リンク');
                  component.style = 'link';
                  component.color = '#0066cc';
                  onAddComponent(component);
                }}
              />
            </List>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* フッター */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          💡 ヒント: コンポーネントをドラッグしてキャンバスに配置するか、クリックで直接追加できます
        </Typography>
      </Box>
    </Box>
  );
};

export default ComponentPalette;
