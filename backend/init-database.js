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

// 암호화 함수
function encrypt(text, encryptionKey) {
  try {
    // 초기화 벡터 생성
    const iv = crypto.randomBytes(16);
    
    // base64 형식의 키를 사용
    const key = Buffer.from(encryptionKey, 'base64').slice(0, 32);
    
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
    
    // 암호화 키 가져오기
    let encryptionKey;
    
    // system_configs 테이블 존재 확인
    const [tables] = await sequelize.query(
      "SELECT to_regclass('public.system_configs') is not null as exists"
    );
    
    if (tables[0].exists) {
      // 기존 암호화 키 조회
      const [keyResult] = await sequelize.query(
        "SELECT value FROM system_configs WHERE key = 'ENCRYPTION_KEY'"
      );
      
      if (keyResult.length > 0) {
        encryptionKey = keyResult[0].value;
        console.log('DB에서 암호화 키를 가져왔습니다.');
      } else {
        // 새 키 생성 및 저장
        encryptionKey = crypto.randomBytes(32).toString('base64');
        await sequelize.query(
          `INSERT INTO system_configs (key, value, description, "createdAt", "updatedAt") 
           VALUES (:key, :value, :description, NOW(), NOW())`,
          {
            replacements: {
              key: 'ENCRYPTION_KEY',
              value: encryptionKey,
              description: '자동 생성된 암호화 키'
            }
          }
        );
        console.log('새 암호화 키를 생성하여 DB에 저장했습니다.');
      }
    } else {
      // 테이블이 없는 경우 임시 키 사용
      console.log('system_configs 테이블이 없습니다. 임시 암호화 키를 사용합니다.');
      encryptionKey = crypto.randomBytes(32).toString('base64');
    }
    
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
      // 시드 데이터 생성 - 암호화 키 전달
      const providers = [
        {
          id: uuidv4(),
          name: 'OpenAI (테스트)',
          type: 'openai',
          apiKey: encrypt('test-openai-key', encryptionKey),
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
          apiKey: encrypt('test-anthropic-key', encryptionKey),
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
          apiKey: encrypt('test-google-key', encryptionKey),
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