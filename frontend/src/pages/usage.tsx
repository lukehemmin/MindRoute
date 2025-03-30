import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { logApi } from '@/services/api';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  ButtonGroup,
  Button
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function UsagePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [timeRange, setTimeRange] = useState<string>('7days');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(subDays(new Date(), 7));
  const [customEndDate, setCustomEndDate] = useState<Date | null>(new Date());
  const [chartType, setChartType] = useState<'daily' | 'model' | 'provider'>('daily');

  // 인증 확인
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 날짜 범위 계산
  const getDateRange = () => {
    const today = new Date();
    
    switch (timeRange) {
      case '7days':
        return { start: subDays(today, 7), end: today };
      case '30days':
        return { start: subDays(today, 30), end: today };
      case 'thisMonth':
        return { start: startOfMonth(today), end: today };
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(today), 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'custom':
        return { start: customStartDate, end: customEndDate };
      default:
        return { start: subDays(today, 7), end: today };
    }
  };

  const { start, end } = getDateRange();

  // 사용량 데이터 조회
  const {
    data: usageData,
    isLoading: usageLoading,
    error: usageError,
    refetch: refetchUsage
  } = useQuery(
    ['user-usage', timeRange, customStartDate, customEndDate],
    () => logApi.getUserUsage({
      startDate: start ? format(start, 'yyyy-MM-dd') : undefined,
      endDate: end ? format(end, 'yyyy-MM-dd') : undefined
    }),
    {
      enabled: isAuthenticated
    }
  );

  // 로딩 중 표시
  if (authLoading || !isAuthenticated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // 데이터 변환 및 가공
  const prepareChartData = () => {
    if (!usageData) return [];

    switch (chartType) {
      case 'daily':
        return usageData.dailyUsage || [];
        
      case 'model':
        return (usageData.modelUsage || []).map((item: any) => ({
          name: item.model,
          value: item.count
        }));
        
      case 'provider':
        return (usageData.providerUsage || []).map((item: any) => ({
          name: item.provider,
          value: item.count
        }));
        
      default:
        return [];
    }
  };

  const chartData = prepareChartData();
  
  // 원형 차트 색상
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          API 사용량 통계
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI 모델 사용량과 토큰 소비량을 확인하세요
        </Typography>
      </Box>

      {/* 통계 요약 카드 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.secondary">
                총 API 호출
              </Typography>
              <Typography variant="h3">
                {usageLoading ? <CircularProgress size={30} /> : usageData?.totalCalls?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                모든 기간 기준
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.secondary">
                총 토큰 사용량
              </Typography>
              <Typography variant="h3">
                {usageLoading ? <CircularProgress size={30} /> : usageData?.totalTokens?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                모든 기간 기준
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.secondary">
                이번 달 API 호출
              </Typography>
              <Typography variant="h3">
                {usageLoading ? <CircularProgress size={30} /> : usageData?.monthCalls?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {format(new Date(), 'yyyy년 MM월')} 기준
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.secondary">
                이번 달 토큰 사용량
              </Typography>
              <Typography variant="h3">
                {usageLoading ? <CircularProgress size={30} /> : usageData?.monthTokens?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {format(new Date(), 'yyyy년 MM월')} 기준
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 차트 영역 */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <Typography variant="h6" mr={2}>
              사용량 추이
            </Typography>
            <ButtonGroup size="small">
              <Button
                variant={chartType === 'daily' ? 'contained' : 'outlined'}
                onClick={() => setChartType('daily')}
                startIcon={<TrendingUpIcon />}
              >
                일별
              </Button>
              <Button
                variant={chartType === 'model' ? 'contained' : 'outlined'}
                onClick={() => setChartType('model')}
                startIcon={<PieChartIcon />}
              >
                모델별
              </Button>
              <Button
                variant={chartType === 'provider' ? 'contained' : 'outlined'}
                onClick={() => setChartType('provider')}
                startIcon={<PieChartIcon />}
              >
                프로바이더별
              </Button>
            </ButtonGroup>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>기간</InputLabel>
              <Select
                value={timeRange}
                label="기간"
                onChange={(e) => setTimeRange(e.target.value as string)}
              >
                <MenuItem value="7days">최근 7일</MenuItem>
                <MenuItem value="30days">최근 30일</MenuItem>
                <MenuItem value="thisMonth">이번 달</MenuItem>
                <MenuItem value="lastMonth">지난 달</MenuItem>
                <MenuItem value="custom">사용자 지정</MenuItem>
              </Select>
            </FormControl>
            
            {timeRange === 'custom' && (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <DatePicker
                  label="시작일"
                  value={customStartDate}
                  onChange={(newValue) => setCustomStartDate(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <DatePicker
                  label="종료일"
                  value={customEndDate}
                  onChange={(newValue) => setCustomEndDate(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>
            )}
            
            <Tooltip title="새로고침">
              <IconButton onClick={() => refetchUsage()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {usageError ? (
          <Alert severity="error">
            사용량 데이터를 불러오는 중 오류가 발생했습니다.
          </Alert>
        ) : usageLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'daily' ? (
                <LineChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="calls"
                    name="API 호출 수"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="tokens" 
                    name="토큰 사용량" 
                    stroke="#82ca9d" 
                  />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={(entry) => `${entry.name}: ${entry.value}회`}
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </Box>
        )}
      </Paper>

      {/* 사용량 세부 정보 */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          최근 사용 패턴
        </Typography>
        
        <Grid container spacing={4} mt={1}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              자주 사용한 모델
            </Typography>
            {usageLoading ? (
              <CircularProgress size={20} />
            ) : !usageData?.topModels?.length ? (
              <Typography variant="body2" color="text.secondary">
                아직 사용 기록이 없습니다.
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>모델</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>호출 수</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>토큰 사용량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageData.topModels.map((model: any, index: number) => (
                      <tr key={index} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: '8px' }}>{model.name}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{model.count?.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{model.tokens?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              프로바이더별 사용량
            </Typography>
            {usageLoading ? (
              <CircularProgress size={20} />
            ) : !usageData?.providerUsage?.length ? (
              <Typography variant="body2" color="text.secondary">
                아직 사용 기록이 없습니다.
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>프로바이더</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>호출 수</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>토큰 사용량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageData.providerUsage.map((provider: any, index: number) => (
                      <tr key={index} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: '8px' }}>{provider.name}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{provider.count?.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{provider.tokens?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
