'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('api_logs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      apiKeyId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'api_keys',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      apiKeyName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      apiKey: {
        type: Sequelize.STRING,
        allowNull: true
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true
      },
      input: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      output: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      promptTokens: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      completionTokens: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      totalTokens: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      configuration: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 인덱스 생성
    await queryInterface.addIndex('api_logs', ['userId']);
    await queryInterface.addIndex('api_logs', ['apiKeyId']);
    await queryInterface.addIndex('api_logs', ['createdAt']);
    await queryInterface.addIndex('api_logs', ['model']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('api_logs');
  }
}; 