# 백엔드 개발 가이드

이 페이지에서는 MindRoute 프로젝트의 백엔드 개발 가이드를 제공합니다.

## 기술 스택

MindRoute 백엔드는 다음 기술로 구성되어 있습니다:

- **Node.js**: JavaScript 런타임
- **Express**: 웹 프레임워크
- **TypeScript**: 정적 타입 시스템
- **Sequelize**: ORM(Object-Relational Mapping)
- **PostgreSQL**: 관계형 데이터베이스
- **JWT**: 인증 토큰
- **Jest**: 테스트 프레임워크
- **Swagger**: API 문서화
- **Winston**: 로깅

## 프로젝트 구조

```
backend/
├── src/
│   ├── config/               # 환경 설정 및 구성
│   │   ├── database.ts       # 데이터베이스 설정
│   │   ├── environment.ts    # 환경 변수 관리
│   │   └── swagger.ts        # Swagger 설정
│   ├── controllers/          # 요청 처리 컨트롤러
│   │   ├── auth.controller.ts     # 인증 컨트롤러
│   │   ├── ai.controller.ts       # AI 관련 컨트롤러
│   │   ├── provider.controller.ts # 제공업체 컨트롤러
│   │   └── user.controller.ts     # 사용자 컨트롤러
│   ├── middlewares/          # 미들웨어
│   │   ├── auth.middleware.ts     # 인증 미들웨어
│   │   ├── error.middleware.ts    # 오류 처리 미들웨어
│   │   ├── validation.middleware.ts # 유효성 검사 미들웨어
│   │   └── logger.middleware.ts   # 로깅 미들웨어
│   ├── models/               # 데이터베이스 모델
│   │   ├── index.ts          # 모델 내보내기
│   │   ├── user.model.ts     # 사용자 모델
│   │   ├── provider.model.ts # 제공업체 모델
│   │   ├── refreshToken.model.ts # 리프레시 토큰 모델
│   │   └── log.model.ts      # 로그 모델
│   ├── routes/               # API 라우트
│   │   ├── index.ts          # 라우트 내보내기
│   │   ├── auth.routes.ts    # 인증 라우트
│   │   ├── ai.routes.ts      # AI 관련 라우트
│   │   └── user.routes.ts    # 사용자 라우트
│   ├── services/             # 비즈니스 로직
│   │   ├── auth.service.ts   # 인증 서비스
│   │   ├── ai.service.ts     # AI 서비스
│   │   ├── provider.service.ts # 제공업체 서비스
│   │   └── user.service.ts   # 사용자 서비스
│   ├── types/                # 타입 정의
│   │   ├── auth.types.ts     # 인증 관련 타입
│   │   ├── ai.types.ts       # AI 관련 타입
│   │   └── provider.types.ts # 제공업체 관련 타입
│   ├── utils/                # 유틸리티 함수
│   │   ├── jwt.ts            # JWT 관련 유틸리티
│   │   ├── crypto.ts         # 암호화 유틸리티
│   │   ├── logger.ts         # 로깅 유틸리티
│   │   └── response.ts       # 응답 포맷 유틸리티
│   ├── database/             # 데이터베이스 관련
│   │   ├── migrations/       # 마이그레이션 파일
│   │   └── seeders/          # 시드 데이터
│   ├── app.ts                # Express 앱 설정
│   └── index.ts              # 애플리케이션 진입점
├── tests/                    # 테스트 코드
│   ├── unit/                 # 단위 테스트
│   ├── integration/          # 통합 테스트
│   └── fixtures/             # 테스트 데이터
├── uploads/                  # 업로드 파일 저장소
├── logs/                     # 로그 파일
├── .env.example              # 환경 변수 예제
├── tsconfig.json             # TypeScript 설정
├── jest.config.js            # Jest 설정
└── package.json              # 의존성 및 스크립트
```

## 개발 가이드라인

### 코드 스타일

- **일관된 스타일**: Prettier와 ESLint를 사용하여 일관된 코드 스타일을 유지합니다.
- **명명 규칙**: 변수와 함수는 camelCase, 클래스는 PascalCase, 상수는 UPPER_SNAKE_CASE를 사용합니다.
- **타입 안전성**: TypeScript의 타입 시스템을 최대한 활용하여 코드의 안정성을 높입니다.

### RESTful API 설계

MindRoute는 RESTful API 설계 원칙을 따릅니다:

- **리소스 중심의 URL 구조**: `/api/providers/:providerId/models`와 같은 형식 사용
- **적절한 HTTP 메소드 사용**: GET(조회), POST(생성), PUT(전체 수정), PATCH(부분 수정), DELETE(삭제)
- **일관된 응답 포맷**: 모든 응답은 `{ success, data, message, error }` 형식 유지
- **적절한 상태 코드 사용**: 200(OK), 201(Created), 400(Bad Request), 401(Unauthorized) 등

