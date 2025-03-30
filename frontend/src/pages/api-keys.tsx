import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/api';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Tooltip,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon,
  Key as KeyIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function ApiKeysPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 상태 관리
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [copySuccessDialog, setCopySuccessDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [keyName, setKeyName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [newKeyInfo, setNewKeyInfo] = useState<any>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 인증 확인
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // API 키 목록 조회
  const {
    data: apiKeys = [],
    isLoading: apiKeysLoading,
    error: apiKeysError,
    refetch: refetchApiKeys
  } = useQuery(['user-api-keys'], userApi.getApiKeys, {
    enabled: isAuthenticated
  });

  // API 키 생성 뮤테이션
  const createMutation = useMutation(
    (data: any) => userApi.createApiKey(data),
    {
      onSuccess: (data) => {
        setNewKeyInfo(data);
        setShowTokenDialog(true);
        setCreateDialog(false);
        setKeyName('');
        setExpiryDate('');
        refetchApiKeys();
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'API 키 생성 중 오류가 발생했습니다.',
          severity: 'error'
        });
      }
    }
  );

  // API 키 상태 변경 뮤테이션
  const updateMutation = useMutation(
    ({ keyId, isActive }: { keyId: string, isActive: boolean }) => 
      userApi.updateApiKey(keyId, isActive),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user-api-keys']);
        setSnackbar({
          open: true,
          message: '키 상태가 변경되었습니다.',
          severity: 'success'
        });
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'API 키 상태 변경 중 오류가 발생했습니다.',
          severity: 'error'
        });
      }
    }
  );

  // API 키 삭제 뮤테이션
  const deleteMutation = useMutation(
    (keyId: string) => userApi.deleteApiKey(keyId),
    {
      onSuccess: () => {
        setDeleteDialog(false);
        queryClient.invalidateQueries(['user-api-keys']);
        setSnackbar({
          open: true,
          message: 'API 키가 삭제되었습니다.',
          severity: 'success'
        });
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'API 키 삭제 중 오류가 발생했습니다.',
          severity: 'error'
        });
      }
    }
  );

  // API 키 생성 핸들러
  const handleCreateKey = () => {
    if (!keyName.trim()) {
      setSnackbar({
        open: true,
        message: '키 이름을 입력해주세요.',
        severity: 'error'
      });
      return;
    }

    createMutation.mutate({
      name: keyName,
      expiresAt: expiryDate || undefined
    });
  };

  // 키 복사 핸들러
  const handleCopyKey = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopySuccessDialog(true);
  };

  // 스낵바 닫기 핸들러
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 로딩 중 표시
  if (authLoading || !isAuthenticated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // 활성/만료 API 키 분류
  const activeKeys = apiKeys.filter((key: any) => key.isActive);
  const inactiveKeys = apiKeys.filter((key: any) => !key.isActive);

  return (
    <Container maxWidth="lg">
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" gutterBottom>
            API 키 관리
          </Typography>
          <Typography variant="body1" color="text.secondary">
            애플리케이션에서 AI API에 접근하기 위한 키 관리
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog(true)}
        >
          새 API 키 생성
        </Button>
      </Box>

      {apiKeysError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          API 키 목록을 불러오는 중 오류가 발생했습니다.
        </Alert>
      )}

      {/* API 키 사용 안내 */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          API 키 사용 방법
        </Typography>
        <Typography variant="body2" paragraph>
          AI 게이트웨이 API를 호출할 때 다음과 같은 방법으로 키를 사용할 수 있습니다:
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                1. HTTP 헤더 사용 (권장)
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'auto' }}>
                X-API-Key: YOUR_API_KEY
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                2. 요청 본문에 포함
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'auto' }}>
                {`{ "apiKey": "YOUR_API_KEY", ... }`}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                3. 쿼리 파라미터로 전달
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'auto' }}>
                ?apiKey=YOUR_API_KEY
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* API 키 목록 */}
      <Paper variant="outlined" sx={{ mb: 4 }}>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" gutterBottom>
            내 API 키
          </Typography>
        </Box>

        {apiKeysLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : apiKeys.length === 0 ? (
          <Box p={4} textAlign="center">
            <KeyIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              아직 생성된 API 키가 없습니다.
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              애플리케이션에서 API를 호출하려면 새 키를 생성하세요.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialog(true)}
              sx={{ mt: 2 }}
            >
              새 API 키 생성
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>이름</TableCell>
                  <TableCell>키 ID</TableCell>
                  <TableCell>생성일</TableCell>
                  <TableCell>만료일</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell align="right">작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys.map((apiKey: any) => (
                  <TableRow key={apiKey.id}>
                    <TableCell>{apiKey.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {apiKey.id.substring(0, 12)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {apiKey.createdAt && format(new Date(apiKey.createdAt), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell>
                      {apiKey.expiresAt ? (
                        format(new Date(apiKey.expiresAt), 'yyyy-MM-dd')
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          만료 없음
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={apiKey.isActive}
                            onChange={() => updateMutation.mutate({
                              keyId: apiKey.id,
                              isActive: !apiKey.isActive
                            })}
                            color={apiKey.isActive ? "success" : "default"}
                          />
                        }
                        label={
                          <Chip
                            size="small"
                            label={apiKey.isActive ? "활성" : "비활성"}
                            color={apiKey.isActive ? "success" : "default"}
                            variant={apiKey.isActive ? "filled" : "outlined"}
                          />
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="삭제">
                        <IconButton
                          color="error"
                          onClick={() => {
                            setSelectedKey(apiKey);
                            setDeleteDialog(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* API 키 생성 대화상자 */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 API 키 생성</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            새 API 키를 생성하면 키 값이 한 번만 표시됩니다. 생성 후 안전한 곳에 저장해 두세요.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="키 이름"
            fullWidth
            variant="outlined"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="예: Development, Production, Test 등"
            required
          />
          <TextField
            margin="dense"
            label="만료일 (선택사항)"
            type="date"
            fullWidth
            variant="outlined"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="비워두면 만료 기한이 없는 키가 생성됩니다"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateKey}
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? <CircularProgress size={24} /> : '생성'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* API 키 확인 대화상자 */}
      <Dialog
        open={showTokenDialog}
        onClose={() => {
          setShowTokenDialog(false);
          setNewKeyInfo(null);
          setShowToken(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>API 키 생성 완료</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              중요: 이 키는 지금만 표시됩니다. 안전한 곳에 저장해 두세요.
            </Typography>
          </Alert>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              키 정보
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  이름
                </Typography>
                <Typography variant="body1">
                  {newKeyInfo?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  생성일
                </Typography>
                <Typography variant="body1">
                  {newKeyInfo?.createdAt && format(new Date(newKeyInfo.createdAt), 'yyyy-MM-dd HH:mm')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  만료일
                </Typography>
                <Typography variant="body1">
                  {newKeyInfo?.expiresAt 
                    ? format(new Date(newKeyInfo.expiresAt), 'yyyy-MM-dd')
                    : '만료 없음'
                  }
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            API 키
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={newKeyInfo?.token || ''}
            type={showToken ? 'text' : 'password'}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowToken(!showToken)}
                    edge="end"
                  >
                    {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleCopyKey(newKeyInfo?.token || '')}
                  >
                    <CopyIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            variant="outlined"
            onClick={() => handleCopyKey(newKeyInfo?.token || '')}
            startIcon={<CopyIcon />}
            sx={{ mr: 'auto' }}
          >
            복사
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowTokenDialog(false);
              setNewKeyInfo(null);
            }}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* API 키 삭제 대화상자 */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>API 키 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`'${selectedKey?.name}' API 키를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 이 키를 사용하는 모든 애플리케이션이 더 이상 작동하지 않습니다.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>취소</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate(selectedKey?.id)}
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? <CircularProgress size={24} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 키 복사 성공 메시지 */}
      <Dialog open={copySuccessDialog} onClose={() => setCopySuccessDialog(false)}>
        <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CheckIcon color="success" />
          <Typography>API 키가 클립보드에 복사되었습니다.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopySuccessDialog(false)} autoFocus>
            확인
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
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
