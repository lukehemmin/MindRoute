import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('userProviders', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      providerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'providers',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      allowed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      maxTokensOverride: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customApiKey: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '사용자 자신의 API 키 (암호화됨)',
      },
      useCustomApiKey: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      settings: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // 고유 제약 조건 추가 (한 사용자는 특정 프로바이더에 대한 설정을 하나만 가질 수 있음)
    await queryInterface.addConstraint('userProviders', {
      fields: ['userId', 'providerId'],
      type: 'unique',
      name: 'unique_user_provider',
    });

    // 인덱스 생성
    await queryInterface.addIndex('userProviders', ['userId']);
    await queryInterface.addIndex('userProviders', ['providerId']);
    await queryInterface.addIndex('userProviders', ['allowed']);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('userProviders');
  }
}; 