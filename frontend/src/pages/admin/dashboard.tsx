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
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Assessment as AssessmentIcon,
  Autorenew as AutorenewIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // 상태 관리
  const [timeRange, setTimeRange] = useState<string>('7days');
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [chartType, setChartType] = useState<string>('usage');
  
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

  // 사용량 통계 데이터 가져오기
  const {
    data: usageData,
    isLoading: usageLoading,
    error: usageError,
    refetch: refetchUsage
  } = useQuery(['admin-usage-stats', timeRange, startDate, endDate], 
    () => adminApi.getUsageStats({
      timeRange,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
    }), {
      enabled: isAuthenticated && user?.role?.name === 'admin'
    }
  );

  // 사용자 통계 데이터 가져오기
  const {
    data: userStats,
    isLoading: userStatsLoading
  } = useQuery(['admin-user-stats'], adminApi.getUserStats, {
    enabled: isAuthenticated && user?.role?.name === 'admin'
  });

  // 프로바이더 통계 데이터 가져오기
  const {
    data: providerStats,
    isLoading: providerStatsLoading
  } = useQuery(['admin-provider-stats'], adminApi.getProviderStats, {
    enabled: isAuthenticated && user?.role?.name === 'admin'
  });

  // 로딩 중 표시
  if (authLoading || !isAuthenticated || user?.role?.name !== 'admin') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // 통계 차트용 색상
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#45B39D', '#F4D03F'];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          관리자 대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary">
          MindRoute AI Gateway 시스템의 사용량 통계 및 모니터링
        </Typography>
      </Box>

      {/* 요약 카드 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                총 API 호출
              </Typography>
              {userStatsLoading ? (
                <CircularProgress size={20} />
              ) : (
                <>
                  <Typography variant="h3">
                    {userStats?.totalCompletions.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    모든 시간 기준
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                활성 사용자
              </Typography>
              {userStatsLoading ? (
                <CircularProgress size={20} />
              ) : (
                <>
                  <Typography variant="h3">
                    {userStats?.activeUsers.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    최근 30일 기준
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                총 토큰 사용량
              </Typography>
              {userStatsLoading ? (
                <CircularProgress size={20} />
              ) : (
                <>
                  <Typography variant="h3">
                    {(userStats?.totalTokens || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    모든 시간 기준
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 사용량 차트 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">사용량 통계</Typography>
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>기간</InputLabel>
              <Select
                value={timeRange}
                label="기간"
                onChange={(e) => setTimeRange(e.target.value as string)}
              >
                <MenuItem value="7days">최근 7일</MenuItem>
                <MenuItem value="30days">최근 30일</MenuItem>
                <MenuItem value="90days">최근 90일</MenuItem>
                <MenuItem value="custom">사용자 지정</MenuItem>
              </Select>
            </FormControl>
            
            {timeRange === 'custom' && (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <DatePicker
                  label="시작일"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <DatePicker
                  label="종료일"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>
            )}
            
            <Button
              startIcon={<AutorenewIcon />}
              onClick={() => refetchUsage()}
              disabled={usageLoading}
            >
              새로고침
            </Button>
          </Box>
        </Box>
        
        <Tabs
          value={chartType}
          onChange={(_, newValue) => setChartType(newValue)}
          aria-label="차트 유형"
          sx={{ mb: 2 }}
        >
          <Tab value="usage" label="API 호출 횟수" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab value="tokens" label="토큰 사용량" icon={<TimelineIcon />} iconPosition="start" />
        </Tabs>
        
        <Divider sx={{ my: 2 }} />
        
        {usageError ? (
          <Alert severity="error">통계 데이터를 불러오는 중 오류가 발생했습니다.</Alert>
        ) : usageLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'usage' ? (
              <BarChart data={usageData?.dailyUsage || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completions" name="API 호출 수" fill="#0088FE" />
                <Bar dataKey="streamCompletions" name="스트리밍 API 호출 수" fill="#00C49F" />
              </BarChart>
            ) : (
              <LineChart data={usageData?.dailyUsage || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="promptTokens" name="프롬프트 토큰" stroke="#0088FE" />
                <Line type="monotone" dataKey="completionTokens" name="응답 토큰" stroke="#00C49F" />
                <Line type="monotone" dataKey="totalTokens" name="총 토큰" stroke="#FF8042" />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </Paper>

      {/* 분포 차트 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              프로바이더별 사용량
            </Typography>
            {providerStatsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={providerStats?.providerUsage || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={(entry) => `${entry.name}: ${entry.value}회`}
                  >
                    {(providerStats?.providerUsage || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              모델별 사용량
            </Typography>
            {providerStatsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={providerStats?.modelUsage || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={(entry) => `${entry.name}: ${entry.value}회`}
                  >
                    {(providerStats?.modelUsage || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
