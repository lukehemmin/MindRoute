const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');

// .env 파일 로드
dotenv.config();

// 환경 변수에서 DB 설정 가져오기
const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'mindroute',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_DIALECT = 'postgres',
  
  // 관리자 계정 정보
  ADMIN_EMAIL = 'admin@example.com',
  ADMIN_PASSWORD = 'changeme123',
  ADMIN_NAME = 'Admin',
} = process.env;

// .env 파일에서 관리자 정보 가져오기
const ADMIN_EMAIL_ENV = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD_ENV = process.env.ADMIN_PASSWORD || 'changeme123';
const ADMIN_NAME_ENV = process.env.ADMIN_NAME || '관리자';

// 데이터베이스 연결 생성
const sequelize = new Sequelize({
  dialect: DB_DIALECT,
  host: DB_HOST,
  port: parseInt(DB_PORT),
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  logging: console.log,
});

// 비밀번호 해싱 함수
const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

// 관리자 계정 초기화 함수
async function resetAdminAccount() {
  try {
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 관리자 사용자 ID 찾기
    const adminUsers = await sequelize.query(
      'SELECT id FROM users WHERE role = :role',
      {
        replacements: { role: 'admin' },
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    
    if (adminUsers.length > 0) {
      console.log(`${adminUsers.length}개의 관리자 계정을 찾았습니다.`);
      
      // 연결된 데이터 삭제 (외래 키 제약 조건)
      for (const admin of adminUsers) {
        // 1. 리프레시 토큰 삭제
        await sequelize.query(
          'DELETE FROM "refreshTokens" WHERE "userId" = :userId',
          {
            replacements: { userId: admin.id },
            type: Sequelize.QueryTypes.DELETE,
          }
        );
        console.log(`사용자 ID ${admin.id}의 리프레시 토큰 삭제 완료`);
        
        // 2. API 키 삭제
        await sequelize.query(
          'DELETE FROM api_keys WHERE "userId" = :userId',
          {
            replacements: { userId: admin.id },
            type: Sequelize.QueryTypes.DELETE,
          }
        );
        console.log(`사용자 ID ${admin.id}의 API 키 삭제 완료`);
        
        // 3. API 로그 삭제
        await sequelize.query(
          'DELETE FROM api_logs WHERE "userId" = :userId',
          {
            replacements: { userId: admin.id },
            type: Sequelize.QueryTypes.DELETE,
          }
        );
        console.log(`사용자 ID ${admin.id}의 API 로그 삭제 완료`);
        
        // 4. 일반 로그 삭제
        await sequelize.query(
          'DELETE FROM logs WHERE "userId" = :userId',
          {
            replacements: { userId: admin.id },
            type: Sequelize.QueryTypes.DELETE,
          }
        );
        console.log(`사용자 ID ${admin.id}의 로그 삭제 완료`);
        
        // 5. 티켓 삭제
        await sequelize.query(
          'DELETE FROM tickets WHERE "userId" = :userId',
          {
            replacements: { userId: admin.id },
            type: Sequelize.QueryTypes.DELETE,
          }
        );
        console.log(`사용자 ID ${admin.id}의 티켓 삭제 완료`);
        
        // 6. UserProvider 관계 삭제
        await sequelize.query(
          'DELETE FROM user_providers WHERE "userId" = :userId',
          {
            replacements: { userId: admin.id },
            type: Sequelize.QueryTypes.DELETE,
          }
        );
        console.log(`사용자 ID ${admin.id}의 Provider 관계 삭제 완료`);
      }
    }

    // 기존 관리자 계정 삭제
    const deleteResult = await sequelize.query(
      'DELETE FROM users WHERE role = :role',
      {
        replacements: { role: 'admin' },
        type: Sequelize.QueryTypes.DELETE,
      }
    );
    console.log('기존 관리자 계정 삭제 완료');

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(ADMIN_PASSWORD_ENV);

    // 새 관리자 계정 생성
    const insertResult = await sequelize.query(
      `INSERT INTO users (email, password, name, role, "isActive", "emailVerified", "createdAt", "updatedAt") 
       VALUES (:email, :password, :name, 'admin', true, true, NOW(), NOW())
       RETURNING id`,
      {
        replacements: {
          email: ADMIN_EMAIL_ENV,
          password: hashedPassword,
          name: ADMIN_NAME_ENV,
        },
        type: Sequelize.QueryTypes.INSERT,
      }
    );

    const adminId = insertResult[0][0].id;
    console.log(`새 관리자 계정 생성 완료 (ID: ${adminId})`);
    console.log(`이메일: ${ADMIN_EMAIL_ENV}`);
    console.log(`이름: ${ADMIN_NAME_ENV}`);
    console.log(`비밀번호: ${ADMIN_PASSWORD_ENV}`);

    // system_configs 테이블 초기화 (기존 암호화 키와 JWT 시크릿 사용)
    // 이미 테이블이 있는지 확인
    const checkTableResult = await sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_configs'
      )`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const tableExists = checkTableResult[0].exists;

    if (tableExists) {
      // 기존 키가 있는지 확인
      const checkKeysResult = await sequelize.query(
        'SELECT * FROM system_configs WHERE key IN (:jwtKey, :encKey)',
        {
          replacements: { 
            jwtKey: 'JWT_SECRET', 
            encKey: 'ENCRYPTION_KEY' 
          },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      // 키 설정/업데이트
      if (process.env.JWT_SECRET) {
        if (checkKeysResult.some(k => k.key === 'JWT_SECRET')) {
          await sequelize.query(
            'UPDATE system_configs SET value = :value WHERE key = :key',
            {
              replacements: {
                key: 'JWT_SECRET',
                value: process.env.JWT_SECRET,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log('JWT 시크릿 키 업데이트 완료');
        } else {
          await sequelize.query(
            `INSERT INTO system_configs (key, value, description, "createdAt", "updatedAt") 
             VALUES (:key, :value, :description, NOW(), NOW())`,
            {
              replacements: {
                key: 'JWT_SECRET',
                value: process.env.JWT_SECRET,
                description: '환경 변수에서 가져온 JWT 시크릿 키',
              },
              type: Sequelize.QueryTypes.INSERT,
            }
          );
          console.log('JWT 시크릿 키 추가 완료');
        }
      }

      if (process.env.ENCRYPTION_KEY) {
        if (checkKeysResult.some(k => k.key === 'ENCRYPTION_KEY')) {
          await sequelize.query(
            'UPDATE system_configs SET value = :value WHERE key = :key',
            {
              replacements: {
                key: 'ENCRYPTION_KEY',
                value: process.env.ENCRYPTION_KEY,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log('암호화 키 업데이트 완료');
        } else {
          await sequelize.query(
            `INSERT INTO system_configs (key, value, description, "createdAt", "updatedAt") 
             VALUES (:key, :value, :description, NOW(), NOW())`,
            {
              replacements: {
                key: 'ENCRYPTION_KEY',
                value: process.env.ENCRYPTION_KEY,
                description: '환경 변수에서 가져온 암호화 키',
              },
              type: Sequelize.QueryTypes.INSERT,
            }
          );
          console.log('암호화 키 추가 완료');
        }
      }
    } else {
      console.log('system_configs 테이블이 존재하지 않습니다. 서버가 실행되면 자동으로 생성됩니다.');
    }

    console.log('관리자 계정 초기화 완료');
  } catch (error) {
    console.error('관리자 계정 초기화 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
resetAdminAccount(); 