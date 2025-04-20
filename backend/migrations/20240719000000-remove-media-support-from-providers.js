'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Provider 테이블에서 media 지원 필드 제거
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('providers', 'allowImages', { transaction });
      await queryInterface.removeColumn('providers', 'allowVideos', { transaction });
      await queryInterface.removeColumn('providers', 'allowFiles', { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백 시 제거한 필드 복구
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('providers', 'allowImages', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });
      
      await queryInterface.addColumn('providers', 'allowVideos', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });
      
      await queryInterface.addColumn('providers', 'allowFiles', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });
    });
  }
}; 