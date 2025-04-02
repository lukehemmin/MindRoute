import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('logs', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      providerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'providers',
          key: 'id',
        },
      },
      requestType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      requestBody: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      responseBody: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      executionTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '실행 시간 (밀리초 단위)',
      },
      promptTokens: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      completionTokens: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      totalTokens: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      error: {
        type: DataTypes.TEXT,
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

    // 인덱스 생성
    await queryInterface.addIndex('logs', ['userId']);
    await queryInterface.addIndex('logs', ['providerId']);
    await queryInterface.addIndex('logs', ['createdAt']);
    await queryInterface.addIndex('logs', ['status']);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('logs');
  },
}; 