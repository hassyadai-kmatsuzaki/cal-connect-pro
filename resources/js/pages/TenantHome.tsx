import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CalendarMonth,
  Settings,
  Description,
  Schedule,
  EventAvailable,
  Google,
  TrendingUp,
  People,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TenantLayout from '../layouts/TenantLayout';
import axios from 'axios';

interface QuickAccessCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

interface DashboardStats {
  this_month_reservations: number;
  this_month_new_customers: number;
  this_week_reservations: number;
  active_calendars: number;
}

const TenantHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const adminCards: QuickAccessCard[] = [
    {
      title: 'カレンダー一覧',
      description: 'Googleカレンダーとの連携管理',
      icon: <CalendarMonth sx={{ fontSize: 40 }} />,
      path: '/calendars',
      color: '#1976d2',
    },
    {
      title: 'LINE連携設定',
      description: 'LINE Botの設定と通知管理',
      icon: <Settings sx={{ fontSize: 40 }} />,
      path: '/line-settings',
      color: '#06c755',
    },
    {
      title: 'ヒアリングフォーム',
      description: '予約時のヒアリング項目設定',
      icon: <Description sx={{ fontSize: 40 }} />,
      path: '/hearing-forms',
      color: '#ff9800',
    },
  ];

  const userCards: QuickAccessCard[] = [
    {
      title: 'Googleカレンダー連携',
      description: 'カレンダーとの連携設定',
      icon: <Google sx={{ fontSize: 40 }} />,
      path: '/google-calendar',
      color: '#4285f4',
    },
    // {
    //   title: '休日・受付時間設定',
    //   description: '予約受付可能な時間帯の設定',
    //   icon: <Schedule sx={{ fontSize: 40 }} />,
    //   path: '/availability',
    //   color: '#9c27b0',
    // },
    // {
    //   title: '予定確認',
    //   description: '予約一覧と詳細の確認',
    //   icon: <EventAvailable sx={{ fontSize: 40 }} />,
    //   path: '/reservations',
    //   color: '#f50057',
    // },
  ];

  const cards = user?.role === 'admin' ? adminCards : userCards;

  // 統計データを取得（管理者のみ）
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // エラーの場合は0で初期化
      setStats({
        this_month_reservations: 0,
        this_month_new_customers: 0,
        this_week_reservations: 0,
        active_calendars: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TenantLayout>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          ダッシュボード
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          ようこそ、{user?.name || user?.email}さん
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          {user?.role === 'admin' 
            ? '管理者として、カレンダー管理、LINE連携、ヒアリングフォームの設定が可能です。'
            : 'Googleカレンダーと連携して、予約受付時間を管理できます。'}
        </Alert>

        {/* 統計情報カード */}
        {user?.role === 'admin' && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {loading ? (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              </Grid>
            ) : (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TrendingUp color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          今月の予約数
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats?.this_month_reservations ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <People color="success" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          新規顧客
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats?.this_month_new_customers ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EventAvailable color="warning" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          今週の予約
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats?.this_week_reservations ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarMonth color="error" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          連携カレンダー
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats?.active_calendars ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        )}

        {/* クイックアクセスカード */}
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
          クイックアクセス
        </Typography>
        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.path}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(card.path)}
                  sx={{ height: '100%', p: 3 }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        color: card.color,
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </TenantLayout>
  );
};

export default TenantHome;
