import React from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import TenantLayout from '../../layouts/TenantLayout';
import FlexEditor from '../../components/FlexEditor/FlexEditor';
import { createDefaultFlexMessage } from '../../utils/flexMessageUtils';

const FlexEditorPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = (data: any) => {
    console.log('Flexメッセージを保存:', data);
    // TODO: サーバーに保存する処理
  };

  const handleClose = () => {
    navigate('/calendars');
  };

  return (
    <TenantLayout>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* ヘッダー */}
        <Paper sx={{ p: 2, borderRadius: 0, boxShadow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleClose}
              variant="outlined"
            >
              戻る
            </Button>
            <Typography variant="h5" component="h1">
              Flexメッセージエディタ
            </Typography>
          </Box>
        </Paper>

        {/* エディタ */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <FlexEditor
            initialData={createDefaultFlexMessage()}
            onSave={handleSave}
            onClose={handleClose}
          />
        </Box>
      </Box>
    </TenantLayout>
  );
};

export default FlexEditorPage;
