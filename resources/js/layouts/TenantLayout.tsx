import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  CalendarMonth,
  Settings,
  Description,
  Schedule,
  EventAvailable,
  Logout,
  AdminPanelSettings,
  Person,
  TrendingUp,
  People,
  LocalOffer,
  Assignment,
  PersonAdd,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;

interface TenantLayoutProps {
  children: React.ReactNode;
}

const TenantLayout: React.FC<TenantLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  // Admin用メニュー
  const adminMenuItems = [
    { text: 'カレンダー一覧', icon: <CalendarMonth />, path: '/calendars' },
    { text: '予約管理', icon: <Assignment />, path: '/reservations' },
    { text: 'LINE連携設定', icon: <Settings />, path: '/line-settings' },
    { text: 'ヒアリングフォーム', icon: <Description />, path: '/hearing-forms' },
    { text: '流入経路分析', icon: <TrendingUp />, path: '/inflow-analysis' },
    { text: 'ユーザー管理', icon: <People />, path: '/user-management' },
    { text: 'タグ管理', icon: <LocalOffer />, path: '/tag-management' },
    { text: 'ユーザー招待', icon: <PersonAdd />, path: '/user-invitations' },
  ];

  // User用メニュー
  const userMenuItems = [
    { text: 'Googleカレンダー連携', icon: <CalendarMonth />, path: '/google-calendar' },
    { text: '休日・受付時間設定', icon: <Schedule />, path: '/availability' },
    { text: '予定確認', icon: <EventAvailable />, path: '/reservations' },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : userMenuItems;

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: [1],
          py: 2,
        }}
      >
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Cal Connect
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* ユーザー情報 */}
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {user?.role === 'admin' ? (
            <AdminPanelSettings sx={{ mr: 1, color: 'primary.main' }} />
          ) : (
            <Person sx={{ mr: 1, color: 'primary.main' }} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {user?.role === 'admin' ? '管理者' : 'ユーザー'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
          {user?.email}
        </Typography>
      </Box>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Cal Connect'}
          </Typography>
          <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.name?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>ログアウト</ListItemText>
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default TenantLayout;

