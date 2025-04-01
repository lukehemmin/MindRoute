# 테스트 전략

이 페이지에서는 MindRoute 프로젝트의 테스트 전략과 방법을 설명합니다.

## 테스트 목표

MindRoute의 테스트 전략은 다음과 같은 목표를 달성하기 위해 설계되었습니다:

1. **품질 보장**: 소프트웨어의 기능적 요구사항과 비기능적 요구사항이 충족되는지 확인
2. **버그 조기 발견**: 개발 초기 단계에서 버그와 결함을 발견하여 수정 비용 절감
3. **지속적인 통합**: 새로운 코드 변경이 기존 기능에 부정적인 영향을 미치지 않도록 보장
4. **코드 품질 향상**: 테스트 주도 개발(TDD) 및 지속적인 리팩토링을 통한 코드 품질 향상
5. **성능 최적화**: 시스템의 성능 및 확장성 요구사항을 충족하는지 확인

## 테스트 유형

MindRoute는 다음과 같은 테스트 유형을 활용합니다:

### 1. 단위 테스트 (Unit Tests)

개별 함수, 클래스, 컴포넌트의 동작을 독립적으로 검증합니다.

- **도구**: Jest, React Testing Library
- **범위**: 모든 비즈니스 로직, 유틸리티 함수, 리액트 컴포넌트
- **목표 커버리지**: 코드 기반의 80% 이상

```javascript
// 백엔드 단위 테스트 예시 (src/utils/jwt.test.ts)
import { JwtUtil } from '../../src/utils/jwt';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('JwtUtil', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate an access token with the correct payload and options', () => {
      const userId = '12345';
      (jwt.sign as jest.Mock).mockReturnValue('test-token');

      const result = JwtUtil.generateAccessToken(userId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(result).toBe('test-token');
    });
  });
});
```

```javascript
// 프론트엔드 단위 테스트 예시 (src/components/Button.test.tsx)
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  it('renders with the correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders in disabled state when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### 2. 통합 테스트 (Integration Tests)

여러 컴포넌트나 모듈이 함께 작동할 때의 동작을 검증합니다.

- **도구**: Jest, Supertest
- **범위**: API 엔드포인트, 데이터베이스 상호작용, 서비스 계층 통합
- **목표 커버리지**: 모든 주요 API 경로 및 데이터 흐름

```javascript
// 백엔드 통합 테스트 예시 (tests/integration/auth.test.ts)
import request from 'supertest';
import { app } from '../../src/app';
import { User } from '../../src/models/user.model';
import { sequelize } from '../../src/config/database';

describe('Auth API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: '테스트 사용자'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      
      // 사용자가 데이터베이스에 생성되었는지 확인
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user).toBeTruthy();
    });

    it('should return error when email already exists', async () => {
      // 동일한 이메일로 다시 요청
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: '중복 사용자'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('이미 사용 중인 이메일');
    });
  });
});
```

### 3. E2E(End-to-End) 테스트

실제 사용자의 워크플로우를 시뮬레이션하여 전체 시스템이 올바르게 작동하는지 검증합니다.

- **도구**: Cypress, Playwright
- **범위**: 주요 사용자 흐름(로그인, 대시보드, AI 요청 등)
- **목표**: 핵심 사용자 경로에 대한 완전한 커버리지

```javascript
// E2E 테스트 예시 (cypress/integration/auth.spec.js)
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should allow user to register, login and view dashboard', () => {
    const email = `test${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    
    // 회원가입
    cy.get('[data-test="register-link"]').click();
    cy.url().should('include', '/register');
    
    cy.get('[data-test="email-input"]').type(email);
    cy.get('[data-test="password-input"]').type(password);
    cy.get('[data-test="name-input"]').type('테스트 사용자');
    cy.get('[data-test="register-button"]').click();
    
    // 로그인 페이지로 리디렉션
    cy.url().should('include', '/login');
    
    // 로그인
    cy.get('[data-test="email-input"]').type(email);
    cy.get('[data-test="password-input"]').type(password);
    cy.get('[data-test="login-button"]').click();
    
    // 대시보드로 리디렉션
    cy.url().should('include', '/dashboard');
    
    // 사용자 정보 확인
    cy.get('[data-test="user-info"]').should('contain', '테스트 사용자');
  });
});
```

### 4. 성능 테스트

시스템의 응답성, 확장성, 안정성을 검증합니다.

