import { Sequelize } from 'sequelize';
import config from './app.config';
import logger from '../utils/logger';

// 데이터베이스 연결 정보
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_NAME = process.env.DB_NAME || 'mindroute';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_DIALECT = process.env.DB_DIALECT || 'postgres';

// Sequelize 인스턴스 생성
const sequelize = new Sequelize({
  dialect: DB_DIALECT as any,
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  logging: (sql) => {
    if (config.env === 'development') {
      logger.debug(sql);
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

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