### 레이어드 아키텍처

백엔드는 다음과 같은 레이어로 구조화됩니다:

1. **라우트 레이어**: 요청 경로 정의 및 라우팅
2. **컨트롤러 레이어**: 요청 검증 및 응답 처리
3. **서비스 레이어**: 비즈니스 로직 처리
4. **모델 레이어**: 데이터베이스 상호작용

각 레이어는 명확한 책임을 가지며, 의존성 방향은 항상 위에서 아래로 흐릅니다.

## 코드 예시

### 라우트 정의

```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateLogin, validateRegister } from '../middlewares/validation.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

export default router;
```

### 컨트롤러 구현

```typescript
// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseUtil } from '../utils/response';

export class AuthController {
  private authService = new AuthService();

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;
      const userData = await this.authService.register({ email, password, name });
      
      return ResponseUtil.success(res, '회원가입이 완료되었습니다.', userData);
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const userData = await this.authService.login(email, password);
      
      return ResponseUtil.success(res, null, userData);
    } catch (error) {
      next(error);
    }
  };

  // ... 다른 메소드들
}
```

### 서비스 구현

```typescript
// src/services/auth.service.ts
import bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { JwtUtil } from '../utils/jwt';
import { ApiError } from '../utils/error';
import { RefreshToken } from '../models/refreshToken.model';

export class AuthService {
  public register = async (userData: { email: string; password: string; name: string }) => {
    // 이메일 중복 확인
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new ApiError(409, '이미 사용 중인 이메일입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // 사용자 생성
    const user = await User.create({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      role: 'user',
    });

    // 토큰 생성
    const accessToken = JwtUtil.generateAccessToken(user.id);
    const refreshToken = JwtUtil.generateRefreshToken(user.id);
    
    // 리프레시 토큰 저장
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: '15m',
    };
  };

  // ... 다른 메소드들
}
```

### 미들웨어 구현

```typescript
// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt';
import { ApiError } from '../utils/error';
import { User } from '../models/user.model';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, '인증 토큰이 제공되지 않았습니다.'));
    }

    // 토큰 추출 및 검증
    const token = authHeader.split(' ')[1];
    const decoded = JwtUtil.verifyAccessToken(token);

    // 사용자 정보 로드
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return next(new ApiError(404, '사용자를 찾을 수 없습니다.'));
    }

    // 사용자가 비활성화된 경우
    if (!user.isActive) {
      return next(new ApiError(403, '계정이 비활성화되었습니다.'));
    }

    // 요청 객체에 사용자 정보 추가
    req.user = user;
    next();
  } catch (error) {
    // JWT 검증 실패
    return next(new ApiError(401, '인증 토큰이 유효하지 않습니다.'));
  }
};
```

### 유틸리티 함수

```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

export class JwtUtil {
  // 액세스 토큰 생성
  public static generateAccessToken(userId: string): string {
    return jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiresIn }
    );
  }

  // 리프레시 토큰 생성
  public static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      config.jwt.refreshSecret || config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  // 액세스 토큰 검증
  public static verifyAccessToken(token: string): any {
    return jwt.verify(token, config.jwt.secret);
  }

  // 리프레시 토큰 검증
  public static verifyRefreshToken(token: string): any {
    return jwt.verify(token, config.jwt.refreshSecret || config.jwt.secret);
  }
}
```

## AI 제공업체 통합

MindRoute의 핵심 기능인 AI 제공업체 통합을 위한 가이드입니다.

### 제공업체 추상화

제공업체별 차이점을 추상화하고 일관된 인터페이스를 제공합니다:

```typescript
// src/services/provider/provider.interface.ts
export interface AIProvider {
  initialize(): Promise<void>;
  getModels(): Promise<Model[]>;
  chatCompletion(request: ChatRequest): Promise<ChatResponse>;
  textCompletion(request: CompletionRequest): Promise<CompletionResponse>;
  supportsImages(): boolean;
  supportsVideo(): boolean;
  supportsFiles(): boolean;
}
```

### 제공업체별 구현

각 AI 제공업체에 대한 구체적인 구현을 제공합니다:

