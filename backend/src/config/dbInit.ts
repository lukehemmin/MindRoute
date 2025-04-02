import { Sequelize, QueryTypes, ModelCtor, Model } from 'sequelize';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

// 데이터베이스 인스턴스 가져오기
import sequelize from './database';

// 모델 가져오기 - 각 모델 파일을 import할 필요가 있음
import '../models';

/**
 * DB의 모든 테이블 목록을 가져오는 함수
 */
const getExistingTables = async (sequelize: Sequelize): Promise<string[]> => {
  try {
    // 데이터베이스 방언(dialect)에 따라 쿼리 다르게 실행
    let query = '';
    const dialect = sequelize.getDialect();

    if (dialect === 'postgres') {
      query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
      `;
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${sequelize.config.database}';
      `;
    } else if (dialect === 'sqlite') {
      query = `
        SELECT name as table_name
        FROM sqlite_master
        WHERE type = 'table' AND name != 'sqlite_sequence';
      `;
    } else {
      throw new Error(`지원되지 않는 데이터베이스 방언: ${dialect}`);
    }

    const tables = await sequelize.query(query, { type: QueryTypes.SELECT });
    return tables.map((t: any) => 
      t.table_name || t.TABLE_NAME || t.name || ''
    ).filter(Boolean);
  } catch (error) {
    logger.error('테이블 목록 조회 중 오류:', error);
    throw error;
  }
};

/**
 * 테이블의 컬럼 정보를 가져오는 함수 
 */
const getTableColumns = async (sequelize: Sequelize, tableName: string): Promise<any[]> => {
  try {
    const dialect = sequelize.getDialect();
    let query = '';

    if (dialect === 'postgres') {
      query = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = '${tableName}' AND table_schema = 'public';
      `;
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      query = `
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns
        WHERE table_name = '${tableName}' AND table_schema = '${sequelize.config.database}';
      `;
    } else if (dialect === 'sqlite') {
      query = `PRAGMA table_info('${tableName}');`;
    } else {
      throw new Error(`지원되지 않는 데이터베이스 방언: ${dialect}`);
    }

    return await sequelize.query(query, { type: QueryTypes.SELECT });
  } catch (error) {
    logger.error(`${tableName} 테이블 컬럼 조회 중 오류:`, error);
    throw error;
  }
};

/**
 * 테이블에 없는 컬럼 추가
 */
const addMissingColumns = async (
  sequelize: Sequelize, 
  tableName: string,

  existingColumns: any[], 
  modelAttributes: any
): Promise<void> => {
  const dialect = sequelize.getDialect();
  const existingColumnNames = existingColumns.map(col => 
    col.column_name || col.COLUMN_NAME || col.name || ''
  ).filter(Boolean);

  for (const [attrName, attrDef] of Object.entries(modelAttributes)) {
    // 필드 정의와 타입 가져오기
    const fieldName = (attrDef as any).field || attrName;
    
    // 이미 존재하는 컬럼이면 스킵
    if (existingColumnNames.includes(fieldName)) {
      continue;
    }

    let type = (attrDef as any).type;
    if (!type) continue;

    // Sequelize 타입 객체에서 SQL 타입 문자열 추출
    let sqlType = type.toString();
    
    // "VARCHAR(255)" 같은 형태에서 타입만 추출
    sqlType = sqlType.replace(/\([^)]+\)/g, '');

    // SQL 타입을 데이터베이스별 타입으로 매핑
    let dbType = sqlType;
    if (dialect === 'postgres') {
      // PostgreSQL 타입 매핑
      if (sqlType === 'VARCHAR') dbType = 'character varying';
      else if (sqlType === 'INTEGER') dbType = 'integer';
      else if (sqlType === 'BOOLEAN') dbType = 'boolean';
      // 기타 필요한 타입 변환...
    }

    // 컬럼 추가 쿼리 생성
    let query = `ALTER TABLE "${tableName}" ADD COLUMN "${fieldName}" ${dbType}`;

    // NOT NULL 제약 조건 추가
    if (!(attrDef as any).allowNull) {
      // 기존 데이터에 대한 기본값 설정
      const defaultValue = (attrDef as any).defaultValue !== undefined 
        ? (attrDef as any).defaultValue 
        : null;

      if (defaultValue !== null) {
        if (typeof defaultValue === 'string') {
          query += ` DEFAULT '${defaultValue}'`;
        } else if (typeof defaultValue === 'number' || typeof defaultValue === 'boolean') {
          query += ` DEFAULT ${defaultValue}`;
        } else if (defaultValue instanceof Date) {
          query += ` DEFAULT '${defaultValue.toISOString()}'`;
        }
        query += ` NOT NULL`;
      } else {
        // 기본값이 없으면 일단 NULL 허용으로 컬럼 추가 후, 나중에 제약 조건 추가
        logger.warn(`${tableName}의 ${fieldName} 컬럼은 NOT NULL이지만 기본값이 없습니다. NULL을 허용합니다.`);
      }
    }

    query += ';';

    try {
      logger.info(`테이블 ${tableName}에 새 컬럼 추가: ${fieldName}`);
      await sequelize.query(query);
    } catch (error) {
      logger.error(`컬럼 추가 중 오류: ${query}`, error);
      throw error;
    }
  }
};

/**
 * 모델과 테이블 동기화
 */
const syncModelWithTable = async (
  sequelize: Sequelize,
  modelName: string,
  model: ModelCtor<Model>
): Promise<void> => {
  try {
    // 모델에서 테이블 이름과 속성 가져오기
    const tableName = model.getTableName() as string;
    const modelAttributes = model.getAttributes();

    // 기존 테이블 컬럼 가져오기
    const existingColumns = await getTableColumns(sequelize, tableName);
    
    // 없는 컬럼 추가
    await addMissingColumns(sequelize, tableName, existingColumns, modelAttributes);
    
    logger.info(`모델 ${modelName}과 테이블 ${tableName} 동기화 완료`);
  } catch (error) {
    logger.error(`모델 ${modelName} 동기화 중 오류:`, error);
    throw error;
  }
};

/**
 * 데이터베이스 초기화 및 자동 마이그레이션
 */
export const initDatabase = async (): Promise<void> => {
  try {
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    logger.info('데이터베이스 연결 성공');

    // 기존 테이블 목록 가져오기
    const existingTables = await getExistingTables(sequelize);
    logger.info(`기존 테이블: ${existingTables.join(', ') || '없음'}`);

    // Sequelize 모델들 가져오기
    const models = sequelize.models;
    logger.info(`모델 목록: ${Object.keys(models).join(', ')}`);

    // 각 모델에 대해
    for (const [modelName, model] of Object.entries(models)) {
      const tableName = (model as any).getTableName();
      
      // 테이블이 존재하지 않으면 생성
      if (!existingTables.includes(tableName)) {
        logger.info(`테이블 ${tableName} 생성 중...`);
        await (model as any).sync();
        logger.info(`테이블 ${tableName} 생성 완료`);
      } else {
        // 테이블이 존재하면 구조 비교 및 업데이트
        logger.info(`테이블 ${tableName} 이미 존재함, 구조 확인 중...`);
        await syncModelWithTable(sequelize, modelName, model as ModelCtor<Model>);
      }
    }

    logger.info('데이터베이스 초기화 완료');
  } catch (error) {
    logger.error('데이터베이스 초기화 중 오류:', error);
    throw error;
  }
};

export default initDatabase; 