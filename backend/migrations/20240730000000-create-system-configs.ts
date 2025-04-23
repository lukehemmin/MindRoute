import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('system_configs', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: '설정 키 이름',
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '설정 값',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '설정에 대한 설명',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
    
    // 기존 환경 변수에서 설정 값 가져와서 초기 데이터 저장
    const initialConfigs = [];
    
    if (process.env.JWT_SECRET) {
      initialConfigs.push({
        key: 'JWT_SECRET',
        value: process.env.JWT_SECRET,
        description: '환경 변수에서 가져온 JWT 시크릿 키',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    if (process.env.ENCRYPTION_KEY) {
      initialConfigs.push({
        key: 'ENCRYPTION_KEY',
        value: process.env.ENCRYPTION_KEY,
        description: '환경 변수에서 가져온 암호화 키',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    if (initialConfigs.length > 0) {
      await queryInterface.bulkInsert('system_configs', initialConfigs);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('system_configs');
  },
}; 