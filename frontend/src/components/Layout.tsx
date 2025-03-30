import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  CloudQueue as CloudIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Code as CodeIcon,
  ExpandLess,
  ExpandMore,
  Key as KeyIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  SupervisorAccount as AdminIcon,
  Paid as PaidIcon,
  Extension as ExtensionIcon
} from '@mui/icons-material';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(true);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(true);
  
  const isAdmin = user?.role?.name === 'admin';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    router.push('/login');
  };

  const profileOpen = Boolean(anchorEl);

  const menuItems = [
    {
      text: '플레이그라운드',
      icon: <CodeIcon />,
      path: '/playground',
      show: isAuthenticated
    },
    {
      text: '대시보드',
      icon: <DashboardIcon />,
      path: '/',
      show: isAuthenticated
    },
    {
      text: 'API 키 관리',
      icon: <KeyIcon />,
      path: '/api-keys',
      show: isAuthenticated
    },
    {
      text: '사용량 통계',
      icon: <AnalyticsIcon />,
      path: '/usage',
      show: isAuthenticated
    },
    {
      text: '사용 로그',
      icon: <HistoryIcon />,
      path: '/logs',
      show: isAuthenticated
    }
  ];

  const adminMenuItems = [
    {
      text: '관리자 대시보드',
      icon: <AdminIcon />,
      path: '/admin/dashboard',
      show: isAuthenticated && isAdmin
    },
    {
      text: '프로바이더 관리',
      icon: <CloudIcon />,
      path: '/admin/providers',
      show: isAuthenticated && isAdmin
    },
    {
      text: '사용자 관리',
      icon: <PersonIcon />,
      path: '/admin/users',
      show: isAuthenticated && isAdmin
    },
    {
      text: '사용 로그',
      icon: <HistoryIcon />,
      path: '/admin/logs',
      show: isAuthenticated && isAdmin
    },
    {
      text: '설정',
      icon: <SettingsIcon />,
      path: '/admin/settings',
      show: isAuthenticated && isAdmin
    }
  ];

  const settingsMenuItems = [
    {
      text: '내 프로필',
      icon: <PersonIcon />,
      path: '/profile',
      show: isAuthenticated
    },
    {
      text: 'API 키 설정',
      icon: <SecurityIcon />,
      path: '/api-keys',
      show: isAuthenticated
    }
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
          MindRoute AI
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          item.show && (
            <ListItem key={item.text} disablePadding>
              <Link href={item.path} passHref style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
                <ListItemButton selected={router.pathname === item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </Link>
            </ListItem>
          )
        ))}
      </List>
      
      {isAdmin && (
        <>
          <Divider />
          <ListItem>
            <ListItemButton onClick={() => setAdminMenuOpen(!adminMenuOpen)}>
              <ListItemIcon>
                <AdminIcon />
              </ListItemIcon>
              <ListItemText primary="관리자 메뉴" />
              {adminMenuOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={adminMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {adminMenuItems.map((item) => (
                item.show && (
                  <ListItem key={item.text} disablePadding>
                    <Link href={item.path} passHref style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
                      <ListItemButton selected={router.pathname === item.path} sx={{ pl: 4 }}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                )
              ))}
            </List>
          </Collapse>
        </>
      )}

      <Divider />
      <ListItem>
        <ListItemButton onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="설정" />
          {settingsMenuOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
      </ListItem>
      <Collapse in={settingsMenuOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {settingsMenuItems.map((item) => (
            item.show && (
              <ListItem key={item.text} disablePadding>
                <Link href={item.path} passHref style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
                  <ListItemButton selected={router.pathname === item.path} sx={{ pl: 4 }}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </Link>
              </ListItem>
            )
          ))}
        </List>
      </Collapse>
    </div>
  );

  // 인증이 필요 없는 페이지에서는 레이아웃을 적용하지 않음
  const noLayoutPages = ['/login', '/register'];
  if (noLayoutPages.includes(router.pathname) || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            MindRoute AI Gateway
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="내 계정">
              <IconButton
                onClick={handleProfileMenuOpen}
                size="small"
                edge="end"
                aria-label="계정 메뉴"
                aria-controls={profileOpen ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={profileOpen ? 'true' : undefined}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={profileOpen}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <Typography variant="body2" fontWeight="bold">
            {user?.name}
          </Typography>
        </MenuItem>
        <Divider />
        <Link href="/profile" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <MenuItem onClick={handleProfileMenuClose}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            내 프로필
          </MenuItem>
        </Link>
        <Link href="/api-keys" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <MenuItem onClick={handleProfileMenuClose}>
            <ListItemIcon>
              <KeyIcon fontSize="small" />
            </ListItemIcon>
            API 키 관리
          </MenuItem>
        </Link>
        {isAdmin && (
          <Link href="/admin/dashboard" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AdminIcon fontSize="small" />
              </ListItemIcon>
              관리자 대시보드
            </MenuItem>
          </Link>
        )}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          로그아웃
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="메뉴"
      >
        {/* 모바일 서랍 */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* 데스크톱 서랍 */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          mt: '64px'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