- **도구**: JMeter, Artillery
- **범위**: API 엔드포인트, 데이터베이스 쿼리
- **목표**: 지정된 부하에서의 응답 시간 및 처리량 요구사항 충족

```javascript
// Artillery 성능 테스트 예시 (performance/load-test.yml)
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 5
      rampTo: 50
      name: "Warm up phase"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load phase"
  defaults:
    headers:
      Content-Type: "application/json"

scenarios:
  - name: "Login and make AI requests"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "Password123!"
          capture:
            json: "$.data.accessToken"
            as: "token"
      
      - get:
          url: "/api/ai/providers"
          headers:
            Authorization: "Bearer {{ token }}"
          capture:
            json: "$.data[0].id"
            as: "providerId"
            
      - post:
          url: "/api/ai/providers/{{ providerId }}/chat"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            model: "gpt-3.5-turbo"
            messages:
              - role: "user"
                content: "Hello, how are you today?"
            temperature: 0.7
            max_tokens: 100
```

### 5. 보안 테스트

시스템의 보안 취약점을 식별하고 조치합니다.

- **도구**: OWASP ZAP, SonarQube
- **범위**: 인증, 권한 부여, 입력 유효성 검사, 데이터 암호화
- **목표**: OWASP Top 10 취약점 없음

```bash
# ZAP CLI를 사용한 보안 스캔
zap-cli quick-scan --self-contained --start-options "-config api.disablekey=true" http://localhost:5000/
```

## 테스트 환경

MindRoute는 다음과 같은 테스트 환경을 사용합니다:

1. **로컬 개발 환경**: 개발자 로컬 머신에서의 테스트
2. **CI 환경**: GitHub Actions를 통한 자동화된 테스트
3. **스테이징 환경**: 프로덕션과 유사한 환경에서의 테스트
4. **프로덕션 환경**: 실제 운영 환경에서의 모니터링 및 테스트

## 테스트 데이터 관리

테스트에는 다음과 같은 데이터 소스를 사용합니다:

1. **In-memory 데이터베이스**: 단위 테스트용 (예: SQLite)
2. **테스트 전용 데이터베이스**: 통합 테스트용
3. **픽스처 및 팩토리**: 테스트 데이터 생성
4. **모킹 및 스텁**: 외부 의존성 격리

```javascript
// 테스트 픽스처 예시 (tests/fixtures/users.js)
const userFixtures = {
  validUser: {
    id: '12345',
    email: 'test@example.com',
    name: '테스트 사용자',
    password: 'hashedPassword123',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  adminUser: {
    id: '67890',
    email: 'admin@example.com',
    name: '관리자',
    password: 'hashedPassword456',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

export default userFixtures;
```

## CI/CD 통합

테스트는 CI/CD 파이프라인에 통합되어 자동으로 실행됩니다:

1. **코드 푸시/PR**: 단위 테스트 및 린트 검사
2. **PR 머지**: 통합 테스트 및 E2E 테스트
3. **스테이징 배포**: 전체 테스트 스위트 및 성능 테스트
4. **프로덕션 배포**: 스모크 테스트 및 카나리 테스트

```yaml
# GitHub Actions CI 설정 예시 (.github/workflows/ci.yml)
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: mindroute_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend
          npm ci
          
      - name: Lint
        run: |
          cd backend
          npm run lint
          
      - name: Unit Tests
        run: |
          cd backend
          npm run test:unit
          
      - name: Integration Tests
        run: |
          cd backend
          npm run test:integration
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: mindroute_test
          DB_USER: postgres
          DB_PASSWORD: postgres
```

## 테스트 커버리지 측정

코드 커버리지는 다음 도구를 사용하여 측정하고 모니터링합니다:

1. **Jest Coverage**: 단위 및 통합 테스트 커버리지
2. **Cypress Coverage**: E2E 테스트 커버리지
3. **SonarQube**: 전체 코드 품질 및 커버리지 분석

```javascript
// Jest 커버리지 설정 (jest.config.js)
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
  // ...기타 설정
};
```

## 테스트 작성 가이드라인

### 단위 테스트 가이드라인

1. **테스트 구조**: AAA(Arrange-Act-Assert) 패턴 사용
2. **테스트 격리**: 각 테스트는 독립적이고 자족적이어야 함
3. **모킹 사용**: 외부 의존성은 항상 모킹
4. **명확한 테스트 이름**: `should [동작] when [조건]` 형식 권장

