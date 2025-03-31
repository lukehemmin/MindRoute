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

## 기술 스택

- **Backend**: Node.js, Express, TypeScript, Sequelize ORM
- **Frontend**: React, Next.js
- **Database**: PostgreSQL
- **Authentication**: JWT (리프레시 토큰 포함)
- **Security**: 비밀번호 해싱(bcrypt), API 키 암호화(AES)
- **Documentation**: Swagger/Redoc
- **Containerization**: Docker

## 시작하기

### 전제 조건

- Node.js (버전 18 이상)
- PostgreSQL
- Docker 및 Docker Compose (선택 사항)

### 로컬 설치

1. 저장소 복제:
   ```
   git clone https://github.com/yourusername/mindroute.git
   cd mindroute
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

- `GET /health`: API 게이트웨이 상태 확인 (데이터베이스 연결 상태 포함)
- `POST /api/auth/register`: 새 사용자 등록
- `POST /api/auth/login`: 사용자 로그인
- `POST /api/auth/refresh-token`: 액세스 토큰 갱신

## 데이터베이스 스키마

- **Users**: 사용자 정보 저장 (이메일, 비밀번호 해시, 역할 등)
- **Providers**: AI 제공업체 정보 (API 키, 엔드포인트, 미디어 정책 등)
- **UserProviders**: 사용자-제공업체 간 관계 및 사용자별 제한 설정
- **Logs**: API 호출 로그 (사용자, 제공업체, 토큰 사용량 등)
- **Tickets**: 사용자 문의 및 관리자 응답

## 개발 로드맵

1. ✅ 기본 아키텍처 및 POC
2. ✅ PostgreSQL DB 모델 및 기본 인증
3. 🔄 제공업체 관리자 및 핵심 라우팅 (진행 중)
4. ⬜ 전체 JWT 인증 및 보안 키 저장
5. ⬜ 웹 UI, 관리자 패널 및 로깅
6. ⬜ API 문서 및 Playground

## 보안 기능

- 비밀번호는 bcrypt를 사용하여 해싱됩니다.
- API 키는 AES-256 암호화를 사용하여 저장됩니다.
- JWT 토큰은 액세스 및 리프레시 토큰 메커니즘을 사용합니다.
- 요청별 제공업체 정책 검증 및 적용

## 라이선스

[MIT](LICENSE) 