# 설치 및 설정

이 페이지에서는 MindRoute를 설치하고 구성하는 방법을 안내합니다.

## 요구 사항

MindRoute를 실행하기 위해 다음과 같은 소프트웨어가 필요합니다:

- Node.js v18 이상
- PostgreSQL 13 이상
- npm 또는 yarn 패키지 매니저
- (선택 사항) Docker 및 Docker Compose

## 로컬 개발 환경 설정

### 1. 저장소 복제

```bash
git clone https://github.com/lukehemmin/MindRoute.git
cd MindRoute
```

### 2. 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 구성
cp .env.example .env
```

`.env` 파일을 편집하여 다음 환경 변수를 설정하세요:

```
# 앱 설정
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mindroute
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_DIALECT=postgres

# JWT 설정
JWT_SECRET=your_jwt_secret_key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# 초기 관리자 계정
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongPassword123!
ADMIN_NAME=관리자
```

### 3. 데이터베이스 설정

PostgreSQL 데이터베이스를 생성하고 설정합니다:

```bash
# PostgreSQL에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE mindroute;

# 데이터베이스 접속 종료
\q
```

### 4. 백엔드 서버 실행

```bash
# 개발 모드 실행
npm run dev

# 또는 빌드 후 실행
npm run build
npm start
```

서버가 정상적으로 시작되면 `http://localhost:5000`에서 접근할 수 있습니다.

### 5. 프론트엔드 설정 (준비되면)

```bash
# 프론트엔드 디렉토리로 이동
cd ../frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:3000`에서 접근할 수 있습니다.

## Docker를 사용한 설정

### 1. Docker Compose 파일 구성

저장소 루트 디렉토리에 있는 `docker-compose.yml` 파일을 사용하거나 수정합니다.

### 2. 환경 변수 설정

`.env.docker` 파일을 생성하고 환경 변수를 설정합니다.

### 3. Docker Compose 실행

```bash
# 컨테이너 빌드 및 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

## 인증 프로바이더 설정

MindRoute에서 사용할 AI 제공업체의 API 키를 준비해야 합니다:

1. OpenAI API 키 ([OpenAI API](https://platform.openai.com/) 에서 발급)
2. Anthropic API 키 ([Anthropic API](https://console.anthropic.com/) 에서 발급)
3. Google AI Studio API 키 ([Google AI](https://ai.google.dev/) 에서 발급)

이 API 키들은 관리자 패널을 통해 설정하거나, 초기 데이터베이스 시드 스크립트를 통해 설정할 수 있습니다.

## 문제 해결

설치 또는 설정 중 문제가 발생하면 다음 사항을 확인하세요:

1. Node.js 및 PostgreSQL 버전이 요구 사항을 충족하는지 확인
2. 환경 변수가 올바르게 설정되었는지 확인
3. 데이터베이스 연결 정보가 정확한지 확인
4. 방화벽 설정이 필요한 포트를 허용하는지 확인

자세한 문제 해결 방법은 [문제 해결 가이드](Troubleshooting)를 참고하세요. 