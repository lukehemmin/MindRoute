import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { encrypt } from '../src/utils/encryption';
import { ProviderType } from '../src/utils/providerManager';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // 기본 설정 값
    const openAISettings = {
      defaultModel: 'gpt-3.5-turbo',
    };
    
    const anthropicSettings = {
      defaultModel: 'claude-3-haiku-20240307',
    };
    
    const googleSettings = {
      defaultModel: 'gemini-pro',
    };
    
    // 시드 데이터 생성 (실제 API 키는 환경 변수에서 로드)
    const providers = [
      {
        id: uuidv4(),
        name: 'OpenAI',
        type: ProviderType.OPENAI,
        apiKey: encrypt(process.env.OPENAI_API_KEY || 'dummy-key-please-replace'),
        endpointUrl: null,
        allowImages: true,
        allowVideos: false,
        allowFiles: false,
        maxTokens: null,
        settings: openAISettings,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Anthropic',
        type: ProviderType.ANTHROPIC,
        apiKey: encrypt(process.env.ANTHROPIC_API_KEY || 'dummy-key-please-replace'),
        endpointUrl: null,
        allowImages: true,
        allowVideos: false,
        allowFiles: false,
        maxTokens: null,
        settings: anthropicSettings,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Google AI',
        type: ProviderType.GOOGLE,
        apiKey: encrypt(process.env.GOOGLE_API_KEY || 'dummy-key-please-replace'),
        endpointUrl: null,
        allowImages: true,
        allowVideos: false,
        allowFiles: false,
        maxTokens: null,
        settings: googleSettings,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return queryInterface.bulkInsert('providers', providers);
  },

  down: async (queryInterface: QueryInterface) => {
    // 모든 프로바이더 데이터 삭제
    return queryInterface.bulkDelete('providers', {});
  },
}; 