```typescript
// src/services/provider/openai.provider.ts
import { OpenAI } from 'openai';
import { AIProvider } from './provider.interface';
import { encryptionUtil } from '../../utils/crypto';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private settings: any;
  
  constructor(apiKey: string, settings: any) {
    const decryptedKey = encryptionUtil.decrypt(apiKey);
    this.client = new OpenAI({ apiKey: decryptedKey });
    this.settings = settings;
  }
  
  public async initialize(): Promise<void> {
    // 초기화 로직
  }
  
  public async getModels(): Promise<Model[]> {
    const response = await this.client.models.list();
    return response.data.map(model => ({
      id: model.id,
      name: model.id,
      description: model.id,
      isActive: true
    }));
  }
  
  public async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens,
    });
    
    return {
      id: response.id,
      providerId: 'openai',
      model: request.model,
      response: {
        content: response.choices[0].message.content,
        role: 'assistant'
      },
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      }
    };
  }
  
  // ... 다른 메소드 구현
  
  public supportsImages(): boolean {
    return true; // OpenAI는 이미지 지원
  }
  
  public supportsVideo(): boolean {
    return false; // OpenAI는 비디오 미지원
  }
  
  public supportsFiles(): boolean {
    return true; // OpenAI는 파일 지원
  }
}
```

### 제공업체 관리자

제공업체 객체의 생성, 캐싱, 관리를 담당합니다:

```typescript
// src/services/provider.service.ts
import { Provider } from '../models/provider.model';
import { OpenAIProvider } from './provider/openai.provider';
import { AnthropicProvider } from './provider/anthropic.provider';
import { GoogleAIProvider } from './provider/googleai.provider';
import { AIProvider } from './provider/provider.interface';
import { ApiError } from '../utils/error';
import { logger } from '../utils/logger';

export class ProviderService {
  private static providers: Map<string, AIProvider> = new Map();
  
  // 제공업체 객체 가져오기
  public static async getProvider(providerId: string): Promise<AIProvider> {
    // 캐시된 제공업체가 있는 경우
    if (this.providers.has(providerId)) {
      return this.providers.get(providerId)!;
    }
    
    // 데이터베이스에서 제공업체 정보 로드
    const providerData = await Provider.findOne({ 
      where: { id: providerId, isActive: true } 
    });
    
    if (!providerData) {
      throw new ApiError(404, '제공업체를 찾을 수 없습니다.');
    }
    
    // 제공업체별 구현 생성
    let provider: AIProvider;
    
    switch (providerData.name.toLowerCase()) {
      case 'openai':
        provider = new OpenAIProvider(providerData.apiKey, providerData.settings);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(providerData.apiKey, providerData.settings);
        break;
      case 'googleai':
        provider = new GoogleAIProvider(providerData.apiKey, providerData.settings);
        break;
      default:
        throw new ApiError(400, '지원되지 않는 제공업체입니다.');
    }
    
    // 제공업체 초기화
    try {
      await provider.initialize();
      
      // 캐시에 제공업체 저장
      this.providers.set(providerId, provider);
      
      return provider;
    } catch (error) {
      logger.error(`Provider initialization failed: ${error.message}`);
      throw new ApiError(500, '제공업체 초기화에 실패했습니다.');
    }
  }
  
  // 제공업체 캐시 클리어
  public static clearProviderCache(providerId?: string): void {
    if (providerId) {
      this.providers.delete(providerId);
    } else {
      this.providers.clear();
    }
  }
}
```

## 보안 고려사항

### API 키 암호화

민감한 API 키는 항상 암호화하여 저장합니다:

```typescript
// src/utils/crypto.ts
import crypto from 'crypto';
import { config } from '../config/environment';

export class EncryptionUtil {
  private algorithm = 'aes-256-cbc';
  private key = Buffer.from(config.encryption.key, 'hex');
  private iv = Buffer.from(config.encryption.iv, 'hex');
  
  // 암호화
  public encrypt(text: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  // 복호화
  public decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

export const encryptionUtil = new EncryptionUtil();
```

### 로깅 및 감사

모든 API 요청에 대한 로깅 및 감사를 수행합니다:

```typescript
// src/middlewares/logger.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { Log } from '../models/log.model';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // 요청 ID 생성
  const requestId = uuidv4();
  req.requestId = requestId;
  
  // 시작 시간 기록
  const startTime = Date.now();
  
  // 원본 응답 메소드를 가로채서 로깅 추가
  const originalSend = res.send;
  res.send = function(body) {
    // 응답 시간 계산
    const duration = Date.now() - startTime;
    
    // 요청 정보 로깅
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // AI 관련 요청일 경우 데이터베이스에 상세 로그 저장
    if (req.path.includes('/api/ai/providers')) {
      saveAPILog(req, res, body, duration);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// AI API 호출 로그 저장
async function saveAPILog(req: Request, res: Response, body: any, duration: number) {
  try {
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
    
    await Log.create({
      userId: req.user?.id,
      providerId: req.params.providerId,
      modelId: req.body.model,
      requestType: req.path.includes('/chat') ? 'chat' : 'completion',
      requestBody: req.body,
      responseBody: parsedBody.data,
      tokensUsed: parsedBody.data?.usage?.totalTokens,
      promptTokens: parsedBody.data?.usage?.promptTokens,
      completionTokens: parsedBody.data?.usage?.completionTokens,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    logger.error('API 로그 저장 실패', { error });
  }
}
```

