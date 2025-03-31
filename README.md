# MindRoute - AI API 게이트웨이

MindRoute는 여러 AI 제공업체(OpenAI, Anthropic, Google)를 단일 백엔드 API로 통합하는 API 게이트웨이 시스템입니다.

## 기능

- **다중 제공업체 지원**: OpenAI, Anthropic, Google AI Studio를 단일 API를 통해 사용
- **웹 기반 관리 인터페이스**: 사용자 관리, API 키 관리, 로그 보기
- **사용량 로깅**: 모든 API 호출을 데이터베이스에 저장하고 분석
- **API 문서**: Swagger를 통한 자동 문서화
- **웹 기반 Playground**: AI 제공업체와의 상호작용을 테스트할 수 있는 UI

## 기술 스택

- Backend: Node.js, Express, TypeScript
- Frontend: React, Next.js (개발 예정)
- Database: MongoDB
- Authentication: JWT
- Documentation: Swagger
- Containerization: Docker

## 시작하기

### 전제 조건

- Node.js (버전 18 이상)
- MongoDB
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

3. Docker를 사용한 설치:
   ```
   docker-compose up -d
   ```

## API 엔드포인트

현재 구현된 엔드포인트:

- `GET /health`: API 게이트웨이 상태 확인

## 개발 로드맵

1. 기본 아키텍처 및 POC (현재 단계)
2. 데이터베이스 모델 및 기본 인증
3. 제공업체 관리자 및 핵심 라우팅
4. 전체 JWT 인증 및 보안 키 저장
5. 웹 UI 및 로깅
6. API 문서 및 Playground

## 라이선스

[MIT](LICENSE) 