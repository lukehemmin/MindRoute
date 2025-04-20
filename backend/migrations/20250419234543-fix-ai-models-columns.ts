import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    try {
      console.log('중복 컬럼 제거 마이그레이션 시작...');
      
      // 1. 중복된 컬럼들을 확인 (소문자 컬럼은 유지, 대소문자 혼합 컬럼은 제거)
      const duplicateColumns = [
        'providerId', 'modelId', 'allowImages', 'allowVideos', 'allowFiles',
        'maxTokens', 'contextWindow', 'inputPrice', 'outputPrice',
        'createdAt', 'updatedAt'
      ];
      
      // 2. 각 중복 컬럼을 하나씩 제거
      for (const column of duplicateColumns) {
        console.log(`컬럼 제거 시도: ${column}`);
        try {
          await queryInterface.removeColumn('ai_models', column);
          console.log(`컬럼 제거 성공: ${column}`);
        } catch (err) {
          // 컬럼이 존재하지 않으면 무시하고 계속 진행
          console.log(`컬럼 제거 중 오류 (무시됨): ${column} - ${(err as Error).message}`);
        }
      }
      
      console.log('중복 컬럼 제거 마이그레이션 완료');
    } catch (error) {
      console.error('마이그레이션 오류:', error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // 롤백은 지원하지 않음 (컬럼을 다시 추가하면 데이터가 손실될 수 있음)
    console.log('롤백은 지원되지 않습니다.');
  }
}; 