import { FlexMessage, FlexTemplate } from '../types/flexMessage';

// モックデータ
export const mockFlexTemplates: FlexTemplate[] = [
  {
    id: 'template_1',
    name: 'サービス案内',
    description: '基本的なサービス案内メッセージ',
    category: '案内',
    data: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'サービス案内',
            size: 'xl',
            weight: 'bold',
            color: '#000000'
          },
          {
            type: 'text',
            text: '当社のサービスをご案内いたします。',
            size: 'md',
            color: '#666666',
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'postback',
                  label: '詳細を見る',
                  data: 'service_detail'
                },
                style: 'primary',
                color: '#ffffff',
                height: 'sm'
              }
            ],
            margin: 'md'
          }
        ],
        paddingAll: '20px',
        backgroundColor: '#ffffff'
      }
    },
    previewImageUrl: '/images/templates/service_intro.png',
    version: 1,
    isActive: true,
    usageCount: 1250,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'template_2',
    name: '予約確認',
    description: '予約完了時の確認メッセージ',
    category: '確認',
    data: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '予約が完了しました',
            size: 'xl',
            weight: 'bold',
            color: '#00C851',
            align: 'center'
          },
          {
            type: 'text',
            text: 'ご予約ありがとうございます。',
            size: 'md',
            color: '#666666',
            margin: 'md',
            align: 'center'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '予約日時: 2024年1月20日 14:00',
                size: 'sm',
                color: '#000000'
              },
              {
                type: 'text',
                text: '予約者: 田中太郎',
                size: 'sm',
                color: '#000000',
                margin: 'xs'
              }
            ],
            backgroundColor: '#f5f5f5',
            paddingAll: 'md',
            cornerRadius: 'md',
            margin: 'md'
          }
        ],
        paddingAll: '20px',
        backgroundColor: '#ffffff'
      }
    },
    previewImageUrl: '/images/templates/reservation_confirmation.png',
    version: 1,
    isActive: true,
    usageCount: 890,
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z'
  },
  {
    id: 'template_3',
    name: 'キャンペーン告知',
    description: 'キャンペーン情報の告知メッセージ',
    category: 'キャンペーン',
    data: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: 'https://example.com/campaign-image.jpg',
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🎉 特別キャンペーン開催中！',
            size: 'xl',
            weight: 'bold',
            color: '#ff6b6b',
            align: 'center'
          },
          {
            type: 'text',
            text: '期間限定で特別価格をご提供',
            size: 'md',
            color: '#666666',
            margin: 'md',
            align: 'center'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '通常価格',
                size: 'sm',
                color: '#999999',
                flex: 1
              },
              {
                type: 'text',
                text: '¥10,000',
                size: 'sm',
                color: '#999999',
                decoration: 'line-through'
              }
            ],
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'キャンペーン価格',
                size: 'md',
                weight: 'bold',
                color: '#ff6b6b',
                flex: 1
              },
              {
                type: 'text',
                text: '¥7,000',
                size: 'lg',
                weight: 'bold',
                color: '#ff6b6b'
              }
            ],
            margin: 'xs'
          }
        ],
        paddingAll: '20px',
        backgroundColor: '#ffffff'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '詳細を見る',
              uri: 'https://example.com/campaign'
            },
            style: 'primary',
            color: '#ff6b6b',
            height: 'sm'
          }
        ],
        paddingAll: '20px',
        backgroundColor: '#ffffff'
      }
    },
    previewImageUrl: '/images/templates/campaign_announcement.png',
    version: 1,
    isActive: true,
    usageCount: 567,
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:15:00Z'
  }
];

