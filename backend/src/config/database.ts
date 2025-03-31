import { Sequelize } from 'sequelize';
import config from './config';

const env = process.env.NODE_ENV || 'development';
const dbConfig = require('../../config/config.json')[env];

let sequelize: Sequelize;

// 환경 변수 DATABASE_URL이 있으면 사용 (프로덕션 환경용)
if (dbConfig.use_env_variable && process.env[dbConfig.use_env_variable]) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable] as string, {
    dialect: 'postgres',
    logging: false,
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // 개발 환경용 설정
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: 'postgres',
      logging: env === 'development' ? console.log : false
    }
  );
}

// 데이터베이스 연결 테스트 함수
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공!');
    return true;
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
    return false;
  }
};

export default sequelize; 