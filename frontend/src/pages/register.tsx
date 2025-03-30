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
  Avatar,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAdd as PersonAddIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon
} from '@mui/icons-material';

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // 상태 관리
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // 비밀번호 유효성 검사
  const passwordRequirements = [
    { 
      text: "8자 이상", 
      valid: password.length >= 8 
    },
    { 
      text: "영문 대/소문자 포함", 
      valid: /[a-z]/.test(password) && /[A-Z]/.test(password)
    },
    { 
      text: "숫자 포함", 
      valid: /\d/.test(password)
    },
    { 
      text: "비밀번호 일치", 
      valid: password === passwordConfirm && password !== ''
    }
  ];
  
  // 이메일 유효성 검사
  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 인증 상태 확인 (이미 로그인되어 있으면 대시보드로 리디렉션)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // 다음 단계로 이동
  const handleNextStep = () => {
    if (activeStep === 0) {
      if (!name.trim() || !email.trim()) {
        setRegisterError('이름과 이메일을 입력해주세요.');
        return;
      }
      
      if (!isEmailValid(email)) {
        setRegisterError('유효한 이메일 주소를 입력해주세요.');
        return;
      }
    }
    
    setRegisterError(null);
    setActiveStep((prev) => prev + 1);
  };

  // 회원가입 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    
    // 유효성 검사
    if (!name.trim() || !email.trim() || !password.trim()) {
      setRegisterError('모든 필수 항목을 입력해주세요.');
      return;
    }
    
    if (password !== passwordConfirm) {
      setRegisterError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (password.length < 8 || !(/[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password))) {
      setRegisterError('비밀번호는 8자 이상이어야 하며, 대소문자와 숫자를 포함해야 합니다.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await register(name, email, password);
      router.push('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      setRegisterError(error.response?.data?.message || '회원가입에 실패했습니다. 이미 사용 중인 이메일일 수 있습니다.');
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
    <Container maxWidth="sm">
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
              <PersonAddIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
              MindRoute AI 계정 만들기
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI Gateway 시스템 사용을 위한 새 계정을 만듭니다
            </Typography>
          </Box>
          
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            <Step>
              <StepLabel>기본 정보</StepLabel>
            </Step>
            <Step>
              <StepLabel>계정 보안</StepLabel>
            </Step>
          </Stepper>
          
          {registerError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {registerError}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            {activeStep === 0 ? (
              // 첫 번째 단계: 이름과 이메일
              <>
                <TextField
                  label="이름"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
                <TextField
                  label="이메일"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  error={email.length > 0 && !isEmailValid(email)}
                  helperText={email.length > 0 && !isEmailValid(email) ? '유효한 이메일 주소를 입력해주세요' : ''}
                />
                
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleNextStep}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ mt: 3, mb: 2, py: 1.2 }}
                >
                  다음
                </Button>
              </>
            ) : (
              // 두 번째 단계: 비밀번호
              <>
                <TextField
                  label="비밀번호"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
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
                
                <TextField
                  label="비밀번호 확인"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          edge="end"
                        >
                          {showPasswordConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    비밀번호 요구사항
                  </Typography>
                  <Stack spacing={1}>
                    {passwordRequirements.map((req, index) => (
                      <Box key={index} display="flex" alignItems="center">
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
                    ))}
                  </Stack>
                </Paper>
                
                <Box display="flex" gap={2} mt={3}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setActiveStep(0)}
                    sx={{ flexGrow: 1, py: 1.2 }}
                  >
                    이전
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={isSubmitting || !passwordRequirements.every(r => r.valid)}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                    sx={{ flexGrow: 1, py: 1.2 }}
                  >
                    {isSubmitting ? '처리 중...' : '계정 만들기'}
                  </Button>
                </Box>
              </>
            )}
          </form>
          
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              또는
            </Typography>
          </Divider>
          
          <Link href="/login" passHref style={{ textDecoration: 'none', width: '100%' }}>
            <Button
              fullWidth
              variant="text"
            >
              이미 계정이 있으신가요? 로그인
            </Button>
          </Link>
        </Paper>
      </Box>
    </Container>
  );
}
