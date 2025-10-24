import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import {
  PhoneAndroid as MobileIcon,
  Computer as DesktopIcon,
  Tablet as TabletIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Fullscreen as FullscreenIcon,
  Screenshot as ScreenshotIcon,
  Share as ShareIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { FlexMessage } from '../../types/flexMessage';
import FlexComponentRenderer from './FlexComponentRenderer';

interface FlexPreviewProps {
  data: FlexMessage;
  device?: 'mobile' | 'desktop' | 'tablet';
  theme?: 'light' | 'dark';
  onClose?: () => void;
}

const FlexPreview: React.FC<FlexPreviewProps> = ({
  data,
  device: initialDevice = 'mobile',
  theme: initialTheme = 'light',
  onClose
}) => {
  const [device, setDevice] = useState<'mobile' | 'desktop' | 'tablet'>(initialDevice);
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // デバイスサイズの取得
  const getDeviceSize = useCallback(() => {
    switch (device) {
      case 'mobile':
        return { width: 375, height: 667 };
      case 'tablet':
        return { width: 768, height: 1024 };
      case 'desktop':
        return { width: 1200, height: 800 };
      default:
        return { width: 375, height: 667 };
    }
  }, [device]);

  // スクリーンショットの取得
  const handleScreenshot = useCallback(() => {
    // TODO: スクリーンショット機能の実装
    console.log('スクリーンショット機能は未実装です');
  }, []);

  // 共有機能
  const handleShare = useCallback(() => {
    // TODO: 共有機能の実装
    console.log('共有機能は未実装です');
  }, []);

  // フルスクリーンの切り替え
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const deviceSize = getDeviceSize();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Paper sx={{ p: 2, borderRadius: 0, boxShadow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h1">
            プレビュー
          </Typography>
          
          {onClose && (
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {/* コントロール */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          {/* デバイス選択 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="モバイル">
              <IconButton
                onClick={() => setDevice('mobile')}
                color={device === 'mobile' ? 'primary' : 'default'}
              >
                <MobileIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="タブレット">
              <IconButton
                onClick={() => setDevice('tablet')}
                color={device === 'tablet' ? 'primary' : 'default'}
              >
                <TabletIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="デスクトップ">
              <IconButton
                onClick={() => setDevice('desktop')}
                color={device === 'desktop' ? 'primary' : 'default'}
              >
                <DesktopIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* テーマ切り替え */}
          <FormControlLabel
            control={
              <Switch
                checked={theme === 'dark'}
                onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {theme === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
                {theme === 'dark' ? 'ダーク' : 'ライト'}
              </Box>
            }
          />

          <Divider orientation="vertical" flexItem />

          {/* アクション */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="フルスクリーン">
              <IconButton onClick={handleToggleFullscreen}>
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="スクリーンショット">
              <IconButton onClick={handleScreenshot}>
                <ScreenshotIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="共有">
              <IconButton onClick={handleShare}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* プレビューエリア */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          overflow: 'auto',
          backgroundColor: theme === 'dark' ? '#121212' : '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.3s',
        }}
      >
        {/* デバイスフレーム */}
        <Box
          sx={{
            width: isFullscreen ? '100%' : Math.min(deviceSize.width, 400),
            height: isFullscreen ? '100%' : Math.min(deviceSize.height * 0.8, 600),
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            borderRadius: isFullscreen ? 0 : 3,
            boxShadow: isFullscreen ? 'none' : 3,
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.3s',
          }}
        >
          {/* デバイス情報 */}
          {!isFullscreen && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
              }}
            >
              <Chip
                label={`${deviceSize.width} × ${deviceSize.height}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          )}

          {/* LINEアプリ風のヘッダー */}
          <Box
            sx={{
              height: 60,
              backgroundColor: theme === 'dark' ? '#2c2c2c' : '#00c851',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            LINE
          </Box>

          {/* メッセージエリア */}
          <Box
            sx={{
              height: 'calc(100% - 60px)',
              overflow: 'auto',
              backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f0f0f0',
              padding: 2,
            }}
          >
            {/* Flexメッセージ */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                mb: 2,
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  maxWidth: '80%',
                  borderRadius: 3,
                  overflow: 'hidden',
                  backgroundColor: theme === 'dark' ? '#2c2c2c' : '#ffffff',
                }}
              >
                {/* Bubble */}
                <Box
                  sx={{
                    backgroundColor: theme === 'dark' ? '#2c2c2c' : '#ffffff',
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
                    >
                      <FlexComponentRenderer
                        component={data.header}
                        isSelected={false}
                      />
                    </Box>
                  )}

                  {/* Hero */}
                  {data.hero && (
                    <Box>
                      <FlexComponentRenderer
                        component={data.hero}
                        isSelected={false}
                      />
                    </Box>
                  )}

                  {/* Body */}
                  {data.body && (
                    <Box sx={{ p: 2 }}>
                      <FlexComponentRenderer
                        component={data.body}
                        isSelected={false}
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
                    >
                      <FlexComponentRenderer
                        component={data.footer}
                        isSelected={false}
                      />
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>

            {/* 時刻表示 */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                mb: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: theme === 'dark' ? '#999999' : '#666666',
                  fontSize: '0.75rem',
                }}
              >
                午後2:30
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* フッター情報 */}
      {!isFullscreen && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {device === 'mobile' && 'モバイル表示'}
              {device === 'tablet' && 'タブレット表示'}
              {device === 'desktop' && 'デスクトップ表示'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              {theme === 'light' && 'ライトテーマ'}
              {theme === 'dark' && 'ダークテーマ'}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FlexPreview;