export const mockFlexComponents = [
  {
    id: 'component_1',
    name: '基本テキスト',
    componentType: 'text' as const,
    componentData: {
      type: 'text',
      text: 'テキスト',
      size: 'md',
      color: '#000000',
      weight: 'regular'
    },
    previewImageUrl: '/images/components/text_basic.png',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'component_2',
    name: '見出しテキスト',
    componentType: 'text' as const,
    componentData: {
      type: 'text',
      text: '見出し',
      size: 'xl',
      color: '#000000',
      weight: 'bold'
    },
    previewImageUrl: '/images/components/text_heading.png',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'component_3',
    name: '基本ボタン',
    componentType: 'button' as const,
    componentData: {
      type: 'button',
      action: {
        type: 'postback',
        label: 'ボタン',
        data: 'button_clicked'
      },
      style: 'primary',
      color: '#ffffff',
      height: 'sm'
    },
    previewImageUrl: '/images/components/button_primary.png',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'component_4',
    name: 'セカンダリボタン',
    componentType: 'button' as const,
    componentData: {
      type: 'button',
      action: {
        type: 'postback',
        label: 'ボタン',
        data: 'button_clicked'
      },
      style: 'secondary',
      color: '#666666',
      height: 'sm'
    },
    previewImageUrl: '/images/components/button_secondary.png',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'component_5',
    name: '基本ボックス',
    componentType: 'box' as const,
    componentData: {
      type: 'box',
      layout: 'vertical',
      contents: [],
      paddingAll: 'md',
      backgroundColor: '#ffffff'
    },
    previewImageUrl: '/images/components/box_basic.png',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'component_6',
    name: '水平ボックス',
    componentType: 'box' as const,
    componentData: {
      type: 'box',
      layout: 'horizontal',
      contents: [],
      paddingAll: 'md',
      backgroundColor: '#ffffff'
    },
    previewImageUrl: '/images/components/box_horizontal.png',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
];

export const mockFlexAssets = [
  {
    id: 'asset_1',
    assetType: 'image' as const,
    fileName: 'service-hero.jpg',
    filePath: '/uploads/images/service-hero.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    width: 1200,
    height: 630,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'asset_2',
    assetType: 'image' as const,
    fileName: 'campaign-banner.png',
    filePath: '/uploads/images/campaign-banner.png',
    fileSize: 512000,
    mimeType: 'image/png',
    width: 800,
    height: 400,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'asset_3',
    assetType: 'icon' as const,
    fileName: 'calendar-icon.svg',
    filePath: '/uploads/icons/calendar-icon.svg',
    fileSize: 2048,
    mimeType: 'image/svg+xml',
    width: 24,
    height: 24,
    createdAt: '2024-01-15T10:00:00Z'
  }
];

// デフォルトのFlexメッセージ
export const defaultFlexMessage: FlexMessage = {
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

// カテゴリ一覧
export const templateCategories = [
  '案内',
  '確認',
  'キャンペーン',
  'お知らせ',
  'リマインド',
  'その他'
];

// コンポーネントタイプ一覧
export const componentTypes = [
  { value: 'box', label: 'ボックス', icon: '📦' },
  { value: 'text', label: 'テキスト', icon: '📝' },
  { value: 'image', label: '画像', icon: '🖼️' },
  { value: 'button', label: 'ボタン', icon: '🔘' },
  { value: 'icon', label: 'アイコン', icon: '🎨' },
  { value: 'separator', label: 'セパレータ', icon: '➖' }
];

// サイズ一覧
export const sizeOptions = [
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'MD' },
  { value: 'lg', label: 'LG' },
  { value: 'xl', label: 'XL' },
  { value: 'xxl', label: 'XXL' },
  { value: '3xl', label: '3XL' },
  { value: '4xl', label: '4XL' },
  { value: '5xl', label: '5XL' },
  { value: 'full', label: 'FULL' }
];

// 色のプリセット
export const colorPresets = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc',
  '#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3',
  '#ff9f43', '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7'
];

// アクションタイプ一覧
export const actionTypes = [
  { value: 'postback', label: 'Postback' },
  { value: 'message', label: 'メッセージ' },
  { value: 'uri', label: 'URI' },
  { value: 'datetimepicker', label: '日時選択' },
  { value: 'camera', label: 'カメラ' },
  { value: 'cameraRoll', label: 'カメラロール' },
  { value: 'location', label: '位置情報' }
];

// レイアウト一覧
export const layoutOptions = [
  { value: 'horizontal', label: '水平' },
  { value: 'vertical', label: '垂直' },
  { value: 'baseline', label: 'ベースライン' }
];

// アスペクト比一覧
export const aspectRatioOptions = [
  { value: '1:1', label: '1:1 (正方形)' },
  { value: '1.51:1', label: '1.51:1' },
  { value: '1.91:1', label: '1.91:1' },
  { value: '4:3', label: '4:3' },
  { value: '16:9', label: '16:9' },
  { value: '20:13', label: '20:13' },
  { value: '2:1', label: '2:1' },
  { value: '3:1', label: '3:1' },
  { value: '4:1', label: '4:1' },
  { value: '9:16', label: '9:16' },
  { value: '1:2', label: '1:2' },
  { value: '1:3', label: '1:3' },
  { value: '1:4', label: '1:4' }
];
