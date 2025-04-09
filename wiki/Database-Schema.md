# 데이터베이스 스키마

MindRoute는 PostgreSQL 데이터베이스를 사용하여 사용자, 제공업체, 로그 등의 모든 데이터를 저장합니다. 이 페이지에서는 데이터베이스 스키마와 각 테이블의 구조를 설명합니다.

## 개요

데이터베이스 스키마는 다음과 같은 주요 테이블로 구성됩니다:

- **Users**: 사용자 계정 정보
- **RefreshTokens**: 사용자 리프레시 토큰
- **Providers**: AI 제공업체 정보
- **UserProviders**: 사용자별 제공업체 설정
- **ApiKeys**: 사용자 API 키
- **Logs**: API 호출 로그
- **Tickets**: 사용자 문의 및 지원 요청

## ERD (Entity Relationship Diagram)

![데이터베이스 ERD](/assets/images/database-erd.png)

## 테이블 상세 정보

### Users

사용자 계정 정보를 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 | 제약 조건 |
|--------|------------|------|-----------|
| id | UUID | 사용자 고유 식별자 | PRIMARY KEY |
| email | VARCHAR(255) | 사용자 이메일 | UNIQUE, NOT NULL |
| password | VARCHAR(255) | 해시된 사용자 비밀번호 | NOT NULL |
| name | VARCHAR(100) | 사용자 이름 | NOT NULL |
| role | ENUM | 사용자 역할 (admin, user) | NOT NULL, DEFAULT 'user' |
| isActive | BOOLEAN | 계정 활성화 상태 | NOT NULL, DEFAULT true |
| lastLogin | TIMESTAMP | 마지막 로그인 시간 | |
| createdAt | TIMESTAMP | 생성 시간 | NOT NULL, DEFAULT NOW() |
| updatedAt | TIMESTAMP | 수정 시간 | NOT NULL, DEFAULT NOW() |

```sql
CREATE TABLE Users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  isActive BOOLEAN NOT NULL DEFAULT true,
  lastLogin TIMESTAMP,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### RefreshTokens

사용자 리프레시 토큰을 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 | 제약 조건 |
|--------|------------|------|-----------|
| id | UUID | 토큰 고유 식별자 | PRIMARY KEY |
| userId | UUID | 사용자 ID | FOREIGN KEY |
| token | VARCHAR(255) | 리프레시 토큰 값 | UNIQUE, NOT NULL |
| expiresAt | TIMESTAMP | 토큰 만료 시간 | NOT NULL |
| isRevoked | BOOLEAN | 토큰 취소 여부 | NOT NULL, DEFAULT false |
| createdAt | TIMESTAMP | 생성 시간 | NOT NULL, DEFAULT NOW() |
| updatedAt | TIMESTAMP | 수정 시간 | NOT NULL, DEFAULT NOW() |

```sql
CREATE TABLE RefreshTokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  isRevoked BOOLEAN NOT NULL DEFAULT false,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### ApiKeys

사용자 API 키를 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 | 제약 조건 |
|--------|------------|------|-----------|
| id | UUID | API 키 고유 식별자 | PRIMARY KEY |
| userId | INTEGER | 사용자 ID | FOREIGN KEY |
| name | VARCHAR(255) | API 키 이름 | NOT NULL |
| key | VARCHAR(255) | API 키 값 | UNIQUE, NOT NULL |
| lastUsedAt | TIMESTAMP | 마지막 사용 시간 | |
| expiresAt | TIMESTAMP | 만료 시간 | |
| createdAt | TIMESTAMP | 생성 시간 | NOT NULL, DEFAULT NOW() |
| updatedAt | TIMESTAMP | 수정 시간 | NOT NULL, DEFAULT NOW() |

