# 개발 환경 구성

이 페이지에서는 MindRoute 프로젝트의 개발 환경을 설정하는 방법을 안내합니다.

## 개발 도구

MindRoute 개발에 필요한 도구:

- **Node.js**: v18 이상 (LTS 버전 권장)
- **npm** 또는 **yarn**: 패키지 관리
- **Git**: 버전 관리
- **PostgreSQL**: 데이터베이스
- **Visual Studio Code** (권장): 코드 편집기
- **Postman** 또는 **Insomnia**: API 테스트
- **Docker** 및 **Docker Compose** (선택 사항): 컨테이너화

## 환경 변수 설정

### 백엔드 환경 변수

백엔드 폴더에 `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:

```bash
# 앱 설정
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=uploads
LOG_LEVEL=debug

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

# 암호화 설정
ENCRYPTION_KEY=your_32_character_encryption_key
ENCRYPTION_IV=your_16_character_iv

# 초기 관리자 계정
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongPassword123!
ADMIN_NAME=관리자

# 로깅 설정
LOG_DIR=logs
```

### 프론트엔드 환경 변수

프론트엔드 폴더에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정합니다:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=MindRoute
```

## 개발 환경 설정 단계

### 1. 저장소 복제

```bash
git clone https://github.com/lukehemmin/MindRoute.git
cd MindRoute
```

### 2. 데이터베이스 설정

PostgreSQL 서버가 실행 중인지 확인하고 데이터베이스를 생성합니다:

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE mindroute;

# 데이터베이스 접속 종료
\q
```

### 3. 백엔드 개발 환경 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 데이터베이스 마이그레이션 실행
npm run migrate

# 개발 서버 실행
npm run dev
```

#### 추천 VSCode 확장

백엔드 개발을 위한 VSCode 확장 프로그램:

- ESLint
- Prettier
- TypeScript
- DotENV
- PostgreSQL

### 4. 프론트엔드 개발 환경 설정

```bash
# 프론트엔드 디렉토리로 이동
cd ../frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

#### 추천 VSCode 확장

프론트엔드 개발을 위한 VSCode 확장 프로그램:

- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets

### 5. Docker를 사용한 개발 환경 설정 (선택 사항)

Docker를 사용하여 전체 개발 환경을 실행할 수 있습니다:

```bash
# 루트 디렉토리에서
docker-compose -f docker-compose.dev.yml up -d
```

## 디버깅

### 백엔드 디버깅

VSCode에서 디버깅을 위한 `.vscode/launch.json` 설정:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/index.ts",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "runtimeExecutable": "${workspaceFolder}/backend/node_modules/.bin/ts-node",
      "runtimeArgs": ["--transpile-only"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

로그 확인:

```bash
# 실시간 로그 보기
tail -f backend/logs/app.log
```

### 프론트엔드 디버깅

브라우저 개발자 도구를 사용하여 디버깅합니다:

- Chrome DevTools: F12 또는 Ctrl+Shift+I (Windows/Linux), Cmd+Option+I (Mac)
- React Developer Tools 확장 프로그램 설치
- Redux DevTools 확장 프로그램 설치 (Redux 사용 시)

## 코드 품질 및 스타일 관리

### Linting 및 Formatting

백엔드와 프론트엔드 모두 ESLint와 Prettier를 사용합니다.

```bash
# 백엔드 코드 린팅
cd backend
npm run lint

# 백엔드 코드 포맷팅
npm run format

# 프론트엔드 코드 린팅
cd ../frontend
npm run lint

# 프론트엔드 코드 포맷팅
npm run format
```

### Git Hooks

Husky를 사용하여 커밋 및 푸시 전에 코드 품질을 확인합니다.

```bash
# 루트 디렉토리에서
npm run prepare
```

## 테스트

### 백엔드 테스트

```bash
# 백엔드 디렉토리에서
npm test

# 특정 테스트 파일 실행
npm test -- --testPathPattern=auth.test.ts

# 커버리지 보고서 생성
npm run test:coverage
```

### 프론트엔드 테스트

```bash
# 프론트엔드 디렉토리에서
npm test

# 인터랙티브 모드로 테스트 실행
npm run test:watch

# 커버리지 보고서 생성
npm run test:coverage
```

## API 문서 생성

```bash
# 백엔드 디렉토리에서
npm run docs
```

생성된 문서는 `http://localhost:5000/api-docs`에서 확인할 수 있습니다.

## 개발 워크플로우

1. 이슈 확인 또는 새 이슈 생성
2. 새 브랜치 생성 (`feat/feature-name` 또는 `fix/bug-name`)
3. 코드 작성
4. 테스트 작성 및 실행
5. 린트 및 포맷 확인
6. 커밋 및 푸시
7. Pull Request 생성
8. 코드 리뷰 및 피드백 반영
9. 병합

## 트러블슈팅

### 일반적인 문제 해결

1. **의존성 오류**
   ```bash
   # node_modules 삭제 후 재설치
   rm -rf node_modules
   npm install
   ```

2. **데이터베이스 연결 오류**
   - PostgreSQL 서비스가 실행 중인지 확인
   - .env 파일의 데이터베이스 설정 확인
   - 네트워크 및 방화벽 설정 확인

3. **타입스크립트 오류**
   ```bash
   # 타입스크립트 캐시 삭제
   rm -rf backend/dist
   rm -rf frontend/.next
   ```

### 로그 확인

```bash
# 백엔드 로그 확인
cat backend/logs/app.log

# Docker 로그 확인
docker-compose logs -f
```

## 참고 자료

- [Node.js 공식 문서](https://nodejs.org/docs)
- [Express 공식 문서](https://expressjs.com/)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs)
- [React 공식 문서](https://reactjs.org/docs)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs)
- [Sequelize 공식 문서](https://sequelize.org/) 