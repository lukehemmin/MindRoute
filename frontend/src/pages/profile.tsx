import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useMutation } from '@tanstack/react-query';
import { userApi } from '@/services/api';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon
} from '@mui/icons-material';

export default function ProfilePage() {
  const { user, isLoading: authLoading, isAuthenticated, updateUserInfo } = useAuth();
  const router = useRouter();

  // 상태 관리
  const [name, setName] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 사용자 정보 업데이트 뮤테이션
  const updateProfileMutation = useMutation(
    (data: any) => userApi.updateProfile(data),
    {
      onSuccess: (data) => {
        updateUserInfo(data);
        setSnackbar({
          open: true,
          message: '프로필이 성공적으로 업데이트되었습니다.',
          severity: 'success'
        });
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || '프로필 업데이트 중 오류가 발생했습니다.',
          severity: 'error'
        });
      }
    }
  );

  // 비밀번호 변경 뮤테이션
  const changePasswordMutation = useMutation(
    (data: any) => userApi.changePassword(data),
    {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: '비밀번호가 성공적으로 변경되었습니다.',
          severity: 'success'
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || '비밀번호 변경 중 오류가 발생했습니다.',
          severity: 'error'
        });
      }
    }
  );

  // 프로필 업데이트 핸들러
  const handleProfileUpdate = () => {
    updateProfileMutation.mutate({ name });
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      setSnackbar({
        open: true,
        message: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
        severity: 'error'
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    });
  };

  // 스낵바 닫기 핸들러
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 인증 확인
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 사용자 데이터 로드
  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  // 비밀번호 유효성 검사
  const passwordRequirements = [
    { 
      text: "8자 이상", 
      valid: newPassword.length >= 8 
    },
    { 
      text: "영문 대/소문자 포함", 
      valid: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)
    },
    { 
      text: "숫자 포함", 
      valid: /\d/.test(newPassword)
    },
    { 
      text: "비밀번호 일치", 
      valid: newPassword === confirmPassword && newPassword !== ''
    }
  ];

  if (authLoading || !isAuthenticated || !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          내 프로필
        </Typography>
        <Typography variant="body1" color="text.secondary">
          개인 계정 정보 관리 및 비밀번호 변경
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem'
                }}
              >
                {user.name.charAt(0)}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Chip 
                label={user.role?.name === 'admin' ? '관리자' : '사용자'} 
                color={user.role?.name === 'admin' ? 'secondary' : 'primary'}
                sx={{ mt: 1 }}
              />

              <Divider sx={{ width: '100%', my: 3 }} />

              <List sx={{ width: '100%' }}>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="이름"
                    secondary={user.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="이메일"
                    secondary={user.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BadgeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="역할"
                    secondary={user.role?.name === 'admin' ? '관리자' : '사용자'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="계정 생성일"
                    secondary={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '정보 없음'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              프로필 정보 수정
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="이름"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="이메일"
                  fullWidth
                  value={user.email}
                  disabled
                  helperText="이메일은 변경할 수 없습니다"
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleProfileUpdate}
                    disabled={updateProfileMutation.isLoading || !name.trim() || name === user.name}
                  >
                    {updateProfileMutation.isLoading ? <CircularProgress size={24} /> : '저장'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <SecurityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                비밀번호 변경
              </Typography>
            </Box>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="현재 비밀번호"
                  fullWidth
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="새 비밀번호"
                  fullWidth
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="새 비밀번호 확인"
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    비밀번호 요구사항
                  </Typography>
                  <Grid container spacing={1}>
                    {passwordRequirements.map((req, index) => (
                      <Grid item xs={6} key={index}>
                        <Box display="flex" alignItems="center">
                          <CheckIcon 
                            fontSize="small" 
                            color={req.valid ? "success" : "disabled"}
                            sx={{ mr: 1 }}
                          />
                          <Typography 
                            variant="body2"
                            color={req.valid ? "textPrimary" : "textSecondary"}
                          >
                            {req.text}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePasswordChange}
                    disabled={
                      changePasswordMutation.isLoading || 
                      !currentPassword || 
                      !newPassword || 
                      !confirmPassword ||
                      newPassword !== confirmPassword ||
                      newPassword.length < 8
                    }
                  >
                    {changePasswordMutation.isLoading ? <CircularProgress size={24} /> : '비밀번호 변경'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* 알림 메시지 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
