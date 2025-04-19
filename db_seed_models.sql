-- 기존 Provider 데이터를 기반으로 모델 데이터 삽입
INSERT INTO ai_models (providerid, name, modelid, allowimages, allowvideos, allowfiles, maxtokens, active, settings)
SELECT 
  id as providerid,
  CASE 
    WHEN type = 'openai' THEN 'GPT-3.5 Turbo'
    WHEN type = 'anthropic' THEN 'Claude 3 Haiku'
    WHEN type = 'google' THEN 'Gemini Pro'
    ELSE name || ' Default Model'
  END as name,
  CASE 
    WHEN type = 'openai' THEN 'gpt-3.5-turbo'
    WHEN type = 'anthropic' THEN 'claude-3-haiku-20240307'
    WHEN type = 'google' THEN 'gemini-pro'
    ELSE 'default-model'
  END as modelid,
  "allowImages" as allowimages,
  "allowVideos" as allowvideos,
  "allowFiles" as allowfiles,
  "maxTokens" as maxtokens,
  active,
  settings
FROM providers
WHERE active = true;

-- OpenAI 제공업체를 위한 추가 모델 삽입
INSERT INTO ai_models (providerid, name, modelid, allowimages, allowvideos, allowfiles, maxtokens, contextwindow, active)
SELECT 
  id as providerid,
  'GPT-4 Turbo' as name,
  'gpt-4-turbo-preview' as modelid,
  true as allowimages,
  false as allowvideos,
  false as allowfiles,
  4096 as maxtokens,
  128000 as contextwindow,
  active
FROM providers
WHERE type = 'openai' AND active = true;

-- Anthropic 제공업체를 위한 추가 모델 삽입
INSERT INTO ai_models (providerid, name, modelid, allowimages, allowvideos, allowfiles, maxtokens, contextwindow, active)
SELECT 
  id as providerid,
  'Claude 3 Opus' as name,
  'claude-3-opus-20240229' as modelid,
  true as allowimages,
  false as allowvideos,
  false as allowfiles,
  100000 as maxtokens,
  200000 as contextwindow,
  active
FROM providers
WHERE type = 'anthropic' AND active = true;

INSERT INTO ai_models (providerid, name, modelid, allowimages, allowvideos, allowfiles, maxtokens, contextwindow, active)
SELECT 
  id as providerid,
  'Claude 3 Sonnet' as name,
  'claude-3-sonnet-20240229' as modelid,
  true as allowimages,
  false as allowvideos,
  false as allowfiles,
  100000 as maxtokens,
  180000 as contextwindow,
  active
FROM providers
WHERE type = 'anthropic' AND active = true;

-- Google 제공업체를 위한 추가 모델 삽입
INSERT INTO ai_models (providerid, name, modelid, allowimages, allowvideos, allowfiles, maxtokens, contextwindow, active)
SELECT 
  id as providerid,
  'Gemini Pro Vision' as name,
  'gemini-pro-vision' as modelid,
  true as allowimages,
  false as allowvideos,
  false as allowfiles,
  8192 as maxtokens,
  12000 as contextwindow,
  active
FROM providers
WHERE type = 'google' AND active = true; 