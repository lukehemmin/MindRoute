# API 사용 예제

이 페이지에서는 MindRoute API의 사용 방법을 다양한 예제와 함께 설명합니다.

## 기본 정보

- **기본 URL**: `https://api.mindroute.example.com` (프로덕션) 또는 `http://localhost:5000` (개발)
- **인증**: JWT 토큰 기반 (Bearer 인증)
- **콘텐츠 타입**: `application/json`

## 인증 API 호출 예제

### 회원가입

```javascript
// JavaScript 예제 (Fetch API 사용)
async function register() {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'SecurePassword123!',
      name: '홍길동'
    })
  });

  const data = await response.json();
  console.log(data);
  
  // 토큰 저장
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
  }
}
```

### 로그인

```python
# Python 예제 (requests 라이브러리 사용)
import requests

def login(email, password):
    response = requests.post(
        'http://localhost:5000/api/auth/login',
        json={
            'email': email,
            'password': password
        }
    )
    
    data = response.json()
    print(data)
    
    # 성공 시 토큰 반환
    if data['success']:
        return data['data']['accessToken'], data['data']['refreshToken']
    else:
        raise Exception(data['message'])

# 사용 예시
try:
    access_token, refresh_token = login('user@example.com', 'SecurePassword123!')
    print(f"Access Token: {access_token}")
    print(f"Refresh Token: {refresh_token}")
except Exception as e:
    print(f"로그인 실패: {e}")
```

### 토큰 갱신

```javascript
// JavaScript 예제 (Axios 사용)
import axios from 'axios';

async function refreshToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다.');
    }
    
    const response = await axios.post('http://localhost:5000/api/auth/refresh-token', {
      refreshToken
    });
    
    if (response.data.success) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      return response.data.data.accessToken;
    }
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    // 로그인 페이지로 리디렉션
    window.location.href = '/login';
    throw error;
  }
}
```

### 로그아웃

```javascript
// JavaScript 예제
async function logout() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.warn('리프레시 토큰이 없습니다.');
      return;
    }
    
    const response = await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        refreshToken
      })
    });
    
    const data = await response.json();
    console.log(data);
    
    // 토큰 삭제
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    return data.success;
  } catch (error) {
    console.error('로그아웃 실패:', error);
    throw error;
  }
}
```

## AI API 호출 예제

### 제공업체 목록 조회

```javascript
// JavaScript 예제
async function getProviders() {
  try {
    const response = await fetch('http://localhost:5000/api/ai/providers', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('제공업체 목록 조회 실패:', error);
    throw error;
  }
}
```

### 모델 목록 조회

```python
# Python 예제
import requests

def get_models(provider_id, access_token):
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    response = requests.get(
        f'http://localhost:5000/api/ai/providers/{provider_id}/models',
        headers=headers
    )
    
    data = response.json()
    
    if data['success']:
        return data['data']
    else:
        raise Exception(data['message'])

# 사용 예시
try:
    models = get_models('openai', access_token)
    for model in models:
        print(f"모델 ID: {model['id']}, 이름: {model['name']}")
except Exception as e:
    print(f"모델 목록 조회 실패: {e}")
```

### 챗 완성 요청

```javascript
// JavaScript 예제 (Axios 사용)
import axios from 'axios';

async function chatCompletion(providerId, model, messages, options = {}) {
  try {
    const response = await axios.post(
      `http://localhost:5000/api/ai/providers/${providerId}/chat`,
      {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('챗 완성 요청 실패:', error);
    throw error;
  }
}

