import { v4 as uuidv4 } from 'uuid';
import { AiModel, Provider } from '../models';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

/**
 * AI 모델 생성 인터페이스
 */
export interface CreateModelDto {
  providerId: string;
  name: string;
  modelId: string;
  allowImages: boolean;
  allowVideos: boolean;
  allowFiles: boolean;
  maxTokens?: number;
  contextWindow?: number;
  inputPrice?: number;
  outputPrice?: number;
  settings?: {
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    systemPrompt?: string;
    stopSequences?: string[];
    seed?: number;
    responseFormat?: string;
    [key: string]: any;
  };
  active: boolean;
}

/**
 * AI 모델 업데이트 인터페이스
 */
export interface UpdateModelDto {
  name?: string;
  modelId?: string;
  allowImages?: boolean;
  allowVideos?: boolean;
  allowFiles?: boolean;
  maxTokens?: number;
  contextWindow?: number;
  inputPrice?: number;
  outputPrice?: number;
  settings?: {
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    systemPrompt?: string;
    stopSequences?: string[];
    seed?: number;
    responseFormat?: string;
    [key: string]: any;
  };
  active?: boolean;
}

/**
 * AI 모델 서비스 클래스
 */
class ModelService {
  /**
   * 모든 AI 모델 조회
   */
  public async getAllModels() {
    try {
      return await AiModel.findAll({
        include: [
          {
            model: Provider,
            as: 'provider',
            attributes: ['id', 'name', 'type', 'active']
          }
        ]
      });
    } catch (error) {
      logger.error('모든 AI 모델 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 특정 제공업체의 모델 조회
   */
  public async getModelsByProviderId(providerId: string) {
    try {
      const provider = await Provider.findByPk(providerId);
      if (!provider) {
        throw new ApiError(404, '제공업체를 찾을 수 없습니다.');
      }

      return await AiModel.findAll({
        where: { providerId },
        order: [['name', 'ASC']]
      });
    } catch (error) {
      logger.error(`제공업체 ID(${providerId})의 모델 조회 중 오류:`, error);
      throw error;
    }
  }

  /**
   * 특정 모델 조회
   */
  public async getModelById(modelId: string) {
    try {
      const model = await AiModel.findByPk(modelId, {
        include: [
          {
            model: Provider,
            as: 'provider',
            attributes: ['id', 'name', 'type', 'active']
          }
        ]
      });

      if (!model) {
        throw new ApiError(404, '모델을 찾을 수 없습니다.');
      }

      return model;
    } catch (error) {
      logger.error(`모델 ID(${modelId}) 조회 중 오류:`, error);
      throw error;
    }
  }

  /**
   * 모델 생성
   */
  public async createModel(modelData: CreateModelDto) {
    try {
      // 제공업체 존재 여부 확인
      const provider = await Provider.findByPk(modelData.providerId);
      if (!provider) {
        throw new ApiError(404, '제공업체를 찾을 수 없습니다.');
      }

      // 중복 모델 ID 확인
      const existingModel = await AiModel.findOne({
        where: {
          providerId: modelData.providerId,
          modelId: modelData.modelId
        }
      });

      if (existingModel) {
        throw new ApiError(400, '이미 같은 제공업체에 동일한 모델 ID가 존재합니다.');
      }

      // 기본 설정 합치기
      const defaultSettings = {
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        systemPrompt: '',
        streaming: true
      };

      // 모델 생성
      const model = await AiModel.create({
        ...modelData,
        settings: {
          ...defaultSettings,
          ...modelData.settings
        }
      });

      logger.info(`새 AI 모델이 생성되었습니다: ${model.name} (${model.modelId})`);
      
      return model;
    } catch (error) {
      logger.error('AI 모델 생성 중 오류:', error);
      throw error;
    }
  }

  /**
   * 모델 업데이트
   */
  public async updateModel(modelId: string, updateData: UpdateModelDto) {
    try {
      const model = await AiModel.findByPk(modelId);
      if (!model) {
        throw new ApiError(404, '모델을 찾을 수 없습니다.');
      }

      // 설정 업데이트 처리
      if (updateData.settings) {
        updateData.settings = {
          ...model.settings,
          ...updateData.settings
        };
      }

      // 모델 업데이트
      await model.update(updateData);
      
      logger.info(`AI 모델이 업데이트되었습니다: ${model.name} (${model.modelId})`);
      
      return model;
    } catch (error) {
      logger.error(`모델 ID(${modelId}) 업데이트 중 오류:`, error);
      throw error;
    }
  }

  /**
   * 모델 삭제
   */
  public async deleteModel(modelId: string) {
    try {
      const model = await AiModel.findByPk(modelId);
      if (!model) {
        throw new ApiError(404, '모델을 찾을 수 없습니다.');
      }

      await model.destroy();
      
      logger.info(`AI 모델이 삭제되었습니다: ${model.name} (${model.modelId})`);
      
      return true;
    } catch (error) {
      logger.error(`모델 ID(${modelId}) 삭제 중 오류:`, error);
      throw error;
    }
  }
}

export default new ModelService(); 