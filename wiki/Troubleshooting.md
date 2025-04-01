# 문제 해결 가이드

이 문서는 MindRoute 프로젝트 사용 중 발생할 수 있는 일반적인 문제와 그 해결 방법을 제공합니다.

## 목차

1. [설치 및 설정 문제](#설치-및-설정-문제)
2. [백엔드 관련 문제](#백엔드-관련-문제)
3. [프론트엔드 관련 문제](#프론트엔드-관련-문제)
4. [데이터베이스 관련 문제](#데이터베이스-관련-문제)
5. [AI 제공업체 연결 문제](#ai-제공업체-연결-문제)
6. [인증 및 권한 문제](#인증-및-권한-문제)
7. [성능 관련 문제](#성능-관련-문제)
8. [로그 분석](#로그-분석)
9. [지원 요청하기](#지원-요청하기)

## 설치 및 설정 문제

### 의존성 설치 오류

**문제**: `npm install` 실행 시 오류가 발생합니다.

**해결 방법**:

1. Node.js 버전이 프로젝트 요구사항(v18 이상)을 충족하는지 확인합니다:
   ```bash
   node -v
   ```

2. 패키지 캐시를 정리하고 다시 시도합니다:
   ```bash
   npm cache clean --force
   npm install
   ```

3. 패키지 잠금 파일을 삭제하고 다시 시도합니다:
   ```bash
   rm package-lock.json
   npm install
   ```

### 환경 변수 문제

**문제**: 애플리케이션이 환경 변수를 인식하지 못합니다.

**해결 방법**:

1. `.env` 파일이 올바른 위치(백엔드 및 프론트엔드 루트 디렉토리)에 있는지 확인합니다.

2. `.env.example` 파일을 참조하여 필요한 모든 환경 변수가 정의되어 있는지 확인합니다.

3. 환경 변수 형식이 올바른지 확인합니다(예: 따옴표 없음, 공백 없음).

4. 애플리케이션을 다시 시작하여 환경 변수를 다시 로드합니다.

### Docker 관련 문제

**문제**: Docker 컨테이너가 시작되지 않거나 오류가 발생합니다.

**해결 방법**:

1. Docker 및 Docker Compose가 설치되어 있는지 확인합니다:
   ```bash
   docker --version
   docker-compose --version
   ```

2. Docker 로그를 확인합니다:
   ```bash
   docker logs <container_id>
   ```

3. Docker 네트워크 및 볼륨을 정리하고 다시 시도합니다:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

4. Docker 컨테이너 간 네트워크 연결을 확인합니다:
   ```bash
   docker network inspect mindroute_network
   ```

## 백엔드 관련 문제

### 서버 시작 실패

**문제**: 백엔드 서버가 시작되지 않습니다.

**해결 방법**:

1. 포트 충돌이 있는지 확인합니다:
   ```bash
   lsof -i :5000
   ```
   
   충돌이 있는 경우 해당 프로세스를 종료하거나 다른 포트를 사용합니다.

2. 로그를 확인하여 오류 메시지를 파악합니다:
   ```bash
   npm run dev
   ```

3. TypeScript 컴파일 오류가 있는지 확인합니다:
   ```bash
   npm run build
   ```

### API 엔드포인트 오류

**문제**: API 엔드포인트가 404 또는 500 오류를 반환합니다.

**해결 방법**:

1. 라우트가 올바르게 등록되어 있는지 확인합니다. `src/routes` 디렉토리의 파일을 검사합니다.

2. 요청 메서드(GET, POST 등)가 올바른지 확인합니다.

3. 서버 로그를 확인하여 자세한 오류 메시지를 확인합니다.

4. 미들웨어가 요청을 차단하고 있는지 확인합니다(예: 인증, 속도 제한).

### 데이터베이스 연결 오류

**문제**: 백엔드가 데이터베이스에 연결할 수 없습니다.

**해결 방법**:

1. 데이터베이스 연결 문자열이 올바른지 확인합니다:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=mindroute
   DB_USER=postgres
   DB_PASSWORD=yourpassword
   ```

2. 데이터베이스 서버가 실행 중인지 확인합니다:
   ```bash
   pg_isready -h localhost -p 5432
   ```

3. 네트워크 방화벽이 데이터베이스 포트를 차단하고 있는지 확인합니다.

4. 데이터베이스 사용자에게 적절한 권한이 있는지 확인합니다.

## 프론트엔드 관련 문제

### 빌드 오류

**문제**: 프론트엔드 빌드가 실패합니다.

**해결 방법**:

1. 콘솔에서 구체적인 오류 메시지를 확인합니다.

2. 종속성 충돌이 있는지 확인합니다:
   ```bash
   npm ls
   ```

3. 노드 모듈을 정리하고 다시 설치합니다:
   ```bash
   rm -rf node_modules
   npm install
   ```

4. TypeScript 유형 정의가 최신 상태인지 확인합니다.

### API 연결 문제

**문제**: 프론트엔드가 백엔드 API에 연결할 수 없습니다.

**해결 방법**:

1. 백엔드 서버가 실행 중인지 확인합니다.

2. API 기본 URL이 올바르게 구성되어 있는지 확인합니다:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. CORS 설정이 올바른지 확인합니다. 백엔드에서 프론트엔드 출처를 허용해야 합니다.

4. 네트워크 탭에서 API 요청 및 응답을 확인합니다:
   - 브라우저 개발자 도구 열기
   - 네트워크 탭 선택
   - API 요청 검사

### 렌더링 문제

**문제**: 컴포넌트가 올바르게 렌더링되지 않거나 스타일이 깨집니다.

**해결 방법**:

1. 콘솔에서 JavaScript 오류를 확인합니다.

2. React 개발자 도구를 사용하여 컴포넌트 트리와 props를 검사합니다.

3. CSS 클래스 충돌이 있는지 확인합니다.

4. 브라우저 캐시를 정리하고 페이지를 새로 고칩니다(Ctrl+F5 또는 Cmd+Shift+R).

## 데이터베이스 관련 문제

### 마이그레이션 오류

**문제**: 데이터베이스 마이그레이션이 실패합니다.

**해결 방법**:

1. 마이그레이션 로그를 확인하여 구체적인 오류를 파악합니다.

2. 마이그레이션 파일에 구문 오류가 있는지 확인합니다.

3. 마이그레이션 상태를 확인합니다:
   ```bash
   npx sequelize-cli db:migrate:status
   ```

4. 마이그레이션을 롤백하고 다시 시도합니다:
   ```bash
   npx sequelize-cli db:migrate:undo
   npx sequelize-cli db:migrate
   ```

### 데이터 무결성 문제

**문제**: 데이터베이스 제약 조건 위반 오류가 발생합니다.

**해결 방법**:

1. 데이터베이스 스키마를 검사하여 제약 조건을 확인합니다:
   ```sql
   SELECT * FROM information_schema.table_constraints WHERE table_name = 'users';
   ```

2. 중복 데이터가 있는지 확인합니다:
   ```sql
   SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;
   ```

3. 외래 키 관계가 올바른지 확인합니다:
   ```sql
   SELECT * FROM providers WHERE id NOT IN (SELECT provider_id FROM user_providers);
   ```

## AI 제공업체 연결 문제

### API 키 인증 오류

**문제**: AI 제공업체에 인증할 수 없습니다.

**해결 방법**:

1. API 키가 올바른지 확인합니다:
   - API 키가 만료되었는지 확인
   - API 키 형식이 올바른지 확인(공백이나 줄바꿈 없음)
   - 제공업체 대시보드에서 키 상태 확인

2. 제공업체별로 필요한 추가 인증 매개변수가 설정되어 있는지 확인합니다.

3. 요청 헤더가 올바른 형식인지 확인합니다:
   - OpenAI: `Authorization: Bearer YOUR_API_KEY`
   - Anthropic: `x-api-key: YOUR_API_KEY`

### AI 응답 오류

**문제**: AI 제공업체가 오류를 반환하거나 응답이 없습니다.

**해결 방법**:

1. 요청 매개변수가 올바른지 확인합니다:
   - 모델 이름이 올바른지 확인
   - 메시지 형식이 올바른지 확인
   - 토큰 제한 및 온도와 같은 매개변수가 유효한지 확인

2. API 할당량 또는 속도 제한을 확인합니다:
   - 무료 티어 제한을 초과했는지 확인
   - 분당 요청 수 제한을 초과했는지 확인

3. 제공업체의 상태 페이지를 확인하여 서비스 중단이 있는지 확인합니다:
   - OpenAI: https://status.openai.com/
   - Anthropic: https://status.anthropic.com/
   - Google: https://status.cloud.google.com/

### 느린 응답 시간

**문제**: AI 제공업체의 응답이 비정상적으로 느립니다.

**해결 방법**:

1. 네트워크 지연 시간을 확인합니다:
   ```bash
   ping api.openai.com
   ```

2. 요청 복잡성을 줄여 봅니다:
   - 메시지 컨텍스트 크기 줄이기
   - 생성되는 토큰 수 제한하기

3. 응답 캐싱을 구현하여 동일한 요청에 대한 반복 호출을 줄입니다.

4. 여러 제공업체 간에 로드 밸런싱을 구현합니다.

## 인증 및 권한 문제

### 로그인 실패

**문제**: 사용자가 로그인할 수 없습니다.

**해결 방법**:

1. 사용자 자격 증명이 올바른지 확인합니다:
   - 이메일 주소 철자
   - 비밀번호 대소문자 구분

2. 데이터베이스에서 사용자 레코드를 확인합니다:
   ```sql
   SELECT * FROM users WHERE email = 'user@example.com';
   ```

3. 비밀번호 해싱 알고리즘이 올바르게 작동하는지 확인합니다.

4. 계정이 활성화되어 있는지 확인합니다:
   ```sql
   SELECT is_active FROM users WHERE email = 'user@example.com';
   ```

### JWT 토큰 문제

**문제**: JWT 토큰 검증 오류 또는 만료 문제가 발생합니다.

**해결 방법**:

1. JWT 비밀 키가 백엔드 환경 변수에 올바르게 설정되어 있는지 확인합니다:
   ```
   JWT_SECRET=your_secret_key
   ```

2. 토큰 만료 시간이 적절하게 설정되어 있는지 확인합니다:
   ```
   JWT_ACCESS_EXPIRATION=1h
   JWT_REFRESH_EXPIRATION=7d
   ```

3. 클라이언트와 서버 간의 시간 동기화를 확인합니다.

4. 토큰 구조를 디버깅합니다:
   - https://jwt.io에서 토큰 디코딩
   - 페이로드와 서명 확인

### 권한 부여 문제

**문제**: 사용자가 액세스 권한이 있어야 하는 리소스에 접근할 수 없습니다.

**해결 방법**:

1. 사용자 역할이 올바르게 설정되어 있는지 확인합니다:
   ```sql
   SELECT role FROM users WHERE id = 'user_id';
   ```

2. 권한 확인 미들웨어가 올바르게 작동하는지 확인합니다:
   ```typescript
   // src/middlewares/auth.middleware.ts의 역할 확인 로직
   ```

3. 리소스에 대한 액세스 제어 규칙을 검토합니다.

4. API 엔드포인트에 올바른 미들웨어가 적용되어 있는지 확인합니다.

## 성능 관련 문제

### 느린 API 응답

**문제**: API 응답이 비정상적으로 느립니다.

**해결 방법**:

1. 데이터베이스 쿼리 성능을 확인합니다:
   - 쿼리 실행 계획 분석
   - 느린 쿼리 로그 확인
   - 인덱스 최적화

2. 서버 리소스 사용량을 확인합니다:
   ```bash
   top
   htop
   ```

3. 데이터베이스 연결 풀 설정을 확인합니다:
   ```typescript
   // src/config/database.ts의 풀 설정
   ```

4. 요청 로깅을 활성화하여 병목 현상을 식별합니다:
   ```typescript
   // src/middleware/logging.middleware.ts
   ```

### 메모리 누수

**문제**: 시간이 지남에 따라 서버 메모리 사용량이 증가합니다.

**해결 방법**:

1. Node.js 힙 스냅샷을 생성하여 메모리 사용량을 분석합니다:
   ```bash
   node --inspect server.js
   ```
   Chrome DevTools를 사용하여 메모리 프로파일링합니다.

2. 이벤트 리스너와 타이머가 적절하게 정리되고 있는지 확인합니다.

3. 요청 핸들러에서 큰 객체가 유지되고 있는지 확인합니다.

4. Node.js 가비지 컬렉션 로깅을 활성화합니다:
   ```bash
   NODE_OPTIONS="--trace-gc" npm run dev
   ```

### 대용량 트래픽 처리

**문제**: 높은 트래픽 상황에서 애플리케이션이 응답하지 않습니다.

**해결 방법**:

1. 속도 제한 설정을 확인하고 조정합니다:
   ```typescript
   // src/middleware/rate-limit.middleware.ts의 설정
   ```

2. 캐싱 전략을 구현하거나 개선합니다:
   - Redis 캐싱 구성
   - 정적 자산에 대한 CDN 사용

3. 수평적 확장을 위해 로드 밸런서 뒤에 여러 인스턴스를 배포합니다.

4. 데이터베이스 읽기 복제본을 설정하여 부하를 분산시킵니다.

## 로그 분석

### 로그 위치

MindRoute의 로그 파일은 다음 위치에 저장됩니다:

- **백엔드 로그**: `backend/logs/`
  - `error.log`: 오류 메시지만 포함
  - `combined.log`: 모든 수준의 로그 메시지 포함
  - `http.log`: HTTP 요청 로그

- **Docker 로그**:
  ```bash
  docker logs mindroute_backend
  docker logs mindroute_frontend
  docker logs mindroute_db
  ```

### 로그 수준 조정

문제 해결에 더 자세한 정보가 필요한 경우 로그 수준을 조정합니다:

1. `.env` 파일에서 로그 수준 설정:
   ```
   LOG_LEVEL=debug
   ```

2. 서버를 다시 시작하여 변경 사항을 적용합니다.

### 일반적인 오류 코드

| 오류 코드 | 설명 | 일반적인 원인 |
|----------|------|-------------|
| AUTH_001 | 인증 실패 | 잘못된 자격 증명 |
| AUTH_002 | 토큰 만료 | 만료된 JWT 토큰 |
| AUTH_003 | 유효하지 않은 토큰 | 변조되거나 손상된 토큰 |
| API_001 | 제공업체 접근 불가 | 유효하지 않은 API 키 또는 권한 |
| API_002 | 제공업체 응답 시간 초과 | 네트워크 문제 또는 제공업체 중단 |
| DB_001 | 데이터베이스 연결 실패 | 구성 오류 또는 DB 서버 다운 |
| DB_002 | 쿼리 실행 오류 | SQL 구문 오류 또는 제약 조건 위반 |

## 지원 요청하기

위의 문제 해결 단계로 문제가 해결되지 않는 경우 다음 방법으로 지원을 요청할 수 있습니다:

1. **GitHub 이슈 생성**: [MindRoute 저장소](https://github.com/lukehemmin/MindRoute/issues)에 새 이슈를 생성합니다. 다음 정보를 포함하세요:
   - 문제 설명
   - 재현 단계
   - 오류 메시지 및 로그
   - 환경 정보(OS, Node.js 버전, 브라우저 등)

2. **커뮤니티 포럼**: 프로젝트 논의 포럼에 질문을 게시합니다.

3. **지원 티켓**: 프로덕션 배포의 경우 MindRoute 지원 팀에 직접 티켓을 제출합니다.

## 자주 묻는 질문 (FAQ)

### Q: 관리자 계정의 기본 자격 증명은 무엇인가요?

A: 관리자 계정은 첫 번째 실행 시 자동으로 생성됩니다. 기본 자격 증명은 다음과 같습니다:
- 이메일: `admin@mindroute.com`
- 비밀번호: `.env` 파일의 `ADMIN_PASSWORD` 값(기본값: `adminpassword`)

### Q: 데이터베이스를 재설정하는 방법은 무엇인가요?

A: 개발 환경에서 데이터베이스를 재설정하려면 다음 명령을 실행합니다:
```bash
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### Q: 프로덕션 환경에서 데이터를 백업하는 방법은 무엇인가요?

A: PostgreSQL 데이터베이스를 백업하려면 다음 명령을 사용합니다:
```bash
pg_dump -U postgres -d mindroute > backup_$(date +%Y-%m-%d).sql
```

### Q: 앱이 제대로 작동하는지 확인하는 간단한 방법은 무엇인가요?

A: 헬스 체크 엔드포인트를 호출하여 시스템 상태를 확인할 수 있습니다:
```bash
curl http://localhost:5000/api/health
```

정상 응답은 다음과 같습니다:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": "10h 30m 15s",
  "database": "connected"
}
``` 