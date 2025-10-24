import { FlexMessage, FlexComponent, FlexTemplate } from '../types/flexMessage';

// Flexメッセージのバリデーション
export const validateFlexMessage = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Flexメッセージデータが無効です');
    return { isValid: false, errors };
  }

  if (!data.type || !['bubble', 'carousel'].includes(data.type)) {
    errors.push('typeは"bubble"または"carousel"である必要があります');
  }

  if (data.type === 'bubble') {
    if (!data.body) {
      errors.push('bubbleタイプにはbodyが必要です');
    }
  }

  if (data.type === 'carousel') {
    if (!data.contents || !Array.isArray(data.contents)) {
      errors.push('carouselタイプにはcontents配列が必要です');
    }
  }

  return { isValid: errors.length === 0, errors };
};

// Flexコンポーネントのバリデーション
export const validateFlexComponent = (component: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!component || typeof component !== 'object') {
    errors.push('コンポーネントデータが無効です');
    return { isValid: false, errors };
  }

  if (!component.type) {
    errors.push('コンポーネントのtypeが必要です');
  }

  const validTypes = ['box', 'text', 'image', 'button', 'icon', 'separator', 'filler', 'spacer'];
  if (component.type && !validTypes.includes(component.type)) {
    errors.push(`無効なコンポーネントタイプ: ${component.type}`);
  }

  if (component.type === 'text' && !component.text) {
    errors.push('textコンポーネントにはtextが必要です');
  }

  if (component.type === 'image' && !component.url) {
    errors.push('imageコンポーネントにはurlが必要です');
  }

  if (component.type === 'button' && !component.action) {
    errors.push('buttonコンポーネントにはactionが必要です');
  }

  return { isValid: errors.length === 0, errors };
};

// FlexメッセージのJSONエクスポート
export const exportFlexMessage = (data: FlexMessage): string => {
  return JSON.stringify(data, null, 2);
};

// FlexメッセージのJSONインポート
export const importFlexMessage = (jsonString: string): { success: boolean; data?: FlexMessage; error?: string } => {
  try {
    const data = JSON.parse(jsonString);
    const validation = validateFlexMessage(data);
    
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: '無効なJSON形式です' };
  }
};

// デフォルトのFlexメッセージを生成
export const createDefaultFlexMessage = (): FlexMessage => {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'Hello World',
          size: 'md',
          color: '#000000',
          weight: 'regular'
        }
      ],
      paddingAll: '20px',
      backgroundColor: '#ffffff'
    }
  };
};

// デフォルトのBoxコンポーネントを生成
export const createDefaultBox = (): FlexComponent => {
  return {
    type: 'box',
    layout: 'vertical',
    contents: [],
    paddingAll: '10px',
    backgroundColor: '#ffffff'
  };
};

// デフォルトのTextコンポーネントを生成
export const createDefaultText = (text: string = 'New Text'): FlexComponent => {
  return {
    type: 'text',
    text,
    size: 'md',
    color: '#000000',
    weight: 'regular'
  };
};

// デフォルトのImageコンポーネントを生成
export const createDefaultImage = (url: string = ''): FlexComponent => {
  return {
    type: 'image',
    url,
    size: 'md',
    aspectRatio: '1:1',
    aspectMode: 'cover'
  };
};

// デフォルトのButtonコンポーネントを生成
export const createDefaultButton = (text: string = 'Button'): FlexComponent => {
  return {
    type: 'button',
    action: {
      type: 'postback',
      label: text,
      data: 'button_clicked'
    },
    style: 'primary',
    color: '#ffffff',
    height: 'sm'
  };
};

// デフォルトのIconコンポーネントを生成
export const createDefaultIcon = (url: string = ''): FlexComponent => {
  return {
    type: 'icon',
    url,
    size: 'md'
  };
};

// デフォルトのSeparatorコンポーネントを生成
export const createDefaultSeparator = (): FlexComponent => {
  return {
    type: 'separator',
    color: '#e0e0e0',
    margin: 'md'
  };
};

// コンポーネントの深いコピー
export const deepCloneComponent = (component: FlexComponent): FlexComponent => {
  return JSON.parse(JSON.stringify(component));
};

