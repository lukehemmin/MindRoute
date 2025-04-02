import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import path from 'path';
import fs from 'fs';

/**
 * Swagger 문서 설정
 */
const swaggerDocs = {
  openapi: '3.0.0',
  info: {
    title: 'MindRoute API',
    version: '1.0.0',
    description: '다중 AI 제공업체를 통합하는 MindRoute API 문서',
    contact: {
      name: 'MindRoute Team',
      url: 'https://github.com/lukehemmin/MindRoute',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API 서버',
    },
  ],
  tags: [
    {
      name: 'auth',
      description: '인증 관련 API',
    },
    {
      name: 'ai',
      description: 'AI 제공업체 및 모델 관련 API',
    },
    {
      name: 'admin',
      description: '관리자 기능 API',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: '에러 메시지' },
          error: { type: 'string', example: '에러 코드' },
        },
      },
    },
  },
  paths: {}, // 경로는 별도 파일에서 추가할 예정
};

/**
 * API 경로 정의 로드 (경로 정의 파일이 있는 경우)
 */
const loadApiPaths = (): Record<string, any> => {
  const paths: Record<string, any> = {};
  const pathsDir = path.join(__dirname, '../swagger/paths');

  if (fs.existsSync(pathsDir)) {
    const pathFiles = fs.readdirSync(pathsDir).filter(file => file.endsWith('.json'));
    
    for (const file of pathFiles) {
      const content = fs.readFileSync(path.join(pathsDir, file), 'utf8');
      const pathObj = JSON.parse(content);
      Object.assign(paths, pathObj);
    }
  }

  return paths;
};

/**
 * Swagger 설정을 Express 앱에 적용
 */
export const setupSwagger = (app: Application): void => {
  try {
    // API 경로 정의 로드
    swaggerDocs.paths = loadApiPaths();

    // Swagger UI 설정
    const options = {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
    };

    // Swagger UI 미들웨어 설정
    app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerDocs, options) as any);
    
    console.log('✅ Swagger 문서가 설정되었습니다. /api-docs에서 확인할 수 있습니다.');
  } catch (error) {
    console.error('❌ Swagger 설정 중 오류 발생:', error);
  }
}; 