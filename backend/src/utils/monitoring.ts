import { Express, Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import winston from 'winston';

// Prometheus 메트릭 설정
const collectDefaultMetrics = client.collectDefaultMetrics;
const Registry = client.Registry;
const register = new Registry();

// 기본 메트릭 수집 시작
collectDefaultMetrics({ register });

// API 요청 카운터 메트릭
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: '총 HTTP 요청 수',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// API 요청 지연 시간 메트릭 (히스토그램)
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP 요청 처리 지연 시간 (밀리초)',
  labelNames: ['method', 'route', 'status'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [register],
});

// AI 요청 카운터 메트릭
const aiRequestsTotal = new client.Counter({
  name: 'ai_requests_total',
  help: 'AI 제공업체별 요청 수',
  labelNames: ['provider', 'model', 'status'],
  registers: [register],
});

// AI 응답 토큰 메트릭
const aiResponseTokens = new client.Histogram({
  name: 'ai_response_tokens',
  help: 'AI 응답의 토큰 수',
  labelNames: ['provider', 'model'],
  buckets: [10, 50, 100, 500, 1000, 2000, 5000, 10000],
  registers: [register],
});

// 로거 설정
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mindroute-api' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
});

// 메트릭 미들웨어
const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // 응답이 완료된 후에 메트릭 기록
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;
    
    // HTTP 요청 카운터 증가
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode,
    });
    
    // 요청 처리 시간 기록
    httpRequestDurationMicroseconds.observe(
      { method: req.method, route, status: res.statusCode },
      duration
    );
    
    // 로그 기록
    logger.info(`${req.method} ${route} ${res.statusCode} ${duration}ms`);
  });
  
  next();
};

// AI 요청 메트릭 기록 함수
export const recordAIRequest = (
  provider: string,
  model: string,
  status: 'success' | 'error',
  tokens?: number
) => {
  aiRequestsTotal.inc({
    provider,
    model,
    status,
  });
  
  if (tokens && tokens > 0) {
    aiResponseTokens.observe({
      provider,
      model,
    }, tokens);
  }
  
  logger.info(`AI Request: ${provider} ${model} ${status} ${tokens || 0} tokens`);
};

// 모니터링 설정 함수
export const setupMetrics = (app: Express): void => {
  // 메트릭 미들웨어 등록
  app.use(metricsMiddleware);
  
  // Prometheus 메트릭 엔드포인트
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).end(err);
    }
  });
};

// 에러 로깅
export const logError = (error: Error, req?: Request): void => {
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req?.path,
    method: req?.method,
  });
};

export default logger;
