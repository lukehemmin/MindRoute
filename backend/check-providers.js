'use strict';

require('dotenv').config();
const { Sequelize } = require('sequelize');

// .env 파일에서 데이터베이스 설정 가져오기
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbDialect = process.env.DB_DIALECT;

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: dbDialect,
  logging: console.log
});

async function checkProviders() {
  try {
    console.log(`데이터베이스에 연결 중... (${dbHost}:${dbPort}/${dbName})`);
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // providers 테이블의 구조와 데이터 확인
    console.log('providers 테이블 구조 확인 중...');
    
    // 테이블 구조 확인
    const [tableInfo] = await sequelize.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'providers'
       ORDER BY ordinal_position`
    );
    
    console.log('providers 테이블 구조:');
    console.table(tableInfo);

    // 테이블 데이터 확인
    const [providers] = await sequelize.query('SELECT id, name, type, active FROM providers');
    
    console.log('providers 테이블 데이터:');
    console.table(providers);

  } catch (error) {
    console.error('확인 중 오류 발생:', error);
  } finally {
    await sequelize.close();
    console.log('데이터베이스 연결 종료');
  }
}

checkProviders(); 