// 사용 예시
async function example() {
  try {
    const result = await chatCompletion(
      'openai',
      'gpt-4',
      [
        { role: 'system', content: '당신은 도움이 되는 AI 어시스턴트입니다.' },
        { role: 'user', content: '인공지능에 대해 간단히 설명해주세요.' }
      ]
    );
    
    console.log('AI 응답:', result.response.content);
    console.log('사용된 토큰:', result.usage.totalTokens);
  } catch (error) {
    console.error('예제 실행 실패:', error);
  }
}
```

### 이미지가 포함된 채팅 요청

```javascript
// JavaScript 예제 (FormData 사용)
async function chatWithImage(providerId, model, messages, imageFile, options = {}) {
  try {
    const formData = new FormData();
    formData.append('model', model);
    formData.append('messages', JSON.stringify(messages));
    formData.append('image', imageFile);
    
    if (options.temperature) {
      formData.append('temperature', options.temperature);
    }
    
    if (options.max_tokens) {
      formData.append('max_tokens', options.max_tokens);
    }
    
    const response = await fetch(
      `http://localhost:5000/api/ai/providers/${providerId}/chat-with-media`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('이미지 채팅 요청 실패:', error);
    throw error;
  }
}

// HTML 파일 입력 예시
/*
<input type="file" id="imageInput" accept="image/*" />
<button onclick="sendImageChat()">이미지와 함께 질문하기</button>

<script>
async function sendImageChat() {
  const imageInput = document.getElementById('imageInput');
  
  if (!imageInput.files || imageInput.files.length === 0) {
    alert('이미지를 선택해주세요.');
    return;
  }
  
  const imageFile = imageInput.files[0];
  
  try {
    const result = await chatWithImage(
      'anthropic',
      'claude-3-opus-20240229',
      [
        { role: 'user', content: '이 이미지에 대해 설명해주세요.' }
      ],
      imageFile
    );
    
    console.log('AI 응답:', result.response.content);
  } catch (error) {
    console.error('이미지 채팅 실패:', error);
  }
}
</script>
*/
```

### 텍스트 완성 요청

```python
# Python 예제
import requests

def text_completion(provider_id, model, prompt, access_token, **options):
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'model': model,
        'prompt': prompt
    }
    
    # 추가 옵션 설정
    if 'temperature' in options:
        payload['temperature'] = options['temperature']
    
    if 'max_tokens' in options:
        payload['max_tokens'] = options['max_tokens']
    
    response = requests.post(
        f'http://localhost:5000/api/ai/providers/{provider_id}/completion',
        json=payload,
        headers=headers
    )
    
    data = response.json()
    
    if data['success']:
        return data['data']
    else:
        raise Exception(data['message'])

# 사용 예시
try:
    result = text_completion(
        'openai',
        'gpt-3.5-turbo-instruct',
        '다음 문장을 완성하세요: 인공지능의 미래는',
        access_token,
        temperature=0.8,
        max_tokens=150
    )
    
    print(f"AI 응답: {result['response']}")
    print(f"사용된 토큰: {result['usage']['totalTokens']}")
except Exception as e:
    print(f"텍스트 완성 요청 실패: {e}")
```

## 사용자 관리 API 예제

### 프로필 조회

```javascript
// JavaScript 예제
async function getProfile() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('프로필 조회 실패:', error);
    throw error;
  }
}
```

### 프로필 업데이트

```javascript
// JavaScript 예제 (Axios 사용)
import axios from 'axios';

async function updateProfile(profileData) {
  try {
    const response = await axios.put(
      'http://localhost:5000/api/auth/profile',
      profileData,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('프로필 업데이트 실패:', error);
    throw error;
  }
}

// 사용 예시
async function exampleUpdateProfile() {
  try {
    const updatedProfile = await updateProfile({
      name: '홍길동 수정'
    });
    
    console.log('업데이트된 프로필:', updatedProfile);
  } catch (error) {
    console.error('예제 실행 실패:', error);
  }
}
```

## 에러 처리

API 호출 시 발생할 수 있는 일반적인 오류와 처리 방법입니다:

```javascript
// JavaScript 예제 (Axios 사용)
import axios from 'axios';

// API 클라이언트 생성
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000
});

// 요청 인터셉터 - 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 오류 응답이 없는 경우 (네트워크 오류 등)
    if (!error.response) {
      console.error('네트워크 오류:', error.message);
      return Promise.reject(new Error('네트워크 연결을 확인해주세요.'));
    }
    
    const { status, data } = error.response;
    
    // 토큰 만료 (401)
    if (status === 401) {
      // 리프레시 토큰으로 갱신 시도
      const originalRequest = error.config;
      
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          const response = await axios.post(
            'http://localhost:5000/api/auth/refresh-token',
            { refreshToken }
          );
          
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // 리프레시 토큰도 만료된 경우
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(new Error('세션이 만료되었습니다. 다시 로그인해주세요.'));
        }
      }
    }
    
    // 권한 없음 (403)
    if (status === 403) {
      return Promise.reject(new Error('이 작업을 수행할 권한이 없습니다.'));
    }
    
    // 리소스 없음 (404)
    if (status === 404) {
      return Promise.reject(new Error('요청한 리소스를 찾을 수 없습니다.'));
    }
    
    // 유효성 검사 실패 (422)
    if (status === 422) {
      return Promise.reject(new Error(data.message || '입력 데이터가 유효하지 않습니다.'));
    }
    
    // 요청 한도 초과 (429)
    if (status === 429) {
      return Promise.reject(new Error('요청 횟수가 제한을 초과했습니다. 잠시 후 다시 시도해주세요.'));
    }
    
    // 서버 오류 (500)
    if (status >= 500) {
      return Promise.reject(new Error('서버 오류가 발생했습니다. 나중에 다시 시도해주세요.'));
    }
    
    // 기타 오류
    return Promise.reject(new Error(data.message || '오류가 발생했습니다.'));
  }
);

