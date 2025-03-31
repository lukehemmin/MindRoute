# MindRoute

MindRoute는 여러 AI 제공업체(OpenAI, Anthropic, Google AI)를 통합하여 단일 API로 제공하는 게이트웨이 시스템입니다.

## 주요 기능

- **다중 AI 제공업체 지원**: OpenAI, Anthropic(Claude), Google AI(Gemini) 통합
- **웹 기반 관리 인터페이스**: 사용자 및 API 키 관리
- **API 사용 로깅**: 모든 API 호출 기록 및 분석
- **API 문서**: Swagger를 통한 자동 생성 API 문서
- **플레이그라운드**: 웹 기반 AI 모델 테스트 환경

## 설치 및 실행

### 요구사항
- Docker와 Docker Compose
- Node.js (개발 시)

### 설치
```bash
git clone https://github.com/yourusername/MindRoute.git
cd MindRoute
docker-compose up -d
```

### 접속
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:4000
- API 문서: http://localhost:4000/api-docs

## 개발 환경 설정

### 백엔드 개발
```bash
cd backend
npm install
npm run dev
```

### 프론트엔드 개발
```bash
cd frontend
npm install
npm run dev
```