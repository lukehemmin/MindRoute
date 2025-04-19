-- 1. models 테이블 생성
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  providerId UUID NOT NULL REFERENCES providers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  modelId VARCHAR(255) NOT NULL,
  allowImages BOOLEAN NOT NULL DEFAULT false,
  allowVideos BOOLEAN NOT NULL DEFAULT false,
  allowFiles BOOLEAN NOT NULL DEFAULT false,
  maxTokens INTEGER,
  contextWindow INTEGER,
  inputPrice DECIMAL(10, 6),
  outputPrice DECIMAL(10, 6),
  active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_provider_model UNIQUE (providerId, modelId)
);

-- 2. 인덱스 생성
CREATE INDEX ai_models_provider_id ON ai_models(providerId);
CREATE INDEX ai_models_active ON ai_models(active);

-- 3. providers 테이블에서 필드 확인 후 존재하는 경우에만 제거
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'allowimages') THEN
    ALTER TABLE providers DROP COLUMN allowImages;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'allowvideos') THEN
    ALTER TABLE providers DROP COLUMN allowVideos;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'allowfiles') THEN
    ALTER TABLE providers DROP COLUMN allowFiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'maxtokens') THEN
    ALTER TABLE providers DROP COLUMN maxTokens;
  END IF;
END
$$; 