// apiClient를 사용한 API 호출 함수 예시
export const authAPI = {
  login: (email, password) => 
    apiClient.post('/auth/login', { email, password }),
  
  register: (userData) => 
    apiClient.post('/auth/register', userData),
  
  getProfile: () => 
    apiClient.get('/auth/profile')
};

export const aiAPI = {
  getProviders: () => 
    apiClient.get('/ai/providers'),
  
  getModels: (providerId) => 
    apiClient.get(`/ai/providers/${providerId}/models`),
  
  chatCompletion: (providerId, payload) => 
    apiClient.post(`/ai/providers/${providerId}/chat`, payload)
};
```

## 모범 사례

### 토큰 관리

```javascript
// JavaScript 예제 - 토큰 관리 유틸리티
const tokenUtil = {
  // 토큰 저장
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // 만료 시간 계산 (현재 시간 + 15분)
    const expiresAt = new Date(new Date().getTime() + 15 * 60 * 1000);
    localStorage.setItem('expiresAt', expiresAt.toISOString());
  },
  
  // 토큰 가져오기
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  
  // 토큰 삭제
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
  },
  
  // 토큰 만료 확인
  isTokenExpired: () => {
    const expiresAt = localStorage.getItem('expiresAt');
    if (!expiresAt) return true;
    
    return new Date() > new Date(expiresAt);
  }
};
```

### API 요청 재시도

```javascript
// JavaScript 예제 - API 요청 재시도 유틸리티
async function retryRequest(requestFn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // 재시도하지 않아야 하는 오류인 경우
      if (error.response && (
        error.response.status === 401 || // 인증 오류
        error.response.status === 403 || // 권한 오류
        error.response.status === 422    // 유효성 검사 오류
      )) {
        throw error;
      }
      
      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries - 1) {
        console.log(`요청 실패, ${delay}ms 후 재시도 (${attempt + 1}/${maxRetries})`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // 지수 백오프 적용
        delay *= 2;
      }
    }
  }
  
  throw lastError;
}

// 사용 예시
async function exampleWithRetry() {
  try {
    const result = await retryRequest(
      () => aiAPI.chatCompletion('openai', {
        model: 'gpt-4',
        messages: [
          { role: 'user', content: '안녕하세요!' }
        ]
      })
    );
    
    console.log('결과:', result.data);
  } catch (error) {
    console.error('최종 오류:', error);
  }
}
```

### 요청 취소

```javascript
// JavaScript 예제 - AbortController를 사용한 요청 취소
import axios from 'axios';

function createCancellableRequest() {
  const controller = new AbortController();
  
  const request = async (url, options = {}) => {
    try {
      const response = await axios({
        url,
        ...options,
        signal: controller.signal
      });
      
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('요청이 취소되었습니다');
        return { cancelled: true };
      }
      throw error;
    }
  };
  
  return {
    request,
    cancel: () => controller.abort()
  };
}

// 사용 예시
function exampleCancellableRequest() {
  const { request, cancel } = createCancellableRequest();
  
  // 요청 시작
  const requestPromise = request(
    'http://localhost:5000/api/ai/providers/openai/chat',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'gpt-4',
        messages: [
          { role: 'user', content: '긴 문장을 생성해줘' }
        ]
      }
    }
  );
  
  // 3초 후 요청 취소
  setTimeout(() => {
    console.log('요청 취소 중...');
    cancel();
  }, 3000);
  
  return requestPromise;
}
```

## 참고 링크

- [API 문서화 페이지](API-Documentation): 전체 API 명세
- [아키텍처 개요](Architecture-Overview): 시스템 아키텍처 설명
- [백엔드 개발 가이드](Backend-Development): 백엔드 구현 상세 정보 