```javascript
// 올바른 단위 테스트 예시
describe('AuthService', () => {
  describe('login', () => {
    // 올바른 이름 지정
    it('should return user and tokens when credentials are valid', async () => {
      // Arrange
      const mockUser = { id: '1', email: 'test@example.com', password: 'hashedPassword' };
      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(mockUser)
      };
      const mockPasswordUtil = {
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      const service = new AuthService(mockUserRepository, mockPasswordUtil);
      
      // Act
      const result = await service.login('test@example.com', 'password');
      
      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });
  });
});
```

### 통합 테스트 가이드라인

1. **테스트 데이터 관리**: 각 테스트 시작 전 데이터베이스 초기화
2. **API 테스트**: 실제 API 엔드포인트를 호출하여 테스트
3. **트랜잭션 사용**: 테스트 간 데이터 격리를 위해 트랜잭션 사용
4. **환경 변수**: 테스트 환경에 맞는 환경 변수 사용

```javascript
// 통합 테스트 설정 예시
beforeAll(async () => {
  // 테스트 데이터베이스 연결
  await sequelize.authenticate();
  
  // 테이블 생성
  await sequelize.sync({ force: true });
  
  // 기본 데이터 생성
  await User.create({
    id: '12345',
    email: 'test@example.com',
    password: await bcrypt.hash('Password123!', 10),
    name: '테스트 사용자',
    role: 'user'
  });
});

afterAll(async () => {
  // 테스트 데이터베이스 연결 종료
  await sequelize.close();
});
```

### E2E 테스트 가이드라인

1. **사용자 중심**: 실제 사용자 흐름을 시뮬레이션
2. **CSS 셀렉터**: 데이터 속성(`data-test`)을 사용하여 요소 선택
3. **안정성 확보**: 비동기 작업 처리를 위한 적절한 대기 조건 사용
4. **크로스 브라우저**: 여러 브라우저에서 테스트

```javascript
// E2E 테스트 모범 사례
// 페이지 객체 패턴 사용
class LoginPage {
  visit() {
    cy.visit('/login');
  }
  
  fillEmail(email) {
    cy.get('[data-test="email-input"]').type(email);
  }
  
  fillPassword(password) {
    cy.get('[data-test="password-input"]').type(password);
  }
  
  submit() {
    cy.get('[data-test="login-button"]').click();
  }
  
  login(email, password) {
    this.visit();
    this.fillEmail(email);
    this.fillPassword(password);
    this.submit();
  }
}

// 테스트 예시
describe('Login Page', () => {
  const loginPage = new LoginPage();
  
  it('should redirect to dashboard after successful login', () => {
    loginPage.login('test@example.com', 'Password123!');
    cy.url().should('include', '/dashboard');
  });
});
```

## 테스트 실행

### 로컬 환경에서 테스트 실행

```bash
# 백엔드 단위 테스트
cd backend
npm run test:unit

# 백엔드 통합 테스트
npm run test:integration

# 백엔드 전체 테스트
npm test

# 프론트엔드 테스트
cd ../frontend
npm test

# E2E 테스트
npm run test:e2e
```

### CI 환경에서 테스트 실행

GitHub Actions 워크플로우가 자동으로 PR 및 푸시에 대해 테스트를 실행합니다.

## 버그 리포팅 및 추적

테스트에서 발견된 버그는 다음 과정을 통해 관리됩니다:

1. **버그 리포트 작성**: GitHub Issues에 자세한 재현 단계 포함
2. **우선순위 설정**: 심각도 및 영향도에 따라 우선순위 지정
3. **할당 및 추적**: 담당자 지정 및 진행 상황 추적
4. **재발 방지**: 버그에 대한 회귀 테스트 작성

## 모니터링 및 분석

테스트 프로세스 개선을 위한 모니터링 및 분석:

1. **테스트 실행 시간**: 느린 테스트 식별 및 최적화
2. **실패율**: 자주 실패하는 테스트 식별 및 개선
3. **커버리지 추세**: 시간에 따른 테스트 커버리지 변화 추적
4. **품질 지표**: 버그 발견 비율, 수정 시간 등의 지표 추적

## 참고 자료

- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [Cypress 공식 문서](https://docs.cypress.io/guides/overview/why-cypress)
- [React Testing Library 문서](https://testing-library.com/docs/react-testing-library/intro/)
- [테스트 주도 개발(TDD) 가이드](https://www.agilealliance.org/glossary/tdd/)
- [백엔드 개발 가이드](Backend-Development)
- [프론트엔드 개발 가이드](Frontend-Development) 