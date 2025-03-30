import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { logApi, providerApi } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// 로그 인터페이스 정의
interface Log {
  id: string;
  provider: string;
  model: string;
  prompt: string;
  systemPrompt: string;
  response: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  processingTimeMs: number;
  createdAt: string;
  isStream: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  apiKey?: {
    id: string;
    name: string;
  };
}

interface DetailedLog extends Log {
  messages: any[];
}

export default function Logs() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.isAdmin;

  // 상태 관리
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    provider: string;
    model: string;
    startDate: Date | null;
    endDate: Date | null;
  }>({
    provider: '',
    model: '',
    startDate: null,
    endDate: null
  });
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // 로그 데이터 불러오기
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs
  } = useQuery(
    ['logs', page, limit, filters],
    () => logApi.getLogs({
      page,
      limit,
      provider: filters.provider || undefined,
      model: filters.model || undefined,
      startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
      endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined
    }),
    {
      enabled: isAuthenticated
    }
  );

  // 프로바이더 목록 불러오기
  const { data: providers } = useQuery(['providers'], providerApi.getAllProviders, {
    enabled: isAuthenticated
  });

  // 상세 로그 데이터 불러오기
  const {
    data: detailedLog,
    isLoading: detailLoading
  } = useQuery(
    ['log', selectedLog],
    () => logApi.getLogById(selectedLog!),
    {
      enabled: !!selectedLog && isAuthenticated
    }
  );

  // 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  const handleResetFilters = () => {
    setFilters({
      provider: '',
      model: '',
      startDate: null,
      endDate: null
    });
    setPage(1);
  };

  const handleViewLog = (logId: string) => {
    setSelectedLog(logId);
  };

  const handleCloseDetailDialog = () => {
    setSelectedLog(null);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess('복사되었습니다!');
      setTimeout(() => setCopySuccess(null), 2000);
    });
  };

  // CSV 다운로드 핸들러
  const handleDownloadLogs = () => {
    if (!logsData?.logs) return;

    const headers = [
      'ID',
      'Provider',
      'Model',
      'User',
      'API Key',
      'Tokens',
      'Processing Time (ms)',
      'Creation Date'
    ].join(',');

    const csvContent = logsData.logs.map((log: Log) => {
      return [
        log.id,
        log.provider,
        log.model,
        log.user?.name || 'N/A',
        log.apiKey?.name || 'N/A',
        log.totalTokens,
        log.processingTimeMs,
        new Date(log.createdAt).toISOString()
      ].join(',');
    }).join('\n');

    const csv = `${headers}\n${csvContent}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 인증 확인
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            API 사용 로그
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {isAdmin 
              ? '모든 사용자의 API 사용 기록을 조회합니다.' 
              : '내 API 사용 기록을 조회합니다.'}
          </Typography>
        </Box>

        {/* 필터 섹션 */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>AI 프로바이더</InputLabel>
                <Select
                  value={filters.provider}
                  onChange={(e) => handleFilterChange('provider', e.target.value)}
                  label="AI 프로바이더"
                >
                  <MenuItem value="">전체</MenuItem>
                  {providers?.map((p: any) => (
                    <MenuItem key={p.name} value={p.name}>
                      {p.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>모델</InputLabel>
                <Select
                  value={filters.model}
                  onChange={(e) => handleFilterChange('model', e.target.value)}
                  label="모델"
                >
                  <MenuItem value="">전체</MenuItem>
                  {/* DB에서 조회한 모든 모델을 표시 */}
                  {logsData?.logs?.reduce((acc: string[], log: Log) => {
                    if (!acc.includes(log.model)) {
                      acc.push(log.model);
                    }
                    return acc;
                  }, []).map((model: string) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="시작일"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="종료일"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={2}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={() => refetchLogs()}
                  fullWidth
                >
                  검색
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleResetFilters}
                >
                  초기화
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* 로그 테이블 */}
        <Paper>
          <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">사용 로그</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => refetchLogs()}
              >
                새로고침
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadLogs}
                disabled={!logsData?.logs || logsData.logs.length === 0}
              >
                CSV 다운로드
              </Button>
            </Stack>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>시간</TableCell>
                  <TableCell>프로바이더</TableCell>
                  <TableCell>모델</TableCell>
                  {isAdmin && <TableCell>사용자</TableCell>}
                  <TableCell>프롬프트</TableCell>
                  <TableCell>응답</TableCell>
                  <TableCell align="right">토큰</TableCell>
                  <TableCell align="right">처리 시간</TableCell>
                  <TableCell align="center">작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 9 : 8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : logsData?.logs && logsData.logs.length > 0 ? (
                  logsData.logs.map((log: Log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.provider} 
                          size="small" 
                          color={
                            log.provider === 'openai' ? 'primary' :
                            log.provider === 'anthropic' ? 'secondary' :
                            log.provider === 'google' ? 'success' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{log.model}</TableCell>
                      {isAdmin && (
                        <TableCell>{log.user?.name || '익명'}</TableCell>
                      )}
                      <TableCell sx={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.prompt}
                      </TableCell>
                      <TableCell sx={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.response}
                      </TableCell>
                      <TableCell align="right">{log.totalTokens.toLocaleString()}</TableCell>
                      <TableCell align="right">{log.processingTimeMs}ms</TableCell>
                      <TableCell align="center">
                        <Tooltip title="상세 보기">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewLog(log.id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 9 : 8} align="center">
                      로그 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 페이지네이션 */}
          {logsData && logsData.pagination && logsData.pagination.totalPages > 1 && (
            <Box p={2} display="flex" justifyContent="center">
              <Pagination
                count={logsData.pagination.totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Paper>

        {/* 로그 상세 정보 대화상자 */}
        <Dialog
          open={!!selectedLog}
          onClose={handleCloseDetailDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>로그 상세 정보</DialogTitle>
          <DialogContent dividers>
            {detailLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : detailedLog ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>기본 정보</Typography>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="subtitle2" component="span">시간: </Typography>
                          <Typography variant="body2" component="span">
                            {format(new Date(detailedLog.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" component="span">프로바이더: </Typography>
                          <Chip 
                            label={detailedLog.provider} 
                            size="small" 
                            color={
                              detailedLog.provider === 'openai' ? 'primary' :
                              detailedLog.provider === 'anthropic' ? 'secondary' :
                              detailedLog.provider === 'google' ? 'success' : 'default'
                            }
                          />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" component="span">모델: </Typography>
                          <Typography variant="body2" component="span">{detailedLog.model}</Typography>
                        </Box>
                        {isAdmin && detailedLog.user && (
                          <Box>
                            <Typography variant="subtitle2" component="span">사용자: </Typography>
                            <Typography variant="body2" component="span">
                              {detailedLog.user.name} ({detailedLog.user.email})
                            </Typography>
                          </Box>
                        )}
                        {isAdmin && detailedLog.apiKey && (
                          <Box>
                            <Typography variant="subtitle2" component="span">API 키: </Typography>
                            <Typography variant="body2" component="span">{detailedLog.apiKey.name}</Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography variant="subtitle2" component="span">토큰 사용량: </Typography>
                          <Typography variant="body2" component="span">
                            총 {detailedLog.totalTokens.toLocaleString()} 토큰
                            (프롬프트: {detailedLog.promptTokens.toLocaleString()}, 
                            응답: {detailedLog.completionTokens.toLocaleString()})
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" component="span">처리 시간: </Typography>
                          <Typography variant="body2" component="span">{detailedLog.processingTimeMs}ms</Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" component="span">스트리밍: </Typography>
                          <Chip 
                            label={detailedLog.isStream ? '예' : '아니오'} 
                            size="small" 
                            color={detailedLog.isStream ? 'success' : 'default'}
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>설정</Typography>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="subtitle2" component="span">temperature: </Typography>
                          <Typography variant="body2" component="span">{detailedLog.temperature || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" component="span">max_tokens: </Typography>
                          <Typography variant="body2" component="span">{detailedLog.maxTokens || 'N/A'}</Typography>
                        </Box>
                      </Stack>
                      
                      {detailedLog.systemPrompt && (
                        <>
                          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>시스템 프롬프트:</Typography>
                          <Paper variant="outlined" sx={{ p: 1, bgcolor: 'background.default' }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {detailedLog.systemPrompt}
                            </Typography>
                          </Paper>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>메시지 내용</Typography>
                      {detailedLog.messages && detailedLog.messages.length > 0 ? (
                        <Stack spacing={2}>
                          {detailedLog.messages.map((msg: any, index: number) => (
                            <Paper 
                              key={index} 
                              variant="outlined" 
                              sx={{ 
                                p: 1.5,
                                bgcolor: msg.role === 'user' 
                                  ? 'primary.light' 
                                  : msg.role === 'system'
                                  ? 'warning.light'
                                  : 'background.paper'
                              }}
                            >
                              <Typography variant="caption" display="block" gutterBottom>
                                {msg.role === 'user' ? '사용자' : msg.role === 'system' ? '시스템' : '어시스턴트'}
                              </Typography>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {msg.content}
                              </Typography>
                            </Paper>
                          ))}
                        </Stack>
                      ) : detailedLog.prompt ? (
                        <>
                          <Box mb={3}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                              시스템 프롬프트
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, position: 'relative', minHeight: '60px' }}>
                              <Box
                                sx={{
                                  whiteSpace: 'pre-wrap',
                                  fontFamily: 'monospace',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {detailedLog.systemPrompt || '(시스템 프롬프트 없음)'}
                              </Box>
                              
                              {detailedLog.systemPrompt && (
                                <Tooltip title="복사">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyText(detailedLog.systemPrompt)}
                                    sx={{ position: 'absolute', top: 8, right: 8 }}
                                  >
                                    <CopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Paper>
                          </Box>

                          <Box mb={3}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                              사용자 프롬프트
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, position: 'relative', minHeight: '100px' }}>
                              <Box
                                sx={{
                                  whiteSpace: 'pre-wrap',
                                  fontFamily: 'monospace',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {detailedLog.prompt || '(프롬프트 없음)'}
                              </Box>
                              
                              {detailedLog.prompt && (
                                <Tooltip title="복사">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyText(detailedLog.prompt)}
                                    sx={{ position: 'absolute', top: 8, right: 8 }}
                                  >
                                    <CopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Paper>
                          </Box>

                          <Box>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                              AI 응답
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, position: 'relative', minHeight: '120px', maxHeight: '300px', overflow: 'auto' }}>
                              <Box
                                sx={{
                                  whiteSpace: 'pre-wrap',
                                  fontFamily: 'monospace',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {detailedLog.response || '(응답 없음)'}
                              </Box>
                              
                              {detailedLog.response && (
                                <Tooltip title="복사">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyText(detailedLog.response)}
                                    sx={{ position: 'absolute', top: 8, right: 8 }}
                                  >
                                    <CopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Paper>
                          </Box>
                        </>
                      ) : (
                        <Typography variant="body2">
                          메시지 내용이 없습니다.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Typography>로그 정보를 불러올 수 없습니다.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailDialog}>닫기</Button>
          </DialogActions>
        </Dialog>

        {/* 복사 성공 알림 */}
        {copySuccess && (
          <Alert 
            severity="success" 
            sx={{ 
              position: 'fixed', 
              bottom: 16, 
              left: '50%', 
              transform: 'translateX(-50%)',
              zIndex: 9999,
              boxShadow: 3
            }}
          >
            {copySuccess}
          </Alert>
        )}
      </Container>
    </LocalizationProvider>
  );
}
