import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
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
  TablePagination,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import ReactJson from 'react-json-view';

export default function AdminLogs() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // 상태 관리
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('');
  const [filterModel, setFilterModel] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showLogDetailDialog, setShowLogDetailDialog] = useState(false);

  // 인증 및 권한 확인
  React.useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role?.name !== 'admin') {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // 로그 데이터 조회
  const {
    data: logsData,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs
  } = useQuery(
    ['admin-logs', page, rowsPerPage, searchTerm, filterProvider, filterModel, filterUser, startDate, endDate],
    () => adminApi.getAllLogs({
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      provider: filterProvider,
      model: filterModel,
      userId: filterUser,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
    }),
    {
      enabled: isAuthenticated && user?.role?.name === 'admin',
      keepPreviousData: true
    }
  );

  // 프로바이더 목록 조회
  const {
    data: providers = []
  } = useQuery(['providers-for-filter'], () => adminApi.getProviderStats(), {
    enabled: isAuthenticated && user?.role?.name === 'admin',
    select: (data) => {
      return data?.providers || [];
    }
  });

  // 사용자 목록 조회
  const {
    data: users = []
  } = useQuery(['users-for-filter'], () => adminApi.getAllUsers(), {
    enabled: isAuthenticated && user?.role?.name === 'admin',
    select: (data) => {
      return data?.users || [];
    }
  });

  // 페이지 변경 핸들러
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지 당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 검색 핸들러
  const handleSearch = () => {
    setPage(0);
    refetchLogs();
  };

  // 필터 적용 핸들러
  const handleApplyFilters = () => {
    setPage(0);
    setShowFilterDialog(false);
    refetchLogs();
  };

  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    setFilterProvider('');
    setFilterModel('');
    setFilterUser('');
    setStartDate(null);
    setEndDate(null);
    setPage(0);
    refetchLogs();
    setShowFilterDialog(false);
  };

  // 로그 상세 보기
  const handleViewLogDetail = (log: any) => {
    setSelectedLog(log);
    setShowLogDetailDialog(true);
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          API 사용 로그
        </Typography>
        <Typography variant="body1" color="text.secondary">
          시스템 전체 API 호출 기록 및 통계
        </Typography>
      </Box>

      {/* 검색 및 필터 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="검색어 입력..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilterDialog(true)}
              >
                고급 필터
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => refetchLogs()}
              >
                새로고침
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 필터 적용 상태 표시 */}
      {(filterProvider || filterModel || filterUser || startDate || endDate) && (
        <Box mb={3} display="flex" flexWrap="wrap" gap={1}>
          {filterProvider && (
            <Chip 
              label={`프로바이더: ${filterProvider}`} 
              onDelete={() => setFilterProvider('')}
              color="primary" 
              variant="outlined"
            />
          )}
          {filterModel && (
            <Chip 
              label={`모델: ${filterModel}`} 
              onDelete={() => setFilterModel('')}
              color="primary" 
              variant="outlined"
            />
          )}
          {filterUser && (
            <Chip 
              label={`사용자: ${users.find((u: any) => u.id === filterUser)?.name || filterUser}`} 
              onDelete={() => setFilterUser('')}
              color="primary" 
              variant="outlined"
            />
          )}
          {startDate && (
            <Chip 
              label={`시작일: ${format(startDate, 'yyyy-MM-dd')}`} 
              onDelete={() => setStartDate(null)}
              color="primary" 
              variant="outlined"
            />
          )}
          {endDate && (
            <Chip 
              label={`종료일: ${format(endDate, 'yyyy-MM-dd')}`} 
              onDelete={() => setEndDate(null)}
              color="primary" 
              variant="outlined"
            />
          )}
          <Button 
            size="small" 
            variant="outlined" 
            color="secondary" 
            onClick={handleResetFilters}
          >
            모든 필터 초기화
          </Button>
        </Box>
      )}

      {logsError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          로그를 불러오는 중 오류가 발생했습니다.
        </Alert>
      ) : null}
      
      {/* 로그 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>시간</TableCell>
              <TableCell>프로바이더</TableCell>
              <TableCell>모델</TableCell>
              <TableCell>사용자</TableCell>
              <TableCell>토큰</TableCell>
              <TableCell>처리 시간</TableCell>
              <TableCell align="center">스트림</TableCell>
              <TableCell align="right">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logsLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : logsData?.logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  로그 데이터가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              logsData?.logs?.map((log: any) => (
                <TableRow 
                  key={log.id}
                  sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableCell>
                    {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={log.provider} color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {log.model}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {log.user ? log.user.name : (log.apiKey ? '(API 키)' : '-')}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`프롬프트: ${log.promptTokens}, 응답: ${log.completionTokens}`}>
                      <Typography variant="body2">
                        {log.totalTokens.toLocaleString()}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{log.processingTimeMs}ms</TableCell>
                  <TableCell align="center">
                    {log.isStream ? (
                      <Chip size="small" label="스트림" color="success" />
                    ) : (
                      <Chip size="small" label="일반" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="상세 보기">
                      <IconButton
                        size="small" 
                        onClick={() => handleViewLogDetail(log)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={logsData?.totalCount || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 총 ${count !== -1 ? count : `${to} 이상`}`}
        />
      </TableContainer>

      {/* 고급 필터 다이얼로그 */}
      <Dialog
        open={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>고급 필터</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>프로바이더</InputLabel>
                <Select
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value as string)}
                  label="프로바이더"
                >
                  <MenuItem value="">전체</MenuItem>
                  {providers.map((provider: any) => (
                    <MenuItem key={provider.name} value={provider.name}>
                      {provider.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>모델</InputLabel>
                <Select
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value as string)}
                  label="모델"
                >
                  <MenuItem value="">전체</MenuItem>
                  {/* 여기에 동적으로 모델 목록을 불러오는 것이 좋음 */}
                  <MenuItem value="gpt-4o">GPT-4o</MenuItem>
                  <MenuItem value="gpt-4">GPT-4</MenuItem>
                  <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                  <MenuItem value="claude-3-opus">Claude 3 Opus</MenuItem>
                  <MenuItem value="claude-3-sonnet">Claude 3 Sonnet</MenuItem>
                  <MenuItem value="gemini-pro">Gemini Pro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>사용자</InputLabel>
                <Select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value as string)}
                  label="사용자"
                >
                  <MenuItem value="">전체</MenuItem>
                  {users.map((user: any) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <Box display="flex" gap={2}>
                  <DatePicker
                    label="시작일"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    sx={{ width: '100%' }}
                  />
                  <DatePicker
                    label="종료일"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    sx={{ width: '100%' }}
                  />
                </Box>
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFilterDialog(false)}>취소</Button>
          <Button onClick={handleResetFilters}>필터 초기화</Button>
          <Button onClick={handleApplyFilters} variant="contained" color="primary">
            필터 적용
          </Button>
        </DialogActions>
      </Dialog>

      {/* 로그 상세 정보 다이얼로그 */}
      <Dialog
        open={showLogDetailDialog}
        onClose={() => setShowLogDetailDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          로그 상세 정보
          <IconButton
            aria-label="close"
            onClick={() => setShowLogDetailDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CodeIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>기본 정보</Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>요청 시간:</strong> {format(new Date(selectedLog.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>프로바이더:</strong> {selectedLog.provider}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>모델:</strong> {selectedLog.model}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>사용자:</strong> {selectedLog.user ? selectedLog.user.name : (selectedLog.apiKey ? '(API 키)' : '-')}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>이메일:</strong> {selectedLog.user ? selectedLog.user.email : '-'}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>토큰 사용량</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" align="center">
                        <strong>프롬프트</strong>
                      </Typography>
                      <Typography variant="h6" align="center" color="primary">
                        {selectedLog.promptTokens}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" align="center">
                        <strong>응답</strong>
                      </Typography>
                      <Typography variant="h6" align="center" color="secondary">
                        {selectedLog.completionTokens}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" align="center">
                        <strong>합계</strong>
                      </Typography>
                      <Typography variant="h6" align="center">
                        {selectedLog.totalTokens}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box mt={2}>
                    <Typography variant="body2" gutterBottom>
                      <strong>처리 시간:</strong> {selectedLog.processingTimeMs}ms
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>스트리밍:</strong> {selectedLog.isStream ? '예' : '아니오'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>온도:</strong> {selectedLog.temperature || '-'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>최대 토큰:</strong> {selectedLog.maxTokens || '-'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>시스템 프롬프트</Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 1.5, 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'monospace',
                      bgcolor: 'grey.50',
                      height: 100,
                      overflow: 'auto'
                    }}
                  >
                    {selectedLog.systemPrompt || '(시스템 프롬프트 없음)'}
                  </Paper>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>사용자 프롬프트</Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 1.5, 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'monospace',
                      bgcolor: 'grey.50',
                      maxHeight: 150,
                      overflow: 'auto'
                    }}
                  >
                    {selectedLog.prompt || '(프롬프트 없음)'}
                  </Paper>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>AI 응답</Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 1.5, 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'monospace',
                      bgcolor: 'grey.50',
                      maxHeight: 300,
                      overflow: 'auto'
                    }}
                  >
                    {selectedLog.response || '(응답 없음)'}
                  </Paper>
                </Paper>
              </Grid>

              {/* 메시지 배열이 있는 경우 */}
              {selectedLog.messages && selectedLog.messages.length > 0 && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>메시지 히스토리</Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      <ReactJson 
                        src={selectedLog.messages} 
                        theme="rjv-default" 
                        displayDataTypes={false}
                        name={false}
                        collapsed={1}
                      />
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogDetailDialog(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