## 테스트

백엔드 코드의 품질을 보장하기 위해 다양한 테스트를 작성합니다.

### 단위 테스트

개별 함수나 컴포넌트의 기능을 테스트합니다:

```typescript
// tests/unit/utils/jwt.test.ts
import jwt from 'jsonwebtoken';
import { JwtUtil } from '../../../src/utils/jwt';
import { config } from '../../../src/config/environment';

jest.mock('jsonwebtoken');

describe('JwtUtil', () => {
  const userId = '12345';
  
  beforeEach(() => {
    jest.resetAllMocks();
  });
  
  describe('generateAccessToken', () => {
    it('should call jwt.sign with correct parameters', () => {
      // Mock 설정
      (jwt.sign as jest.Mock).mockReturnValue('mocked-token');
      
      // 함수 호출
      const token = JwtUtil.generateAccessToken(userId);
      
      // 검증
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId },
        config.jwt.secret,
        { expiresIn: config.jwt.accessExpiresIn }
      );
      expect(token).toBe('mocked-token');
    });
  });
  
  // ... 다른 테스트 케이스
});
```

### 통합 테스트

API 엔드포인트가 예상대로 작동하는지 테스트합니다:

```typescript
// tests/integration/auth.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { User } from '../../src/models/user.model';
import { RefreshToken } from '../../src/models/refreshToken.model';

describe('Auth API', () => {
  // 테스트 데이터
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: '테스트 사용자'
  };
  
  // 테스트 후 정리
  afterAll(async () => {
    await User.destroy({ where: { email: testUser.email } });
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      
      // 사용자가 데이터베이스에 생성되었는지 확인
      const user = await User.findOne({ where: { email: testUser.email } });
      expect(user).toBeTruthy();
    });
    
    it('should fail when email is already registered', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('이미 사용 중인 이메일');
    });
  });
  
  // ... 다른 테스트 케이스
});
```

## 로깅

효과적인 디버깅과 모니터링을 위해 체계적인 로깅을 구현합니다:

```typescript
// src/utils/logger.ts
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config/environment';

// 로그 디렉토리 생성
const logDir = config.logging.dir || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 로거 설정
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mindroute-api' },
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // 정보 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      level: 'info'
    }),
    // 오류 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    })
  ]
});

export { logger };
```

## 활용 예시

MindRoute 백엔드에서 제공하는 AI 기능을 활용하는 예시:

### 여러 제공업체 지원

동일한 인터페이스로 여러 AI 제공업체를 지원합니다:

```typescript
// src/controllers/ai.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ProviderService } from '../services/provider.service';
import { ResponseUtil } from '../utils/response';
import { ApiError } from '../utils/error';

export class AIController {
  // 챗 완성 요청 처리
  public async chatCompletion(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId } = req.params;
      const { model, messages, temperature, max_tokens } = req.body;
      
      // 제공업체 객체 가져오기
      const provider = await ProviderService.getProvider(providerId);
      
      // 요청 처리
      const result = await provider.chatCompletion({
        model,
        messages,
        temperature,
        max_tokens
      });
      
      return ResponseUtil.success(res, null, result);
    } catch (error) {
      next(error);
    }
  }
  
  // 이미지가 포함된 채팅 처리
  public async chatWithMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId } = req.params;
      const { model, messages, temperature, max_tokens } = req.body;
      
      // 제공업체 객체 가져오기
      const provider = await ProviderService.getProvider(providerId);
      
      // 이미지 지원 확인
      if (!provider.supportsImages()) {
        throw new ApiError(400, '이 제공업체는 이미지를 지원하지 않습니다.');
      }
      
      // 이미지 파일 처리
      const imageFile = req.files?.image;
      if (!imageFile) {
        throw new ApiError(400, '이미지 파일이 제공되지 않았습니다.');
      }
      
      // 특정 제공업체에 맞게 요청 형식 조정하는 로직 구현
      // ...
      
      // 요청 처리
      const result = await provider.chatWithImage({
        model,
        messages,
        temperature,
        max_tokens,
        imageData: /* 이미지 데이터 처리 */
      });
      
      return ResponseUtil.success(res, null, result);
    } catch (error) {
      next(error);
    }
  }
}
```

## 참고 자료

- [Express 공식 문서](https://expressjs.com/)
- [Sequelize 공식 문서](https://sequelize.org/)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs)
- [Jest 테스트 프레임워크](https://jestjs.io/)
- [OpenAI API 문서](https://platform.openai.com/docs/api-reference)
- [Anthropic Claude API 문서](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Google AI API 문서](https://ai.google.dev/docs) 