// コンポーネントにユニークIDを付与
export const addComponentId = (component: FlexComponent): FlexComponent => {
  const cloned = deepCloneComponent(component);
  cloned.id = `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (cloned.contents) {
    cloned.contents = cloned.contents.map(addComponentId);
  }
  
  return cloned;
};

// コンポーネントツリーから指定IDのコンポーネントを検索
export const findComponentById = (root: FlexComponent, id: string): FlexComponent | null => {
  if (root.id === id) {
    return root;
  }
  
  if (root.contents) {
    for (const child of root.contents) {
      const found = findComponentById(child, id);
      if (found) return found;
    }
  }
  
  return null;
};

// コンポーネントツリーから指定IDのコンポーネントを削除
export const removeComponentById = (root: FlexComponent, id: string): FlexComponent | null => {
  if (root.id === id) {
    return null;
  }
  
  if (root.contents) {
    root.contents = root.contents
      .map(child => removeComponentById(child, id))
      .filter(child => child !== null) as FlexComponent[];
  }
  
  return root;
};

// コンポーネントツリーに新しいコンポーネントを追加
export const addComponentToParent = (
  root: FlexComponent, 
  parentId: string, 
  newComponent: FlexComponent, 
  position: 'before' | 'after' | 'inside' = 'inside'
): FlexComponent => {
  const cloned = deepCloneComponent(root);
  
  if (cloned.id === parentId) {
    if (position === 'inside') {
      if (!cloned.contents) cloned.contents = [];
      cloned.contents.push(addComponentId(newComponent));
    }
    return cloned;
  }
  
  if (cloned.contents) {
    cloned.contents = cloned.contents.map(child => 
      addComponentToParent(child, parentId, newComponent, position)
    );
  }
  
  return cloned;
};

// コンポーネントの更新
export const updateComponentById = (
  root: FlexComponent, 
  componentId: string, 
  updates: Partial<FlexComponent>
): FlexComponent => {
  const cloned = deepCloneComponent(root);
  
  if (cloned.id === componentId) {
    return { ...cloned, ...updates };
  }
  
  if (cloned.contents) {
    cloned.contents = cloned.contents.map(child => 
      updateComponentById(child, componentId, updates)
    );
  }
  
  return cloned;
};

// ローカルストレージの操作
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('ローカルストレージへの保存に失敗しました:', error);
  }
};

export const loadFromLocalStorage = (key: string): any => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('ローカルストレージからの読み込みに失敗しました:', error);
    return null;
  }
};

// テンプレートの管理
export const saveTemplate = (template: Omit<FlexTemplate, 'id' | 'createdAt' | 'updatedAt'>): FlexTemplate => {
  const templates = loadFromLocalStorage('flex_templates') || [];
  const newTemplate: FlexTemplate = {
    ...template,
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  templates.push(newTemplate);
  saveToLocalStorage('flex_templates', templates);
  
  return newTemplate;
};

export const loadTemplates = (): FlexTemplate[] => {
  return loadFromLocalStorage('flex_templates') || [];
};

export const deleteTemplate = (id: string): boolean => {
  const templates = loadFromLocalStorage('flex_templates') || [];
  const filteredTemplates = templates.filter((t: FlexTemplate) => t.id !== id);
  
  if (filteredTemplates.length < templates.length) {
    saveToLocalStorage('flex_templates', filteredTemplates);
    return true;
  }
  
  return false;
};

// プレビュー用のCSS生成
export const generatePreviewCSS = (): string => {
  return `
    .flex-preview {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 100%;
      margin: 0 auto;
    }
    
    .flex-bubble {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin: 8px;
    }
    
    .flex-box {
      display: flex;
      box-sizing: border-box;
    }
    
    .flex-box.horizontal {
      flex-direction: row;
    }
    
    .flex-box.vertical {
      flex-direction: column;
    }
    
    .flex-text {
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    
    .flex-button {
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: 500;
      text-align: center;
      transition: all 0.2s ease;
    }
    
    .flex-button:hover {
      opacity: 0.8;
    }
    
    .flex-image {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }
    
    .flex-separator {
      height: 1px;
      background-color: #e0e0e0;
    }
    
    .flex-icon {
      width: 24px;
      height: 24px;
    }
  `;
};
