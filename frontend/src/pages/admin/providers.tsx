import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
  Chip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Badge,
  InputAdornment,
  DialogContentText
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, providerApi } from '@/services/api';

export default function AdminProvidersPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 상태 관리
  const [tabValue, setTabValue] = useState(0);
  const [providerType, setProviderType] = useState<string>('');
  const [providerName, setProviderName] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [testDialogOpen, setTestDialogOpen] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 프로바이더 목록 조회
  const {
    data: providers = [],
    isLoading: providersLoading
  } = useQuery(['admin-providers'], providerApi.getAllProviders, {
    enabled: isAuthenticated && user?.role?.name === 'admin'
  });

  // 프로바이더 생성 뮤테이션
  const createMutation = useMutation(
    (data: any) => adminApi.registerProvider(data),
    {
      onSuccess: () => {
        setCreateDialogOpen(false);
        queryClient.invalidateQueries(['admin-providers']);
        setSnackbar({ open: true, message: '프로바이더가 성공적으로 등록되었습니다.', severity: 'success' });
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || '프로바이더 등록 중 오류가 발생했습니다.');
      }
    }
  );

  // 프로바이더 업데이트 뮤테이션
  const updateMutation = useMutation(
    (data: any) => adminApi.updateProvider(data),
    {
      onSuccess: () => {
        setEditDialogOpen(false);
        queryClient.invalidateQueries(['admin-providers']);
        setSnackbar({ open: true, message: '프로바이더가 성공적으로 업데이트되었습니다.', severity: 'success' });
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || '프로바이더 업데이트 중 오류가 발생했습니다.');
      }
    }
  );

  // 프로바이더 삭제 뮤테이션
  const deleteMutation = useMutation(
    (name: string) => adminApi.deleteProvider(name),
    {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        queryClient.invalidateQueries(['admin-providers']);
        setSnackbar({ open: true, message: '프로바이더가 성공적으로 비활성화되었습니다.', severity: 'success' });
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || '프로바이더 비활성화 중 오류가 발생했습니다.');
      }
    }
  );

  // 프로바이더 테스트 뮤테이션
  const testMutation = useMutation(
    (name: string) => adminApi.testProvider(name),
    {
      onSuccess: () => {
        setTestDialogOpen(false);
        setSnackbar({ open: true, message: '프로바이더 연결 테스트가 성공적으로 완료되었습니다.', severity: 'success' });
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || '프로바이더 연결 테스트 중 오류가 발생했습니다.');
      }
    }
  );

  // 인증 및 권한 확인
  React.useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role?.name !== 'admin') {
        router.push('/'); // 관리자가 아니면 메인으로 리디렉션
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // 프로바이더 유형 변경 핸들러
  const handleProviderTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const type = event.target.value as string;
    setProviderType(type);

    // 기본값 설정
    if (type === 'openai') {
      setProviderName('openai');
      setDisplayName('OpenAI');
      setBaseUrl('https://api.openai.com/v1');
    } else if (type === 'anthropic') {
      setProviderName('anthropic');
      setDisplayName('Anthropic Claude');
      setBaseUrl('https://api.anthropic.com');
    } else if (type === 'google') {
      setProviderName('google');
      setDisplayName('Google Gemini');
      setBaseUrl('');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 로딩 중 표시
  if (authLoading || !isAuthenticated || user?.role?.name !== 'admin') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">프로바이더 관리</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          새 프로바이더 추가
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="프로바이더 탭"
        >
          <Tab label="전체 프로바이더" />
          <Tab
            label={
              <Badge
                color="success"
                badgeContent={providers.filter((p: any) => p.isActive).length}
                showZero
              >
                활성 프로바이더
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                color="error"
                badgeContent={providers.filter((p: any) => !p.isActive).length}
                showZero
              >
                비활성 프로바이더
              </Badge>
            }
          />
        </Tabs>
        
        {/* 프로바이더 목록 테이블 구현 */}
        <Box sx={{ p: 2 }}>
          {providersLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : providers.length === 0 ? (
            <Alert severity="info">
              등록된 프로바이더가 없습니다. 새 프로바이더를 추가해 보세요.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {providers
                .filter((p: any) => {
                  // 탭에 따른 필터링
                  if (tabValue === 1) return p.isActive;
                  if (tabValue === 2) return !p.isActive;
                  return true;
                })
                .map((provider: any) => (
                  <Grid item xs={12} md={6} lg={4} key={provider.id || provider.name}>
                    <Card variant="outlined" sx={{
                      height: '100%',
                      opacity: provider.isActive ? 1 : 0.7,
                      position: 'relative'
                    }}>
                      {!provider.isActive && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            bgcolor: 'error.main',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            zIndex: 1
                          }}
                        >
                          비활성
                        </Box>
                      )}
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" component="div">
                            {provider.displayName}
                          </Typography>
                          <Chip
                            size="small"
                            label={provider.name}
                            color="primary"
                            variant="outlined"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>API 베이스 URL:</strong> {provider.baseUrl || '기본값'}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>모델 수:</strong> {provider.models?.length || 0}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          <strong>마지막 업데이트:</strong> {provider.updatedAt ? 
                            new Date(provider.updatedAt).toLocaleString() : '없음'}
                        </Typography>
                        
                        {provider.isActive && (
                          <Box mt={2}>
                            <Chip 
                              size="small"
                              color="success"
                              label="활성"
                              sx={{ mr: 1 }}
                            />
                          </Box>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<RefreshIcon />}
                          onClick={() => {
                            setProviderName(provider.name);
                            setDisplayName(provider.displayName);
                            setTestDialogOpen(true);
                          }}
                          disabled={!provider.isActive}
                        >
                          테스트
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setProviderName(provider.name);
                            setDisplayName(provider.displayName || '');
                            setBaseUrl(provider.baseUrl || '');
                            setOrganization(provider.organization || '');
                            setApiKey('');
                            setEditDialogOpen(true);
                          }}
                        >
                          편집
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => {
                            setProviderName(provider.name);
                            setDisplayName(provider.displayName);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          {provider.isActive ? '비활성화' : '삭제'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              }
            </Grid>
          )}
        </Box>
      </Paper>

      {/* 새 프로바이더 추가 대화상자 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 프로바이더 추가</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>프로바이더 유형</InputLabel>
            <Select
              value={providerType}
              onChange={(e: any) => handleProviderTypeChange(e)}
              label="프로바이더 유형"
            >
              <MenuItem value="">선택하세요</MenuItem>
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="anthropic">Anthropic Claude</MenuItem>
              <MenuItem value="google">Google Gemini</MenuItem>
              <MenuItem value="custom">직접 입력</MenuItem>
            </Select>
          </FormControl>

          {providerType && (
            <>
              <TextField
                margin="normal"
                fullWidth
                label="API 키"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowApiKey(!showApiKey)}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {providerType === 'custom' && (
                <TextField
                  margin="normal"
                  fullWidth
                  label="프로바이더 이름"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  required
                />
              )}

              <TextField
                margin="normal"
                fullWidth
                label="표시 이름"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />

              {providerType === 'openai' && (
                <TextField
                  margin="normal"
                  fullWidth
                  label="조직 ID (선택사항)"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              )}

              <TextField
                margin="normal"
                fullWidth
                label="API 베이스 URL (선택사항)"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                helperText="기본값 사용시 비워두세요"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              createMutation.mutate({
                name: providerName || providerType,
                displayName: displayName || (providerName ? providerName : ''),
                apiKey,
                organization,
                baseUrl: baseUrl || undefined
              });
            }}
            disabled={!providerType || !apiKey || createMutation.isLoading}
          >
            {createMutation.isLoading ? <CircularProgress size={24} /> : '등록'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프로바이더 편집 대화상자 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>프로바이더 설정 편집</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="프로바이더 이름"
            value={providerName}
            disabled
          />
          <TextField
            margin="normal"
            fullWidth
            label="표시 이름"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label="API 키"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            helperText="변경하지 않으려면 비워두세요"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowApiKey(!showApiKey)}
                    edge="end"
                  >
                    {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {providerName === 'openai' && (
            <TextField
              margin="normal"
              fullWidth
              label="조직 ID (선택사항)"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          )}
          <TextField
            margin="normal"
            fullWidth
            label="API 베이스 URL (선택사항)"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            helperText="기본값 사용시 비워두세요"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              updateMutation.mutate({
                name: providerName,
                displayName: displayName,
                apiKey: apiKey || undefined,
                organization: organization || undefined,
                baseUrl: baseUrl || undefined
              });
            }}
            disabled={updateMutation.isLoading}
          >
            {updateMutation.isLoading ? <CircularProgress size={24} /> : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프로바이더 삭제 대화상자 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>프로바이더 비활성화</DialogTitle>
        <DialogContent>
          <DialogContentText>
            '{displayName}' 프로바이더를 비활성화하시겠습니까?
            이 작업을 수행하면 이 프로바이더를 사용하는 모든 API 호출이 중지됩니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              deleteMutation.mutate(providerName);
            }}
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? <CircularProgress size={24} /> : '비활성화'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프로바이더 테스트 대화상자 */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)}>
        <DialogTitle>프로바이더 연결 테스트</DialogTitle>
        <DialogContent>
          <DialogContentText>
            '{displayName}' 프로바이더의 연결 상태를 테스트합니다.
            이 작업은 API 키가 유효한지 확인하고 사용 가능한 모델 목록을 가져옵니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>취소</Button>
          <Button
            color="primary"
            variant="contained"
            onClick={() => {
              testMutation.mutate(providerName);
            }}
            disabled={testMutation.isLoading}
          >
            {testMutation.isLoading ? <CircularProgress size={24} /> : '테스트'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 스낵바 알림 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
