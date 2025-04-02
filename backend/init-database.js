const { Sequelize, DataTypes } = require('sequelize');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// 환경 변수에서 DB 연결 정보 가져오기
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mindroute',
  username: process.env.DB_USER || 'username',
  password: process.env.DB_PASSWORD || 'password',
  dialect: process.env.DB_DIALECT || 'postgres',
};

// 암호화 함수 (src/utils/encryption.ts의 로직과 동일하게 수정)
function encrypt(text) {
  try {
    // 초기화 벡터 생성
    const iv = crypto.randomBytes(16);
    
    // 키가 32바이트(256비트)인지 확인 - encryption.ts와 동일한 방식으로 키 생성
    const key = crypto.createHash('sha256')
      .update(String(process.env.ENCRYPTION_KEY || ''))
      .digest('base64')
      .slice(0, 32);
    
    // 암호화
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // IV와 암호화된 텍스트를 합쳐서 반환
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('암호화 오류:', error);
    throw new Error('암호화 실패');
  }
}

async function initDatabase() {
  console.log('데이터베이스 연결 중...');
  
  // Sequelize 인스턴스 생성
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: console.log,
    }
  );
  
  try {
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');
    
    // Provider 모델 정의 (Provider.model.ts와 유사하게)
    const Provider = sequelize.define('Provider', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      apiKey: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      endpointUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      allowImages: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      allowVideos: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      allowFiles: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      maxTokens: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      settings: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    }, {
      tableName: 'providers',
      timestamps: true,
    });
    
    // 기존 데이터 확인
    const existingProviders = await Provider.findAll();
    console.log(`현재 ${existingProviders.length}개의 제공업체가 등록되어 있습니다.`);
    
    if (existingProviders.length === 0) {
      // 시드 데이터 생성
      const providers = [
        {
          id: uuidv4(),
          name: 'OpenAI (테스트)',
          type: 'openai',
          apiKey: encrypt('test-openai-key'),
          endpointUrl: null,
          allowImages: true,
          allowVideos: false,
          allowFiles: false,
          maxTokens: null,
          settings: { defaultModel: 'gpt-3.5-turbo' },
          active: true,
        },
        {
          id: uuidv4(),
          name: 'Anthropic (테스트)',
          type: 'anthropic',
          apiKey: encrypt('test-anthropic-key'),
          endpointUrl: null,
          allowImages: true,
          allowVideos: false,
          allowFiles: false,
          maxTokens: null,
          settings: { defaultModel: 'claude-3-haiku-20240307' },
          active: true,
        },
        {
          id: uuidv4(),
          name: 'Google AI (테스트)',
          type: 'google',
          apiKey: encrypt('test-google-key'),
          endpointUrl: null,
          allowImages: true,
          allowVideos: false,
          allowFiles: false,
          maxTokens: null,
          settings: { defaultModel: 'gemini-pro' },
          active: true,
        },
      ];
      
      // 데이터베이스에 삽입
      await Provider.bulkCreate(providers);
      console.log(`${providers.length}개의 제공업체가 추가되었습니다.`);
    } else {
      console.log('이미 제공업체가 등록되어 있어 추가하지 않습니다.');
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    // 연결 종료
    await sequelize.close();
    console.log('데이터베이스 연결 종료');
  }
}

// 스크립트 실행
initDatabase(); 