CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" INTEGER REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  email VARCHAR(255),
  "apiKeyId" UUID REFERENCES api_keys(id) ON UPDATE CASCADE ON DELETE SET NULL,
  "apiKeyName" VARCHAR(255),
  "apiKey" VARCHAR(255),
  model VARCHAR(255),
  input JSONB NOT NULL,
  output JSONB,
  "promptTokens" INTEGER,
  "completionTokens" INTEGER,
  "totalTokens" INTEGER,
  configuration JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs("userId");
CREATE INDEX IF NOT EXISTS idx_api_logs_api_key_id ON api_logs("apiKeyId");
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs("createdAt");
CREATE INDEX IF NOT EXISTS idx_api_logs_model ON api_logs(model); 