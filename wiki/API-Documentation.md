# API 문서

MindRoute API는 RESTful 방식으로 설계되었으며, 다양한 AI 제공업체와의 통합을 위한 엔드포인트를 제공합니다.

## 기본 정보

- **기본 URL**: `https://api.mindroute.example.com` (프로덕션) 또는 `http://localhost:5000` (개발)
- **API 버전**: v1
- **콘텐츠 유형**: `application/json`
- **인증**: Bearer 토큰 (JWT)

## 인증

MindRoute API는 JWT(JSON Web Token) 기반 인증을 사용합니다. 액세스 토큰과 리프레시 토큰을 통해 사용자 인증을 처리합니다.

### 인증 헤더 형식

```
Authorization: Bearer <access_token>
```

### 인증 엔드포인트

#### 사용자 등록

```
POST /api/auth/register
```

**요청 본문**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "홍길동"
}
```

**응답**:
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

#### 로그인

```
POST /api/auth/login
```

**요청 본문**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

#### 토큰 갱신

```
POST /api/auth/refresh-token
```

**요청 본문**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

#### 로그아웃

```
POST /api/auth/logout
```

**요청 본문**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**응답**:
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

## API 키 관리

MindRoute API는 사용자별로 API 키를 생성하고 관리할 수 있는 기능을 제공합니다.

#### API 키 목록 조회

```
GET /api/users/api-keys
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "5f9d7a3e-8c5b-4e6a-9a3c-1d8f7e6b5a4d",
      "name": "내 애플리케이션",
      "key": "mr.abcdef1234567890",
      "lastUsedAt": "2023-04-01T12:34:56Z",
      "expiresAt": "2024-04-01T00:00:00Z",
      "createdAt": "2023-04-01T10:00:00Z"
    },
    {
      "id": "6e8c5b3a-9d7f-5e6b-1c4d-2a3b8f7e6d5c",
      "name": "테스트 키",
      "key": "mr.zyxwvu9876543210",
      "lastUsedAt": null,
      "expiresAt": null,
      "createdAt": "2023-04-02T15:30:00Z"
    }
  ]
}
```

#### API 키 생성

```
POST /api/users/api-keys
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**요청 본문**:
```json
{
  "name": "새 애플리케이션",
  "expiresAt": "2025-04-01T00:00:00Z"  // 선택 사항
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "7d8e9f0a-1b2c-3d4e-5f6a-7b8c9d0e1f2a",
    "name": "새 애플리케이션",
    "key": "mr.1a2b3c4d5e6f7g8h9i",
    "expiresAt": "2025-04-01T00:00:00Z",
    "createdAt": "2023-04-03T09:15:00Z"
  },
  "message": "API 키가 생성되었습니다. 이 키는 한 번만 표시되므로 안전한 곳에 저장하세요."
}
```

#### API 키 삭제

```
DELETE /api/users/api-keys/:id
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**응답**:
```json
{
  "success": true,
  "message": "API 키가 삭제되었습니다."
}
```

## AI 제공업체 API

### 제공업체 목록 조회

```
GET /api/ai/providers
```

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "openai",
      "name": "OpenAI",
      "description": "OpenAI API 서비스",
      "isActive": true
    },
    {
      "id": "anthropic",
      "name": "Anthropic",
      "description": "Anthropic Claude 모델",
      "isActive": true
    }
  ]
}
```

### 제공업체 모델 목록 조회

```
GET /api/ai/providers/:providerId/models
```

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "description": "GPT-4 모델",
      "isActive": true
    },
    {
      "id": "gpt-3.5-turbo",
      "name": "GPT-3.5 Turbo",
      "description": "GPT-3.5 Turbo 모델",
      "isActive": true
    }
  ]
}
```

### 채팅 완성 요청

```
POST /api/ai/providers/:providerId/chat
```

**요청 본문**:
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "당신은 도움이 되는 AI 어시스턴트입니다."
    },
    {
      "role": "user",
      "content": "안녕하세요, 오늘 날씨가 어떤가요?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "chat-123456789",
    "providerId": "openai",
    "model": "gpt-4",
    "response": {
      "content": "안녕하세요! 저는 AI 어시스턴트라 실시간 날씨 정보를 직접 확인할 수 없습니다. 현재 날씨를 알기 위해서는 날씨 앱이나 웹사이트를 확인하시는 것이 좋겠습니다. 다른 질문이 있으시면 도와드리겠습니다!",
      "role": "assistant"
    },
    "usage": {
      "promptTokens": 100,
      "completionTokens": 50,
      "totalTokens": 150
    }
  }
}
```

