// 특정 이메일을 가진 사용자의 역할을 변경하는 스크립트
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// 환경 변수에서 DB 연결 정보 가져오기
const dbConfig = {
  host: process.env.DB_HOST || '192.168.0.228',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mindroute',
  username: process.env.DB_USER || 'lukehemmin',
  password: process.env.DB_PASSWORD || 'Ps.11651844',
  dialect: process.env.DB_DIALECT || 'postgres',
};

const EMAIL_TO_UPDATE = 'ps040211@gmail.com';
const NEW_ROLE = 'admin';

async function updateUserRole() {
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
      logging: false,
    }
  );
  
  try {
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');
    
    // User 모델 정의
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      tableName: 'users',
      timestamps: true,
      underscored: false
    });
    
    // 해당 이메일을 가진 사용자 찾기
    const user = await User.findOne({ where: { email: EMAIL_TO_UPDATE } });
    
    if (!user) {
      console.error(`이메일 ${EMAIL_TO_UPDATE}을 가진 사용자를 찾을 수 없습니다.`);
      process.exit(1);
    }
    
    // 현재 역할 확인
    console.log(`사용자 ${user.name}(${user.email})의 현재 역할: ${user.role}`);
    
    if (user.role === NEW_ROLE) {
      console.log(`사용자는 이미 ${NEW_ROLE} 역할을 가지고 있습니다.`);
      process.exit(0);
    }
    
    // 역할 변경
    await user.update({ role: NEW_ROLE });
    
    console.log(`사용자 ${user.name}(${user.email})의 역할이 ${NEW_ROLE}로 변경되었습니다.`);
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    // 연결 종료
    await sequelize.close();
    console.log('데이터베이스 연결 종료');
  }
}

// 스크립트 실행
updateUserRole(); 