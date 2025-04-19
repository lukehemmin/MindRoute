-- providers 테이블에서 모델별 설정 필드 제거
ALTER TABLE providers
  DROP COLUMN "allowImages",
  DROP COLUMN "allowVideos",
  DROP COLUMN "allowFiles",
  DROP COLUMN "maxTokens"; 