### 텍스트 완성 요청

```
POST /api/ai/providers/:providerId/completion
```

**요청 본문**:
```json
{
  "model": "gpt-3.5-turbo-instruct",
  "prompt": "다음 문장을 완성해주세요: 인공지능 기술의 발전은",
  "temperature": 0.7,
  "max_tokens": 100
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "completion-123456789",
    "providerId": "openai",
    "model": "gpt-3.5-turbo-instruct",
    "response": "인공지능 기술의 발전은 우리 사회의 모든 분야에 혁명적인 변화를 가져오고 있습니다. 의료, 교육, 금융, 교통 등 다양한 산업에서 효율성과 정확성을 높이고, 인간의 창의적인 활동을 보조하며, 새로운 가능성을 열어가고 있습니다.",
    "usage": {
      "promptTokens": 50,
      "completionTokens": 30,
      "totalTokens": 80
    }
  }
}
```

## 사용자 관리 API

### 사용자 프로필 조회

```
GET /api/auth/profile
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "user"
  }
}
```

### 사용자 프로필 업데이트

```
PUT /api/auth/profile
```

**요청 본문**:
```json
{
  "name": "홍길동 수정"
}
```

**응답**:
```json
{
  "success": true,
  "message": "프로필이 업데이트되었습니다.",
  "data": {
    "id": 123,
    "email": "user@example.com",
    "name": "홍길동 수정",
    "role": "user"
  }
}
```

## 관리자 API

관리자 권한이 있는 사용자만 접근할 수 있는 API 엔드포인트입니다.

### 사용자 관리

#### 모든 사용자 조회

```
GET /api/admin/users
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**응답**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
        "email": "user1@example.com",
        "name": "홍길동",
        "role": "user",
        "isActive": true,
        "lastLogin": "2023-04-01T10:30:00Z",
        "createdAt": "2023-03-15T09:00:00Z"
      },
      {
        "id": "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
        "email": "admin@example.com",
        "name": "관리자",
        "role": "admin",
        "isActive": true,
        "lastLogin": "2023-04-02T14:20:00Z",
        "createdAt": "2023-03-10T08:00:00Z"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 10
  }
}
```

#### 사용자 정보 업데이트

```
PUT /api/admin/users/:id
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**요청 본문**:
```json
{
  "name": "홍길동 (수정)",
  "role": "admin",
  "isActive": true
}
```

**응답**:
```json
{
  "success": true,
  "message": "사용자 정보가 업데이트되었습니다.",
  "data": {
    "id": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
    "email": "user1@example.com",
    "name": "홍길동 (수정)",
    "role": "admin",
    "isActive": true,
    "updatedAt": "2023-04-03T11:45:00Z"
  }
}
```

### 제공업체 관리

#### 모든 제공업체 조회

```
GET /api/admin/providers
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "openai",
      "name": "OpenAI",
      "apiKey": "***********",
      "endpointUrl": "https://api.openai.com/v1",
      "allowImages": true,
      "allowVideos": false,
      "allowFiles": false,
      "maxTokens": 4000,
      "isActive": true,
      "createdAt": "2023-03-01T00:00:00Z"
    },
    {
      "id": "anthropic",
      "name": "Anthropic",
      "apiKey": "***********",
      "endpointUrl": "https://api.anthropic.com",
      "allowImages": false,
      "allowVideos": false,
      "allowFiles": false,
      "maxTokens": 100000,
      "isActive": true,
      "createdAt": "2023-03-01T00:00:00Z"
    }
  ]
}
```

#### 새 제공업체 추가

```
POST /api/admin/providers
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**요청 본문**:
```json
{
  "name": "Google AI",
  "apiKey": "api_key_here",
  "endpointUrl": "https://generativelanguage.googleapis.com",
  "allowImages": true,
  "allowVideos": false,
  "allowFiles": false,
  "maxTokens": 30000,
  "isActive": true,
  "settings": {
    "model": "gemini-pro",
    "timeout": 30000
  }
}
```

