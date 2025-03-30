import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { logApi } from '@/services/api';
import { format, subDays } from 'date-fns';
import Link from 'next/link';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  Stack,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Key as KeyIcon,
  Analytics as AnalyticsIcon,
  Code as CodeIcon,
  Lightbulb as LightbulbIcon,
  Speed as SpeedIcon,
  Extension as ExtensionIcon
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // 상태 관리
  const [timeRange, setTimeRange] = useState<string>('7days');
  
  // 인증 확인
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 사용자 로그 데이터 조회
  const {
    data: usageData,
    isLoading: usageLoading
  } = useQuery(['user-usage', timeRange], () => logApi.getUserUsage({
    timeRange,
    startDate: subDays(new Date(), parseInt(timeRange) || 7).toISOString(),
    endDate: new Date().toISOString()
  }), {
    enabled: isAuthenticated
  });

  // 빠른 액세스 카드
  const quickAccessCards = [
    {
      title: "AI 플레이그라운드",
      description: "다양한 AI 모델과 대화하고 테스트해보세요",
      icon: <CodeIcon fontSize="large" color="primary" />,
      link: "/playground",
      color: "primary.light"
    },
    {
      title: "API 키 관리",
      description: "애플리케이션에서 사용할 API 키를 생성하고 관리합니다",
      icon: <KeyIcon fontSize="large" color="secondary" />,
      link: "/api-keys",
      color: "secondary.light"
    },
    {
      title: "사용량 통계",
      description: "API 사용량 및 토큰 소비 통계를 확인하세요",
      icon: <AnalyticsIcon fontSize="large" color="success" />,
      link: "/usage",
      color: "success.light"
    },
    {
      title: "사용 로그",
      description: "API 호출 내역 및 상세 정보를 조회합니다",
      icon: <TimelineIcon fontSize="large" color="info" />,
      link: "/logs",
      color: "info.light"
    }
  ];

  // 로딩 중 표시
  if (authLoading || !isAuthenticated) {
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
          안녕하세요, {user?.name}님!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          MindRoute AI Gateway 대시보드에 오신 것을 환영합니다.
        </Typography>
      </Box>

      {/* 통계 요약 카드 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <SpeedIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  오늘의 API 호출
                </Typography>
                <Typography variant="h5">
                  {usageLoading ? <CircularProgress size={20} /> : usageData?.todayCount || '0'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                <ExtensionIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  프롬프트 토큰
                </Typography>
                <Typography variant="h5">
                  {usageLoading ? <CircularProgress size={20} /> : usageData?.promptTokens?.toLocaleString() || '0'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                <LightbulbIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  완성 토큰
                </Typography>
                <Typography variant="h5">
                  {usageLoading ? <CircularProgress size={20} /> : usageData?.completionTokens?.toLocaleString() || '0'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56 }}>
                <KeyIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  활성 API 키
                </Typography>
                <Typography variant="h5">
                  {usageLoading ? <CircularProgress size={20} /> : usageData?.activeApiKeys || '0'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* 사용량 차트 */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={0} variant="outlined">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">API 사용량 추이</Typography>
          <FormControl size="small" sx={{ width: 150 }}>
            <InputLabel>기간</InputLabel>
            <Select
              value={timeRange}
              label="기간"
              onChange={(e) => setTimeRange(e.target.value as string)}
            >
              <MenuItem value="7days">최근 7일</MenuItem>
              <MenuItem value="30days">최근 30일</MenuItem>
              <MenuItem value="90days">최근 90일</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {usageLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageData?.dailyUsage || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="calls" name="API 호출 수" stroke="#8884d8" />
              <Line type="monotone" dataKey="tokens" name="총 토큰 수" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* 빠른 액세스 카드 */}
      <Typography variant="h6" gutterBottom mb={2}>
        빠른 액세스
      </Typography>
      <Grid container spacing={3} mb={4}>
        {quickAccessCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Link href={card.link} passHref style={{ textDecoration: 'none' }}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea sx={{ height: '100%' }}>
                  <CardContent>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 1
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: card.color, 
                          width: 60, 
                          height: 60,
                          mb: 1
                        }}
                      >
                        {card.icon}
                      </Avatar>
                      <Typography variant="h6" component="div">
                        {card.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {card.description}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>

      {/* 최근 사용 모델 */}
      <Paper sx={{ p: 3 }} elevation={0} variant="outlined">
        <Typography variant="h6" gutterBottom>
          최근 사용 모델
        </Typography>
        {usageLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : usageData?.recentModels?.length > 0 ? (
          <Box display="flex" flexWrap="wrap" gap={1}>
            {usageData?.recentModels?.map((model: any, index: number) => (
              <Chip 
                key={index}
                label={`${model.name} (${model.count}회)`}
                onClick={() => router.push('/playground')}
                color={index === 0 ? 'primary' : 'default'}
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            아직 AI 모델을 사용한 기록이 없습니다.
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="center">
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<CodeIcon />}
            onClick={() => router.push('/playground')}
            sx={{ px: 4 }}
          >
            플레이그라운드 시작하기
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
