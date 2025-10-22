import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Logout as LogoutIcon,
  Business as BusinessIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import type { Tenant, CreateTenantRequest } from '../types';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateTenantRequest>({
    company_name: '',
    subdomain: '',
    plan: 'free',
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await axios.get('/api/central/tenants');
      setTenants(response.data.tenants);
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ company_name: '', subdomain: '', plan: 'free' });
    setError('');
  };

  const handleCreateTenant = async () => {
    setError('');
    
    try {
      const response = await axios.post('/api/central/tenants', formData);
      setTenants([...tenants, response.data.tenant]);
      handleCloseDialog();
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const errorMessages = Object.values(errors).flat().join('\n');
        setError(errorMessages as string);
      } else {
        setError(err.response?.data?.message || 'テナントの作成に失敗しました');
      }
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return 'default';
      case 'basic':
        return 'primary';
      case 'premium':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'free':
        return '無料プラン';
      case 'basic':
        return 'ベーシック';
      case 'premium':
        return 'プレミアム';
      default:
        return plan;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <BusinessIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cal Connect - ダッシュボード
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.name}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            テナント一覧
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            size="large"
          >
            新規テナント作成
          </Button>
        </Box>

        {loading ? (
          <Typography>読み込み中...</Typography>
        ) : tenants.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              テナントがまだありません
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              新規テナントを作成して、LINE予約サービスを始めましょう
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
              テナントを作成
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {tenants.map((tenant) => (
              <Grid item xs={12} sm={6} md={4} key={tenant.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      {tenant.company_name}
                    </Typography>
                    <Chip 
                      label={getPlanLabel(tenant.plan)} 
                      color={getPlanColor(tenant.plan) as any}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    {tenant.domains && tenant.domains.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        {tenant.domains[0].domain}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      endIcon={<OpenInNewIcon />}
                      onClick={() => {
                        if (tenant.domains && tenant.domains.length > 0) {
                          window.open(`http://${tenant.domains[0].domain}:8230`, '_blank');
                        }
                      }}
                    >
                      開く
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>新規テナント作成</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} style={{ whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="会社名"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="サブドメイン"
            value={formData.subdomain}
            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
            margin="normal"
            required
            helperText="例: mycompany （mycompany.localhost でアクセス可能になります）"
          />
          <TextField
            fullWidth
            select
            label="プラン"
            value={formData.plan}
            onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
            margin="normal"
          >
            <MenuItem value="free">無料プラン</MenuItem>
            <MenuItem value="basic">ベーシック</MenuItem>
            <MenuItem value="premium">プレミアム</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleCreateTenant} variant="contained">
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;

