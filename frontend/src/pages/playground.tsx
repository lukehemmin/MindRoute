import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { providerApi, completionApi } from '@/services/api';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Chip,
  Slider,
  Divider,
  Alert,
  Card,
  CardContent,
  IconButton,
  Stack,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Delete as ClearIcon,
  ContentCopy as CopyIcon,
  Code as CodeIcon,
  DisplaySettings as DisplaySettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export default function Playground() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // 상태 관리
  const [provider, setProvider] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('당신은 MindRoute AI 게이트웨이의 지능적인 AI 어시스턴트입니다. 항상 정확하고 도움이 되는 정보를 제공합니다.');
  const [userInput, setUserInput] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // 프로바이더 목록 조회
  const {
    data: providers = [],
    isLoading: providersLoading,
  } = useQuery(['providers'], providerApi.getAllProviders, {
    enabled: isAuthenticated,
    onSuccess: (data) => {
      if (data.length > 0 && !provider) {
        setProvider(data[0].name);
      }
    }
  });

  // 모델 목록 조회
  const {
    data: models = [],
    isLoading: modelsLoading,
  } = useQuery(
    ['models', provider],
    () => providerApi.getProviderModels(provider),
    {
      enabled: isAuthenticated && !!provider,
      onSuccess: (data) => {
        if (data.models?.length > 0 && !model) {
          setModel(data.models[0]);
        }
      }
    }
  );

  // 텍스트 완성 뮤테이션
  const completionMutation = useMutation(
    (data: any) => isStreaming
      ? completionApi.streamCompletion(data)
      : completionApi.createCompletion(data),
    {
      onSuccess: (data) => {
        if (!isStreaming) {
          // 스트리밍 아닌 경우 응답 추가
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.content
          }]);
        }
      },
      onError: (error: any) => {
        setError(error.response?.data?.error || '완성 요청 중 오류가 발생했습니다.');
      },
      onSettled: () => {
        setIsGenerating(false);
      }
    }
  );

  // 스트리밍 처리 함수
  const handleStreaming = async (data: any) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/v1/completions/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('스트리밍 요청 실패');
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('스트림 리더를 가져올 수 없습니다');
      }
      
      // 새 assistant 메시지 추가
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: ''
      }]);
      
      // 스트림 처리
      const decoder = new TextDecoder();
      let done = false;
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                // 현재 assistant 메시지에 텍스트 추가
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content += parsed.content;
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('스트림 파싱 실패:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('스트리밍 요청 중 오류:', error);
      setError('스트리밍 요청 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 메시지 제출 핸들러
  const handleSubmit = async () => {
    if (!userInput.trim() || !provider || !model) return;
    
    // 사용자 메시지 추가
    const userMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setError(null);
    
    // 완성 요청 데이터
    const requestData = {
      provider,
      model,
      messages: [...messages, userMessage],
      systemPrompt,
      temperature,
      maxTokens
    };
    
    if (isStreaming) {
      // 스트리밍 방식
      handleStreaming(requestData);
    } else {
      // 일반 요청
      setIsGenerating(true);
      completionMutation.mutate(requestData);
    }
  };

  // 대화 초기화
  const handleClearChat = () => {
    setMessages([]);
  };

  // 메시지 복사
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // 스크롤 처리
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 인증 확인
  useEffect(() => {
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI 플레이그라운드
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        다양한 AI 모델과 대화하고 테스트해보세요
      </Typography>

      {error && (
        <Alert severity="error" sx={{ my: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* 사이드바 - 모델 선택 및 설정 */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              모델 선택
            </Typography>
            
            <FormControl fullWidth margin="normal" disabled={isGenerating}>
              <InputLabel>AI 프로바이더</InputLabel>
              <Select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setModel(''); // 프로바이더 변경 시 모델 초기화
                }}
                label="AI 프로바이더"
              >
                {providersLoading ? (
                  <MenuItem value="">로딩 중...</MenuItem>
                ) : (
                  providers.map((p: any) => (
                    <MenuItem key={p.name} value={p.name}>
                      {p.displayName}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" disabled={isGenerating || !provider}>
              <InputLabel>모델</InputLabel>
              <Select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                label="모델"
              >
                {modelsLoading ? (
                  <MenuItem value="">로딩 중...</MenuItem>
                ) : (
                  models.models?.map((m: string) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  )) || []
                )}
              </Select>
            </FormControl>

            <Box mt={2}>
              <Button
                startIcon={showSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowSettings(!showSettings)}
                fullWidth
                variant="outlined"
              >
                고급 설정 {showSettings ? '접기' : '펼치기'}
              </Button>
            </Box>

            {showSettings && (
              <Box mt={2}>
                <Typography gutterBottom>시스템 프롬프트</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  disabled={isGenerating}
                  placeholder="AI에게 주는 기본 지시사항"
                />

                <Typography gutterBottom mt={2}>
                  온도: {temperature}
                </Typography>
                <Slider
                  value={temperature}
                  onChange={(_, value) => setTemperature(value as number)}
                  min={0}
                  max={1}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                  disabled={isGenerating}
                />

                <Typography gutterBottom mt={2}>
                  최대 토큰: {maxTokens}
                </Typography>
                <Slider
                  value={maxTokens}
                  onChange={(_, value) => setMaxTokens(value as number)}
                  min={100}
                  max={4000}
                  step={100}
                  marks
                  valueLabelDisplay="auto"
                  disabled={isGenerating}
                />

                <FormControlLabel
                  control={
                    <Switch 
                      checked={isStreaming} 
                      onChange={(e) => setIsStreaming(e.target.checked)}
                      disabled={isGenerating}
                    />
                  }
                  label="스트리밍 응답"
                  sx={{ mt: 2 }}
                />

                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ClearIcon />}
                  onClick={handleClearChat}
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={isGenerating || messages.length === 0}
                >
                  대화 초기화
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 메인 채팅 영역 */}
        <Grid item xs={12} md={8} lg={9}>
          <Paper 
            sx={{
              p: 2,
              height: '60vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* 메시지 표시 영역 */}
            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 1
              }}
            >
              {messages.length === 0 ? (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    opacity: 0.7
                  }}
                >
                  <DisplaySettingsIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                  <Typography variant="body1" align="center">
                    AI와 대화를 시작하세요
                  </Typography>
                </Box>
              ) : (
                messages.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
                      maxWidth: '90%',
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: msg.role === 'user' ? 'primary.50' : 'grey.50'
                      }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Chip
                            size="small"
                            label={msg.role === 'user' ? '사용자' : 'AI'}
                            color={msg.role === 'user' ? 'primary' : 'secondary'}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleCopyMessage(msg.content)}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Box sx={{ typography: 'body1', wordBreak: 'break-word' }}>
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown
                              components={{
                                code({node, inline, className, children, ...props}) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  )
                                }
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            msg.content
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* 입력 영역 */}
            <Box mt={2} display="flex" alignItems="center">
              <TextField
                fullWidth
                placeholder="메시지 입력..."
                variant="outlined"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isGenerating}
                multiline
                maxRows={3}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ ml: 1, px: 3, height: '56px' }}
                onClick={handleSubmit}
                disabled={!userInput.trim() || isGenerating || !provider || !model}
              >
                {isGenerating ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <SendIcon />
                )}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