```sql
CREATE TABLE ApiKeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key VARCHAR(255) UNIQUE NOT NULL,
  lastUsedAt TIMESTAMP,
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Providers

AI 제공업체 정보를 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 | 제약 조건 |
|--------|------------|------|-----------|
| id | UUID | 제공업체 고유 식별자 | PRIMARY KEY |
| name | VARCHAR(100) | 제공업체 이름 | UNIQUE, NOT NULL |
| apiKey | TEXT | 암호화된 API 키 | |
| endpointUrl | VARCHAR(255) | API 엔드포인트 URL | |
| allowImages | BOOLEAN | 이미지 허용 여부 | NOT NULL, DEFAULT false |
| allowVideos | BOOLEAN | 비디오 허용 여부 | NOT NULL, DEFAULT false |
| allowFiles | BOOLEAN | 파일 허용 여부 | NOT NULL, DEFAULT false |
| maxTokens | INTEGER | 최대 토큰 수 | |
| settings | JSONB | 추가 설정 (JSON 형식) | |
| isActive | BOOLEAN | 활성화 상태 | NOT NULL, DEFAULT true |
| createdAt | TIMESTAMP | 생성 시간 | NOT NULL, DEFAULT NOW() |
| updatedAt | TIMESTAMP | 수정 시간 | NOT NULL, DEFAULT NOW() |

```sql
CREATE TABLE Providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  apiKey TEXT,
  endpointUrl VARCHAR(255),
  allowImages BOOLEAN NOT NULL DEFAULT false,
  allowVideos BOOLEAN NOT NULL DEFAULT false,
  allowFiles BOOLEAN NOT NULL DEFAULT false,
  maxTokens INTEGER,
  settings JSONB,
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### UserProviders

사용자별 제공업체 설정을 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 | 제약 조건 |
|--------|------------|------|-----------|
| id | UUID | 고유 식별자 | PRIMARY KEY |
| userId | UUID | 사용자 ID | FOREIGN KEY |
| providerId | UUID | 제공업체 ID | FOREIGN KEY |
| allowed | BOOLEAN | 접근 허용 여부 | NOT NULL, DEFAULT true |
| maxTokensOverride | INTEGER | 사용자별 최대 토큰 수 | |
| settings | JSONB | 사용자별 추가 설정 | |
| createdAt | TIMESTAMP | 생성 시간 | NOT NULL, DEFAULT NOW() |
| updatedAt | TIMESTAMP | 수정 시간 | NOT NULL, DEFAULT NOW() |

```sql
CREATE TABLE UserProviders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  providerId UUID NOT NULL REFERENCES Providers(id) ON DELETE CASCADE,
  allowed BOOLEAN NOT NULL DEFAULT true,
  maxTokensOverride INTEGER,
  settings JSONB,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (userId, providerId)
);
```

### Logs

API 호출 로그를 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 | 제약 조건 |
|--------|------------|------|-----------|
| id | UUID | 로그 고유 식별자 | PRIMARY KEY |
| userId | UUID | 사용자 ID | FOREIGN KEY |
| providerId | UUID | 제공업체 ID | FOREIGN KEY |
| modelId | VARCHAR(100) | 사용된 모델 ID | |
| requestType | VARCHAR(50) | 요청 유형 (chat, completion, etc.) | NOT NULL |
| requestBody | JSONB | 요청 내용 (JSON 형식) | |
| responseBody | JSONB | 응답 내용 (JSON 형식) | |
| tokensUsed | INTEGER | 사용된 토큰 수 | |
| promptTokens | INTEGER | 프롬프트 토큰 수 | |
| completionTokens | INTEGER | 완성 토큰 수 | |
| statusCode | INTEGER | HTTP 상태 코드 | |
| errorMessage | TEXT | 오류 메시지 (실패한 경우) | |
| duration | INTEGER | 요청 처리 시간 (ms) | |
| ip | VARCHAR(50) | 요청 IP 주소 | |
| userAgent | TEXT | 사용자 에이전트 | |
| createdAt | TIMESTAMP | 생성 시간 | NOT NULL, DEFAULT NOW() |

