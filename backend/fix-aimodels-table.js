// 중복된 컬럼을 제거하는 스크립트
const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

// 환경 설정 가져오기
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log,
  }
);

async function fixAiModelsTable() {
  try {
    console.log('중복 컬럼 제거 작업 시작...');
    
    // 중복된 컬럼들 목록
    const duplicateColumns = [
      'providerId', 'modelId', 'allowImages', 'allowVideos', 'allowFiles',
      'maxTokens', 'contextWindow', 'inputPrice', 'outputPrice',
      'createdAt', 'updatedAt'
    ];
    
    // 각 컬럼에 대해 삭제 시도
    for (const column of duplicateColumns) {
      try {
        const query = `ALTER TABLE ai_models DROP COLUMN IF EXISTS "${column}";`;
        console.log(`실행 중인 쿼리: ${query}`);
        await sequelize.query(query);
        console.log(`컬럼 제거 성공: ${column}`);
      } catch (err) {
        console.error(`컬럼 제거 중 오류: ${column} - ${err.message}`);
      }
    }
    
    console.log('중복 컬럼 제거 작업 완료');
  } catch (error) {
    console.error('스크립트 실행 중 오류 발생:', error);
  } finally {
    // 연결 종료
    await sequelize.close();
  }
}

// 스크립트 실행
fixAiModelsTable()
  .then(() => {
    console.log('스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  }); 