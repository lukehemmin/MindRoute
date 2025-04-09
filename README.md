# MindRoute - AI API 게이트웨이

MindRoute는 여러 AI 제공업체(OpenAI, Anthropic, Google)를 단일 백엔드 API로 통합하는 API 게이트웨이 시스템입니다.

## 기능

- **다중 제공업체 지원**: OpenAI, Anthropic, Google AI Studio를 단일 API를 통해 사용
- **미디어 정책 관리**: 이미지, 비디오, 파일 업로드 허용 여부를 제공업체와 사용자별로 관리
- **웹 기반 관리 인터페이스**: 사용자 관리, API 키 관리, 로그 확인
- **사용량 로깅 및 분석**: 모든 API 호출의 상세 정보를 저장하고 분석
- **관리자 페이지**: 사용자 관리, 제공업체 설정, 문의 응답 기능
- **API 문서**: Swagger를 통한 자동 문서화
- **웹 기반 Playground**: AI 제공업체와의 상호작용을 테스트할 수 있는 UI
- **API 키 관리**: 사용자별 API 키 생성 및 관리

## 기술 스택

### 백엔드
- **언어 및 프레임워크**: Node.js, Express, TypeScript
- **ORM**: Sequelize
- **데이터베이스**: PostgreSQL
- **인증**: JWT (액세스 토큰/리프레시 토큰)
- **로깅**: Winston
- **보안**: bcrypt(비밀번호 해싱), express-rate-limit(요청 제한)
- **파일 처리**: express-fileupload, multer

### 프론트엔드
- **프레임워크**: React, Next.js
- **상태 관리**: React Context API
- **스타일링**: Tailwind CSS

### 인프라
- **컨테이너화**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **문서화**: Swagger/OpenAPI

## 시작하기

### 전제 조건

- Node.js (버전 18 이상)
- PostgreSQL
- Docker 및 Docker Compose (선택 사항)

### 로컬 설치

1. 저장소 복제:
   ```
   git clone https://github.com/lukehemmin/MindRoute.git
   cd MindRoute
   ```

2. 백엔드 설정:
   ```
   cd backend
   cp .env.example .env  # .env 파일을 필요에 맞게 수정
   npm install
   npm run dev
   ```

3. 프론트엔드 설정:
   ```
   cd frontend
   npm install
   npm run dev
   ```

4. Docker를 사용한 설치:
   ```
   docker-compose up -d
   ```

## API 엔드포인트

현재 구현된 엔드포인트:

### 상태 확인
- `GET /health`: API 게이트웨이 상태 확인 (데이터베이스 연결 상태 포함)
- `GET /api/ai/status`: AI 서비스 상태 확인

### 인증
- `POST /api/auth/register`: 새 사용자 등록
- `POST /api/auth/login`: 사용자 로그인
- `POST /api/auth/refresh-token`: 액세스 토큰 갱신
- `POST /api/auth/logout`: 로그아웃 (리프레시 토큰 취소)
- `POST /api/auth/forgot-password`: 비밀번호 재설정 요청
- `POST /api/auth/reset-password`: 비밀번호 재설정
- `GET /api/auth/verify-email/:token`: 이메일 확인
- `POST /api/auth/change-password`: 비밀번호 변경
- `GET /api/auth/profile`: 사용자 프로필 조회
- `PUT /api/auth/profile`: 사용자 프로필 업데이트

### API 키 관리
- `GET /api/users/api-keys`: 사용자 API 키 목록 조회
- `POST /api/users/api-keys`: 새 API 키 생성
- `DELETE /api/users/api-keys/:id`: API 키 삭제

### AI API
- `GET /api/ai/providers`: 사용 가능한 AI 제공업체 목록 조회
- `GET /api/ai/providers/:providerId/models`: 특정 제공업체의 모델 목록 조회
- `POST /api/ai/providers/:providerId/chat`: 채팅 완성 요청
- `POST /api/ai/providers/:providerId/completion`: 텍스트 완성 요청

### 관리자 API
- `GET /api/admin/users`: 사용자 목록 조회
- `PUT /api/admin/users/:id`: 사용자 정보 업데이트
- `GET /api/admin/providers`: 제공업체 목록 조회
- `POST /api/admin/providers`: 새 제공업체 추가
- `PUT /api/admin/providers/:id`: 제공업체 정보 업데이트
- `GET /api/admin/logs`: 시스템 로그 조회
- `GET /api/admin/tickets`: 사용자 문의 조회

## 데이터베이스 스키마

- **Users**: 사용자 정보 저장 (이메일, 비밀번호 해시, 역할 등)
- **RefreshTokens**: 리프레시 토큰 정보 저장 (사용자 ID, 토큰, 만료 시간 등)
- **ApiKeys**: 사용자 API 키 정보 저장 (키 값, 만료 시간 등)
- **Providers**: AI 제공업체 정보 (API 키, 엔드포인트, 미디어 정책 등)
- **UserProviders**: 사용자-제공업체 간 관계 및 사용자별 제한 설정
- **Logs**: API 호출 로그 (사용자, 제공업체, 토큰 사용량 등)
- **Tickets**: 사용자 문의 및 관리자 응답

## 개발 로드맵

1. ✅ 기본 아키텍처 및 POC
2. ✅ PostgreSQL DB 모델 및 기본 인증
3. ✅ 사용자 인증 및 계정 관리
4. ✅ 제공업체 관리 및 AI 엔드포인트 라우팅
5. ✅ API 키 관리 기능
6. 🔄 파일 업로드 및 미디어 처리 (진행 중)
7. 🔄 웹 UI, 관리자 패널 및 로깅 (진행 중)
8. ⬜ API 문서 및 Playground 개선

## 보안 기능

- **인증**: JWT 토큰 기반 인증 (액세스 및 리프레시 토큰)
- **비밀번호 보안**: bcrypt를 사용한 비밀번호 해싱
- **API 키 보호**: AES-256 암호화를 통한 API 키 저장
- **요청 제한**: express-rate-limit을 통한 DOS 공격 방지
- **보안 헤더**: helmet을 사용한 보안 HTTP 헤더 설정
- **CORS 보호**: 허용된 오리진만 접근 가능

## 기여하기

이 프로젝트에 기여하고 싶다면:

1. 이 저장소를 포크하세요
2. 새 기능 브랜치를 만드세요 (`git checkout -b feature/amazing-feature`)
3. 변경 사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치를 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 열어주세요

## 라이선스

[MIT](LICENSE) 