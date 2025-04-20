'use strict';

require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

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

// 마이그레이션 파일 경로
const migrationFilePath = path.join(__dirname, 'migrations', '20240719000000-remove-media-support-from-providers.js');

// 마이그레이션 파일 불러오기
const migration = require(migrationFilePath);

async function runMigration() {
  try {
    console.log(`데이터베이스에 연결 중... (${dbHost}:${dbPort}/${dbName})`);
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    console.log('마이그레이션 실행 시작...');
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log('마이그레이션 성공적으로 완료되었습니다!');
  } catch (error) {
    console.error('마이그레이션 실행 중 오류 발생:', error);
  } finally {
    await sequelize.close();
    console.log('데이터베이스 연결 종료');
  }
}

runMigration(); 