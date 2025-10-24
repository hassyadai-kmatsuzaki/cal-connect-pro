// Flexメッセージの型定義
export interface FlexMessage {
  type: 'bubble' | 'carousel';
  hero?: FlexComponent;
  body?: FlexComponent;
  footer?: FlexComponent;
  styles?: FlexStyles;
  header?: FlexComponent;
  altText?: string;
}

export interface FlexComponent {
  type: 'box' | 'text' | 'image' | 'button' | 'icon' | 'separator' | 'filler' | 'spacer';
  layout?: 'horizontal' | 'vertical' | 'baseline';
  contents?: FlexComponent[];
  text?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl' | '4xl' | '5xl' | 'full';
  color?: string;
  weight?: 'regular' | 'bold';
  style?: 'normal' | 'italic';
  align?: 'start' | 'end' | 'center';
  gravity?: 'top' | 'bottom' | 'center';
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl';
  paddingAll?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl';
  paddingTop?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl';
  paddingBottom?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl';
  paddingStart?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl';
  paddingEnd?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: 'none' | 'light' | 'normal' | 'medium' | 'semi-bold' | 'bold';
  cornerRadius?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl';
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  flex?: number;
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl';
  position?: 'relative' | 'absolute';
  offsetTop?: string;
  offsetBottom?: string;
  offsetStart?: string;
  offsetEnd?: string;
  background?: FlexBackground;
  action?: FlexAction;
  url?: string;
  aspectRatio?: '1:1' | '1.51:1' | '1.91:1' | '4:3' | '16:9' | '20:13' | '2:1' | '3:1' | '4:1' | '9:16' | '1:2' | '1:3' | '1:4';
  aspectMode?: 'cover' | 'fit';
  animated?: boolean;
  wrap?: boolean;
  maxLines?: number;
  decoration?: 'none' | 'underline' | 'line-through';
  lineSpacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl';
  id?: string;
}

export interface FlexBackground {
  type: 'solid' | 'linearGradient';
  color?: string;
  angle?: string;
  startColor?: string;
  endColor?: string;
  centerColor?: string;
  centerPosition?: string;
}

export interface FlexAction {
  type: 'postback' | 'message' | 'uri' | 'datetimepicker' | 'camera' | 'cameraRoll' | 'location';
  label?: string;
  data?: string;
  text?: string;
  uri?: string;
  initial?: string;
  max?: string;
  min?: string;
  mode?: 'date' | 'time' | 'datetime';
}

export interface FlexStyles {
  header?: FlexStyle;
  hero?: FlexStyle;
  body?: FlexStyle;
  footer?: FlexStyle;
}

export interface FlexStyle {
  backgroundColor?: string;
  separator?: boolean;
  separatorColor?: string;
}

export interface FlexTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  data: FlexMessage;
  previewImageUrl?: string;
  version: number;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlexComponentLibrary {
  id: string;
  name: string;
  componentType: 'box' | 'text' | 'image' | 'button' | 'icon' | 'separator';
  componentData: FlexComponent;
  previewImageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlexAsset {
  id: string;
  assetType: 'image' | 'icon' | 'background';
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  createdAt: string;
}

// エディタの状態管理
export interface FlexEditorState {
  selectedComponent?: string;
  clipboard?: FlexComponent;
  history: FlexMessage[];
  historyIndex: number;
  isPreviewMode: boolean;
  previewDevice: 'mobile' | 'desktop' | 'tablet';
  previewTheme: 'light' | 'dark';
}

// ドラッグ&ドロップ用の型
export interface DragItem {
  type: 'component' | 'template';
  component?: FlexComponent;
  template?: FlexTemplate;
}

export interface DropResult {
  targetId?: string;
  position?: 'before' | 'after' | 'inside';
}
