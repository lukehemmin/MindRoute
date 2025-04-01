# 기여 가이드라인

MindRoute 프로젝트에 기여하고자 하는 개발자를 환영합니다. 이 문서는 프로젝트에 효과적으로 기여하기 위한 가이드라인을 제공합니다.

## 기여 방법

MindRoute 프로젝트에 기여하는 방법은 다양합니다:

1. **코드 기여**: 새로운 기능 개발, 버그 수정, 성능 최적화
2. **문서화**: 위키, API 문서, 코드 주석 개선
3. **테스트**: 단위 테스트, 통합 테스트, E2E 테스트 작성
4. **버그 신고**: 이슈 등록 및 재현 방법 제공
5. **아이디어 제안**: 새로운 기능이나 개선 사항 제안

## 개발 환경 설정

프로젝트에 기여하기 전에 개발 환경을 설정해야 합니다. [설치 및 설정](Installation-and-Setup) 문서의 안내를 따라 로컬 개발 환경을 구성하세요.

## 코드 기여 프로세스

### 1. 이슈 확인 또는 생성

코드 변경을 시작하기 전에 관련 이슈가 이미 존재하는지 확인하세요. 없다면 다음 정보를 포함하여 새로운 이슈를 생성합니다:

- 문제 설명 또는 기능 요청
- 재현 단계 (버그인 경우)
- 예상 동작과 실제 동작
- 관련 스크린샷 또는 오류 메시지

### 2. 브랜치 생성

항상 새로운 브랜치에서 작업하세요. 브랜치 이름은 다음 규칙을 따릅니다:

- 기능 개발: `feature/기능-이름` 또는 `feature/issue-번호-간단한-설명`
- 버그 수정: `fix/버그-설명` 또는 `fix/issue-번호-간단한-설명`
- 문서 업데이트: `docs/문서-설명`
- 성능 개선: `perf/개선-설명`
- 리팩토링: `refactor/설명`

```bash
# 예시: 새로운 AI 제공업체 추가 기능
git checkout -b feature/add-google-provider

# 예시: 로그인 버그 수정
git checkout -b fix/issue-42-login-error
```

### 3. 코딩 표준 준수

코드 작성 시 다음 표준을 준수하세요:

#### 코드 스타일

- ESLint 및 Prettier 설정을 준수합니다.
- 들여쓰기는 2칸 공백을 사용합니다.
- 세미콜론을 사용합니다.
- 작은따옴표 대신 큰따옴표를 사용합니다.

#### 네이밍 규칙

- **클래스/인터페이스**: PascalCase (예: `UserService`, `AuthController`)
- **변수/함수**: camelCase (예: `getUserById`, `isAuthenticated`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT`)
- **파일명**: kebab-case (예: `auth-service.ts`, `user-controller.ts`)

#### 코드 구조

- 관심사 분리 원칙을 따릅니다.
- 비즈니스 로직은 서비스 클래스에 구현합니다.
- 컨트롤러는 요청 처리 및 응답 생성을 담당합니다.
- 재사용 가능한 코드는 유틸리티 함수로 분리합니다.

```typescript
// 좋은 코드 구조 예시
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtUtil: JwtUtil
  ) {}

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new AuthError("인증 실패");
    }
    
    // 비즈니스 로직 처리
    // ...
    
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name }
    };
  }
}
```

### 4. 테스트 작성

코드 변경 시 적절한 테스트를 작성하세요:

- 새로운 기능에는 단위 테스트와 통합 테스트를 추가합니다.
- 버그 수정에는 해당 버그의 재발을 방지하는 테스트를 추가합니다.
- 기존 테스트가 실패하지 않도록 합니다.

```typescript
// 테스트 예시
describe("AuthService", () => {
  describe("login", () => {
    it("유효한 자격 증명으로 로그인하면 토큰을 반환해야 함", async () => {
      // 테스트 준비
      const email = "test@example.com";
      const password = "password123";
      const mockUser = { id: "123", email, password: hashedPassword };
      
      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwtUtil.generateAccessToken.mockReturnValue("access-token");
      jwtUtil.generateRefreshToken.mockReturnValue("refresh-token");
      
      // 테스트 실행
      const result = await authService.login(email, password);
      
      // 검증
      expect(result).toHaveProperty("accessToken", "access-token");
      expect(result).toHaveProperty("refreshToken", "refresh-token");
      expect(result.user).toHaveProperty("id", "123");
      expect(result.user).toHaveProperty("email", email);
    });
  });
});
```

### 5. 커밋 규칙

커밋 메시지는 다음 규칙을 따릅니다:

- 제목은 50자 이내로 명확하게 작성합니다.
- 본문은 필요한 경우에만 작성하며, 제목과 본문 사이에 빈 줄을 넣습니다.
- 현재 시제를 사용합니다(과거형 대신 "추가함"이 아닌 "추가").
- 커밋 유형에 따라 접두사를 사용합니다:

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 업데이트
style: 코드 형식 변경 (기능 변경 없음)
refactor: 코드 리팩토링
perf: 성능 개선
test: 테스트 코드 추가 또는 수정
chore: 빌드 프로세스, 도구 변경 등
```