**응답**:
```json
{
  "success": true,
  "message": "새 제공업체가 추가되었습니다.",
  "data": {
    "id": "googleai",
    "name": "Google AI",
    "endpointUrl": "https://generativelanguage.googleapis.com",
    "allowImages": true,
    "allowVideos": false,
    "allowFiles": false,
    "maxTokens": 30000,
    "isActive": true,
    "createdAt": "2023-04-03T14:20:00Z"
  }
}
```

### 로그 조회

```
GET /api/admin/logs
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**쿼리 파라미터**:
```
startDate: 2023-04-01
endDate: 2023-04-03
userId: 1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p
providerId: openai
page: 1
limit: 10
```

**응답**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-123",
        "userId": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
        "userName": "홍길동",
        "providerId": "openai",
        "modelId": "gpt-4",
        "requestType": "chat",
        "tokensUsed": 250,
        "statusCode": 200,
        "duration": 1240,
        "createdAt": "2023-04-02T15:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 문의 관리

```
GET /api/admin/tickets
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**응답**:
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket-123",
        "userId": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
        "userName": "홍길동",
        "subject": "API 키 문제",
        "message": "API 키가 작동하지 않습니다.",
        "status": "open",
        "createdAt": "2023-04-02T10:15:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

## 오류 응답

MindRoute API는 일관된 오류 응답 형식을 제공합니다:

```json
{
  "success": false,
  "message": "오류 메시지",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### 일반적인 오류 코드

- `400`: 잘못된 요청
- `401`: 인증되지 않음
- `403`: 권한 없음
- `404`: 리소스를 찾을 수 없음
- `409`: 충돌 (예: 이미 존재하는 이메일)
- `422`: 유효성 검사 오류
- `429`: 요청 한도 초과
- `500`: 서버 내부 오류

## API 버전 관리

API 버전은 URL 경로에 포함됩니다 (예: `/api/v1/auth/login`). 현재 버전은 v1입니다.

## 요청 제한

API 요청에는 다음과 같은 제한이 적용됩니다:

- 인증되지 않은 요청: 분당 30회
- 인증된 요청: 분당 100회
- AI 완성 요청: 분당 50회

제한을 초과하면 `429 Too Many Requests` 응답이 반환됩니다.

## 샘플 코드

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:5000';
let accessToken = '';

// 로그인
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    
    const { accessToken, refreshToken } = response.data.data;
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('로그인 오류:', error.response?.data || error.message);
    throw error;
  }
}

// 채팅 완성 요청
async function chatCompletion(providerId, model, messages, token) {
  try {
    const response = await axios.post(
      `${API_URL}/api/ai/providers/${providerId}/chat`,
      {
        model,
        messages
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('채팅 완성 오류:', error.response?.data || error.message);
    throw error;
  }
}
```

### Python

```python
import requests

API_URL = 'http://localhost:5000'

# 로그인
def login(email, password):
    try:
        response = requests.post(f"{API_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        response.raise_for_status()
        data = response.json()
        return data["data"]["accessToken"], data["data"]["refreshToken"]
    except requests.exceptions.RequestException as e:
        print(f"로그인 오류: {e}")
        raise

# 채팅 완성 요청
def chat_completion(provider_id, model, messages, token):
    try:
        response = requests.post(
            f"{API_URL}/api/ai/providers/{provider_id}/chat",
            json={
                "model": model,
                "messages": messages
            },
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
        response.raise_for_status()
        return response.json()["data"]
    except requests.exceptions.RequestException as e:
        print(f"채팅 완성 오류: {e}")
        raise
```

## API 테스트

Postman 또는 Insomnia와 같은 API 테스트 도구를 사용하여 MindRoute API를 테스트할 수 있습니다.

[Postman 컬렉션 다운로드](#) (준비되면 링크 활성화) 