```sql
CREATE TABLE Logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID REFERENCES Users(id) ON DELETE SET NULL,
  providerId UUID REFERENCES Providers(id) ON DELETE SET NULL,
  modelId VARCHAR(100),
  requestType VARCHAR(50) NOT NULL,
  requestBody JSONB,
  responseBody JSONB,
  tokensUsed INTEGER,
  promptTokens INTEGER,
  completionTokens INTEGER,
  statusCode INTEGER,
  errorMessage TEXT,
  duration INTEGER,
  ip VARCHAR(50),
  userAgent TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Tickets

사용자 문의 및 지원 요청을 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 | 제약 조건 |
|--------|------------|------|-----------|
| id | UUID | 티켓 고유 식별자 | PRIMARY KEY |
| userId | UUID | 사용자 ID | FOREIGN KEY |
| subject | VARCHAR(255) | 문의 제목 | NOT NULL |
| message | TEXT | 문의 내용 | NOT NULL |
| status | ENUM | 상태 (open, in_progress, resolved, closed) | NOT NULL, DEFAULT 'open' |
| adminResponse | TEXT | 관리자 응답 내용 | |
| adminId | UUID | 응답한 관리자 ID | FOREIGN KEY |
| createdAt | TIMESTAMP | 생성 시간 | NOT NULL, DEFAULT NOW() |
| updatedAt | TIMESTAMP | 수정 시간 | NOT NULL, DEFAULT NOW() |
| resolvedAt | TIMESTAMP | 해결 시간 | |

```sql
CREATE TABLE Tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  adminResponse TEXT,
  adminId UUID REFERENCES Users(id) ON DELETE SET NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  resolvedAt TIMESTAMP
);
```

## 인덱스

성능 최적화를 위해 다음과 같은 인덱스를 생성합니다:

```sql
-- Logs 테이블 인덱스
CREATE INDEX logs_userid_idx ON Logs(userId);
CREATE INDEX logs_providerid_idx ON Logs(providerId);
CREATE INDEX logs_createdat_idx ON Logs(createdAt);
CREATE INDEX logs_modelid_idx ON Logs(modelId);

-- RefreshTokens 테이블 인덱스
CREATE INDEX refreshtokens_userid_idx ON RefreshTokens(userId);
CREATE INDEX refreshtokens_token_idx ON RefreshTokens(token);
CREATE INDEX refreshtokens_expiresat_idx ON RefreshTokens(expiresAt);

-- ApiKeys 테이블 인덱스
CREATE INDEX apikeys_userid_idx ON ApiKeys(userId);
CREATE INDEX apikeys_key_idx ON ApiKeys(key);
CREATE INDEX apikeys_expiresat_idx ON ApiKeys(expiresAt);

-- Tickets 테이블 인덱스
CREATE INDEX tickets_userid_idx ON Tickets(userId);
CREATE INDEX tickets_status_idx ON Tickets(status);
CREATE INDEX tickets_createdat_idx ON Tickets(createdAt);
```

## 마이그레이션 관리

데이터베이스 스키마 변경을 관리하기 위해 Sequelize 마이그레이션을 사용합니다. 이를 통해 버전 관리 및 변경 이력 추적이 가능합니다.

### 마이그레이션 폴더 구조

```
backend/
└── src/
    └── database/
        ├── migrations/
        │   ├── 20231001000000-create-users.js
        │   ├── 20231001000001-create-refresh-tokens.js
        │   ├── 20231001000002-create-providers.js
        │   └── ...
        └── seeders/
            ├── 20231001000000-admin-user.js
            ├── 20231001000001-default-providers.js
            └── ...
```

### 마이그레이션 명령어

```bash
# 마이그레이션 실행
npx sequelize-cli db:migrate

# 마이그레이션 롤백
npx sequelize-cli db:migrate:undo

# 시드 데이터 추가
npx sequelize-cli db:seed:all
```

## 데이터베이스 백업 및 복원

프로덕션 환경에서는 정기적인 데이터베이스 백업이 중요합니다.

### 백업 명령어

```bash
pg_dump -U postgres -d mindroute > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 복원 명령어

```bash
psql -U postgres -d mindroute < backup_file.sql
``` 