#### 커밋 예시

```
feat: 구글 AI 제공업체 통합 추가

- GoogleAIProvider 클래스 구현
- 텍스트 및 채팅 API 지원
- API 키 유효성 검사 추가
- 단위 테스트 추가
```

### 6. Pull Request 제출

작업이 완료되면 Pull Request(PR)를 제출합니다:

1. 모든 테스트가 통과하는지 확인합니다.
2. 코드 변경 사항을 커밋하고 원격 저장소에 브랜치를 푸시합니다.
3. GitHub에서 PR을 생성합니다.
4. PR 설명에 다음 정보를 포함합니다:
   - 해결하는 이슈 번호(예: "Fixes #42")
   - 변경 사항에 대한 설명
   - 테스트 방법
   - 스크린샷 (UI 변경이 있는 경우)

### 7. 코드 리뷰

PR이 제출되면 다음 과정을 거칩니다:

1. 자동화된 CI 테스트가 통과하는지 확인합니다.
2. 코드 리뷰어가 코드를 검토합니다.
3. 리뷰어의 피드백에 따라 필요한 변경을 수행합니다.
4. 모든 피드백이 해결되면 PR이 승인되고 병합됩니다.

## 문서 기여

문서화는 프로젝트의 중요한 부분입니다. 문서 기여 시 다음 지침을 따르세요:

1. 위키 페이지는 마크다운(.md) 형식을 사용합니다.
2. 위키 콘텐츠는 명확하고 간결하게 작성합니다.
3. 코드 예제가 있는 경우 구문 강조 표시를 사용합니다.
4. 이미지는 `images` 디렉토리에 저장하고 상대 경로로 참조합니다.
5. 내부 링크는 위키 페이지 이름을 사용합니다: `[링크 텍스트](페이지-이름)`.

## 버그 신고

버그를 신고할 때는 다음 정보를 포함하세요:

1. 버그 요약: 문제에 대한 간결한 설명
2. 재현 단계: 문제 재현 방법에 대한 상세한 단계
3. 예상 동작: 기대했던 작동 방식
4. 실제 동작: 실제로 발생한 일
5. 환경 정보: 
   - 운영 체제 및 버전
   - 브라우저 및 버전 (프론트엔드 이슈의 경우)
   - Node.js 버전
   - 관련 패키지 버전
6. 스크린샷 또는 오류 로그

## 기능 요청

새로운 기능을 제안할 때는 다음 정보를 포함하세요:

1. 기능 요약: 제안하는 기능에 대한 간결한 설명
2. 사용 사례: 이 기능이 필요한 이유와 실제 사용 방법
3. 대안 고려 사항: 고려한 대안적 해결책
4. 추가 정보: 구현 아이디어, 참조 등

## 코드 리뷰 지침

코드 리뷰 시 다음 사항을 확인합니다:

1. **기능적 정확성**: 코드가 요구사항을 충족하는가?
2. **테스트 적용 범위**: 적절한 테스트가 있는가?
3. **코드 품질**: 코드가 읽기 쉽고 유지 관리가 가능한가?
4. **성능 고려 사항**: 성능에 영향을 미치는 문제가 있는가?
5. **보안 고려 사항**: 보안 취약점이 존재하는가?
6. **가독성**: 코드가 명확하고 이해하기 쉬운가?
7. **문서화**: 필요한 문서가 업데이트되었는가?

## 라이선스 및 저작권

MindRoute 프로젝트에 기여함으로써, 귀하의 기여물이 프로젝트의 라이선스 하에 배포된다는 것에 동의하게 됩니다. 모든 코드 파일에 적절한 저작권 고지를 포함해야 합니다.

## 행동 강령

MindRoute 커뮤니티에 참여하는 모든 사람은 다음 원칙을 준수해야 합니다:

1. **존중과 배려**: 모든 참여자를 존중하고 배려합니다.
2. **협력**: 건설적인 피드백을 제공하고 열린 마음으로 협력합니다.
3. **포용성**: 모든 배경과 관점을 가진 사람들을 환영합니다.
4. **전문성**: 전문적이고 건설적인 방식으로 소통합니다.

부적절한 행동이나 괴롭힘이 발견되면 프로젝트 관리자에게 보고해 주세요.

## 질문과 도움

질문이 있거나 도움이 필요한 경우:

1. GitHub Issues에 질문을 게시하세요.
2. 위키 문서를 참조하세요.
3. 프로젝트 관리자에게 직접 연락하세요.

## 감사합니다!

귀하의 기여는 MindRoute 프로젝트를 더 나은 소프트웨어로 만드는 데 큰 도움이 됩니다. 시간과 재능을 기여해 주셔서 감사합니다! 