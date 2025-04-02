import { Sequelize } from 'sequelize';
import logger from '../utils/logger';

// 환경 변수에서 DB 설정 가져오기
const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'mindroute',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_DIALECT = 'postgres',
  NODE_ENV = 'development',
} = process.env;

// 데이터베이스 연결 생성
const sequelize = new Sequelize({
  dialect: DB_DIALECT as any,
  host: DB_HOST,
  port: parseInt(DB_PORT),
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  logging: NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
  },
});

// 데이터베이스 연결 테스트 함수
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('데이터베이스 연결이 성공적으로 설정되었습니다.');
  } catch (error) {
    logger.error('데이터베이스 연결에 실패했습니다:', error);
    throw error;
  }
};

// 테이블 자동 생성 함수 (기본 sync)
export const syncTables = async (force: boolean = false, alter: boolean = true): Promise<void> => {
  try {
    if (force) {
      logger.warn('경고: 모든 테이블을 삭제하고 다시 생성합니다 (force: true)');
    }
    
    if (alter) {
      logger.info('테이블 구조 변경 확인 및 적용 중 (alter: true)');
    }
    
    await sequelize.sync({ force, alter });
    logger.info('데이터베이스 테이블이 동기화되었습니다');
  } catch (error) {
    logger.error('테이블 동기화 중 오류가 발생했습니다:', error);
    throw error;
  }
};

export default sequelize; 