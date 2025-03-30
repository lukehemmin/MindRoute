import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Stack,
  Avatar
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // 상태 관리
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 인증 상태 확인 (이미 로그인되어 있으면 대시보드로 리디렉션)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // 로그인 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    // 유효성 검사
    if (!email.trim() || !password.trim()) {
      setLoginError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await login(email, password);
      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.response?.data?.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중 표시
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mb: 2 }}>
              <VpnKeyIcon fontSize="large" />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              MindRoute AI
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              AI Gateway 시스템에 로그인
            </Typography>
          </Box>
          
          {loginError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {loginError}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="이메일"
              fullWidth
              margin="normal"
              variant="outlined"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
              disabled={isSubmitting}
            />
            <TextField
              label="비밀번호"
              fullWidth
              margin="normal"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{ mt: 3, mb: 2, py: 1.2 }}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </Button>
          </form>
          
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              또는
            </Typography>
          </Divider>
          
          <Stack direction="column" spacing={2}>
            <Link href="/register" passHref style={{ textDecoration: 'none', width: '100%' }}>
              <Button
                fullWidth
                variant="outlined"
              >
                계정 만들기
              </Button>
            </Link>
            
            <Typography variant="body2" color="text.secondary" align="center">
              <Link href="/forgot-password" passHref style={{ color: 'inherit' }}>
                비밀번호를 잊으셨나요?
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
