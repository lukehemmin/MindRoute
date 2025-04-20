import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/error.middleware';
import { User } from '../models/user.model';
import { Provider } from '../models/provider.model';
import { Log } from '../models/log.model';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { encrypt, decrypt } from '../utils/encryption';
import { AiModel } from '../models/aiModel.model';
import modelService from '../services/modelService';
import { v4 as uuidv4 } from 'uuid';
import providerManager from '../utils/providerManager';

/**
 * 모든 사용자 목록 조회
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    // 조회 조건 설정
    const whereCondition: any = {};
    if (search) {
      whereCondition[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // 사용자 목록 조회
    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      attributes: ['id', 'email', 'name', 'role', 'createdAt'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        users: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 사용자 조회
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw ApiError.notFound('사용자를 찾을 수 없습니다.');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 정보 수정
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { email, name, role, isActive } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      throw ApiError.notFound('사용자를 찾을 수 없습니다.');
    }

    // 자기 자신의 관리자 권한을 제거하려고 할 때 방지
    if (user.id === (req.user as any).id && role === 'user' && user.role === 'admin') {
      throw ApiError.badRequest('자신의 관리자 권한을 제거할 수 없습니다.');
    }

    // 필드 업데이트
    user.email = email || user.email;
    user.name = name || user.name;
    user.role = role || user.role;
    
    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: '사용자 정보가 업데이트되었습니다.',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 모든 제공업체 목록 조회
 */
export const getAllProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const providers = await Provider.findAll({
      attributes: [
        'id', 'name', 'type', 'endpointUrl', 'active', 'createdAt'
      ],
      order: [['id', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: providers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 제공업체 생성
 */
export const createProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, type, apiKey, endpointUrl, settings, active } = req.body;

    // 필수 필드 검증
    if (!name || !type || !apiKey) {
      throw ApiError.badRequest('필수 필드가 누락되었습니다.');
    }

    // 제공업체 생성
    const provider = await Provider.create({
      id: uuidv4(),
      name,
      type,
      apiKey, // beforeCreate 훅에서 암호화됨
      endpointUrl: endpointUrl || null,
      settings: settings || {},
      active: active !== undefined ? Boolean(active) : true
    });

    logger.info(`새 제공업체가 생성되었습니다: ${name} (${provider.id})`);

    res.status(201).json({
      success: true,
      message: '제공업체가 성공적으로 생성되었습니다.',
      data: {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        endpointUrl: provider.endpointUrl,
        active: provider.active
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 제공업체 정보 수정
 */
export const updateProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    const { 
      name, apiKey, endpointUrl, 
      settings, active, type
    } = req.body;

    const provider = await Provider.findByPk(providerId);

    if (!provider) {
      throw ApiError.notFound('제공업체를 찾을 수 없습니다.');
    }

    // 필드 업데이트
    if (name) provider.name = name;
    if (type) provider.type = type;
    if (endpointUrl) provider.endpointUrl = endpointUrl;
    if (settings) provider.settings = settings;
    
    // active 값을 명시적으로 설정
    if (active !== undefined) {
      console.log(`활성화 상태 변경: ${provider.id}, 이전: ${provider.active}, 새 값: ${active}`);
      
      // Boolean으로 명시적 변환하여 타입 문제 방지
      const boolActive = Boolean(active);
      
      // 현재 값과 다를 경우에만 변경
      if (provider.active !== boolActive) {
        // Sequelize가 변경을 강제로 감지하도록 처리
        provider.active = !provider.active; // 현재 값 반전
        provider.changed('active', true); // 명시적으로 변경됨을 표시
        provider.active = boolActive; // 실제 목표값으로 설정
        console.log(`활성화 상태 실제 변경됨: ${!provider.active} -> ${boolActive}`);
      } else {
        console.log(`활성화 상태 변경 없음: 현재값과 입력값 동일 (${boolActive})`);
      }
    }

    // API 키가 제공된 경우 암호화
    if (apiKey) {
      logger.info(`제공업체 ${provider.name} API 키 업데이트 시작, 키 길이: ${apiKey.length}`);
      try {
        // API 키의 일부만 로깅하여 보안 유지
        const maskedKey = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 8)}`;
        logger.info(`API 키 업데이트: ${maskedKey}`);
        
        // 이전 API 키 (암호화됨) 저장
        const prevApiKey = provider.apiKey;
        logger.info(`이전 암호화된 API 키: ${prevApiKey.substring(0, 10)}...`);
        
        // 암호화 처리 - encrypt는 동기 함수이므로 await 제거
        provider.apiKey = encrypt(apiKey);
        
        // 암호화된 키의 형식 확인 (일부만 표시)
        const encryptedParts = provider.apiKey.split(':');
        if (encryptedParts.length === 2) {
          logger.info(`암호화된 API 키 형식 확인: [IV(${encryptedParts[0].length}자):암호화된 데이터(${encryptedParts[1].length}자)]`);
        } else {
          logger.warn(`암호화된 API 키 형식이 예상과 다릅니다: ${provider.apiKey.substring(0, 10)}...`);
        }
        
        // API 키가 변경되었는지 명시적으로 확인
        if (prevApiKey !== provider.apiKey) {
          provider.changed('apiKey', true); // 명시적으로 apiKey가 변경되었음을 표시
          logger.info(`제공업체 ${provider.name} API 키 변경 감지됨`);
        } else {
          logger.warn(`제공업체 ${provider.name} API 키 변경 감지되지 않음 - 동일한 API 키`);
        }
        
        logger.info(`제공업체 ${provider.name} API 키 업데이트 완료`);
      } catch (error) {
        logger.error(`API 키 암호화 오류:`, error);
        throw new ApiError(500, 'API 키 암호화 중 오류가 발생했습니다.');
      }
    }

    // 변경된 필드 로깅
    console.log('제공업체 변경된 필드:', provider.changed());
    
    await provider.save();

    logger.info(`제공업체 정보가 업데이트되었습니다: ${providerId}`);

    res.status(200).json({
      success: true,
      message: '제공업체 정보가 업데이트되었습니다.',
      data: {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        endpointUrl: provider.endpointUrl,
        active: provider.active
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 제공업체 삭제
 */
export const deleteProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;

    const provider = await Provider.findByPk(providerId);

    if (!provider) {
      throw ApiError.notFound('제공업체를 찾을 수 없습니다.');
    }

    await provider.destroy();

    logger.info(`제공업체가 삭제되었습니다: ${providerId}`);

    res.status(200).json({
      success: true,
      message: '제공업체가 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API 사용 로그 조회
 */
export const getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const userId = req.query.userId as string;
    const providerId = req.query.providerId as string;
    const status = req.query.status as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // 조회 조건 설정
    const whereCondition: any = {};
    if (userId) whereCondition.userId = userId;
    if (providerId) whereCondition.providerId = providerId;
    if (status) whereCondition.status = status;
    
    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereCondition.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereCondition.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }

    // 로그 목록 조회
    const { count, rows } = await Log.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: Provider,
          as: 'provider',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 로그 상세 조회
 */
export const getLogById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { logId } = req.params;

    const log = await Log.findByPk(logId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name'],
        },
        {
          model: Provider,
          as: 'provider',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!log) {
      throw ApiError.notFound('로그를 찾을 수 없습니다.');
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 모든 AI 모델 조회
 */
export const getAllModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const models = await modelService.getAllModels();
    
    res.status(200).json({
      success: true,
      data: models,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 제공업체의 모델 조회
 */
export const getModelsByProviderId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    
    const models = await modelService.getModelsByProviderId(providerId);
    
    res.status(200).json({
      success: true,
      data: models,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 모델 조회
 */
export const getModelById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { modelId } = req.params;
    
    const model = await modelService.getModelById(modelId);
    
    res.status(200).json({
      success: true,
      data: model,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 모델 생성
 */
export const createModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const modelData = req.body;
    
    const model = await modelService.createModel(modelData);
    
    res.status(201).json({
      success: true,
      message: 'AI 모델이 성공적으로 생성되었습니다.',
      data: model,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 모델 업데이트
 */
export const updateModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { modelId } = req.params;
    const updateData = req.body;
    
    const model = await modelService.updateModel(modelId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'AI 모델 정보가 업데이트되었습니다.',
      data: model,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 모델 삭제
 */
export const deleteModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { modelId } = req.params;
    
    await modelService.deleteModel(modelId);
    
    res.status(200).json({
      success: true,
      message: 'AI 모델이 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 제공업체의 모델 새로고침 - 제공업체 API에서 최신 모델 목록을 가져와 DB에 저장
 */
export const refreshProviderModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    
    if (!providerId) {
      throw new ApiError(400, '제공업체 ID는 필수입니다.');
    }
    
    // 제공업체가 존재하는지 확인
    const provider = await Provider.findByPk(providerId);
    if (!provider) {
      throw new ApiError(404, '제공업체를 찾을 수 없습니다.');
    }
    
    // 제공업체가 활성화되어 있는지 확인
    if (!provider.active) {
      throw new ApiError(400, '비활성화된 제공업체의 모델은 새로고침할 수 없습니다.');
    }
    
    logger.info(`${provider.name} 제공업체 모델 새로고침 시작`);
    
    // 기존 데이터베이스에 저장된 모델 목록 가져오기
    const existingModels = await AiModel.findAll({
      where: { providerId },
      attributes: ['modelId']
    });
    const existingModelIds = existingModels.map(model => model.modelId);
    
    // 제공업체 API에서 최신 모델 목록 가져오기
    const providerInstance = await providerManager.getProvider(providerId);
    if (!providerInstance) {
      throw new ApiError(500, '제공업체 인스턴스를 초기화할 수 없습니다.');
    }
    
    const apiModels = await providerInstance.getModels();
    logger.info(`${provider.name} 제공업체에서 ${apiModels.length}개의 모델을 가져왔습니다.`);
    
    // 새로운 모델만 필터링
    const newModels = apiModels.filter(apiModel => !existingModelIds.includes(apiModel.id));
    
    // 새 모델을 데이터베이스에 저장
    for (const model of newModels) {
      await AiModel.create({
        providerId,
        name: model.name,
        modelId: model.id,
        allowImages: model.features?.includes('images') || false,
        allowVideos: model.features?.includes('videos') || false,
        allowFiles: model.features?.includes('files') || false,
        contextWindow: model.contextWindow,
        inputPrice: model.inputPrice,
        outputPrice: model.outputPrice,
        active: true,
        settings: {}
      });
    }
    
    logger.info(`${provider.name} 제공업체에서 ${newModels.length}개의 새 모델을 추가했습니다.`);
    
    // 업데이트된 모든 모델 반환
    const updatedModels = await AiModel.findAll({
      where: { providerId },
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      message: `${newModels.length}개의 새 모델이 추가되었습니다.`,
      data: updatedModels,
      newModels: newModels.length > 0 ? newModels.map(m => m.name) : []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 모든 활성화된 제공업체의 모델 새로고침
 */
export const refreshAllProviderModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('모든 제공업체 모델 새로고침 시작');
    
    // 활성화된 모든 제공업체 조회
    const activeProviders = await Provider.findAll({
      where: { active: true },
      attributes: ['id', 'name', 'type']
    });
    
    if (activeProviders.length === 0) {
      throw new ApiError(404, '활성화된 제공업체가 없습니다.');
    }
    
    logger.info(`활성화된 제공업체 ${activeProviders.length}개 발견`);
    
    const results: {
      providerId: string;
      providerName: string;
      success: boolean;
      newModelsCount: number;
      error?: string;
    }[] = [];
    
    // 각 제공업체별로 모델 새로고침 수행
    for (const provider of activeProviders) {
      try {
        logger.info(`${provider.name} 제공업체 모델 새로고침 시작`);
        
        // 이미 저장된 모델 ID 조회
        const existingModels = await AiModel.findAll({
          where: { providerId: provider.id },
          attributes: ['modelId']
        });
        const existingModelIds = existingModels.map(model => model.modelId);
        
        // 제공업체 API에서 모델 목록 가져오기
        const providerInstance = await providerManager.getProvider(provider.id);
        if (!providerInstance) {
          results.push({
            providerId: provider.id,
            providerName: provider.name,
            success: false,
            newModelsCount: 0,
            error: '제공업체 인스턴스를 초기화할 수 없습니다.'
          });
          continue;
        }
        
        const apiModels = await providerInstance.getModels();
        
        // 새로운 모델만 필터링
        const newModels = apiModels.filter(apiModel => !existingModelIds.includes(apiModel.id));
        
        // 새 모델을 데이터베이스에 저장
        for (const model of newModels) {
          await AiModel.create({
            providerId: provider.id,
            name: model.name,
            modelId: model.id,
            allowImages: model.features?.includes('images') || false,
            allowVideos: model.features?.includes('videos') || false,
            allowFiles: model.features?.includes('files') || false,
            contextWindow: model.contextWindow,
            inputPrice: model.inputPrice,
            outputPrice: model.outputPrice,
            active: true,
            settings: {}
          });
        }
        
        results.push({
          providerId: provider.id,
          providerName: provider.name,
          success: true,
          newModelsCount: newModels.length
        });
        
        logger.info(`${provider.name} 제공업체에서 ${newModels.length}개의 새 모델 추가 완료`);
      } catch (error: any) {
        logger.error(`${provider.name} 제공업체 모델 새로고침 오류:`, error);
        results.push({
          providerId: provider.id,
          providerName: provider.name,
          success: false,
          newModelsCount: 0,
          error: error.message || '알 수 없는 오류'
        });
      }
    }
    
    // 성공한 제공업체 수와 추가된 총 모델 수 계산
    const successfulProviders = results.filter(r => r.success);
    const totalNewModels = results.reduce((sum, r) => sum + r.newModelsCount, 0);
    
    res.status(200).json({
      success: true,
      message: `${successfulProviders.length}/${activeProviders.length}개 제공업체의 모델 목록이 새로고침되었습니다. 총 ${totalNewModels}개의 새 모델이 추가되었습니다.`,
      data: {
        providerResults: results,
        totalNewModels,
        successfulProviders: successfulProviders.length,
        totalProviders: activeProviders.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 제공업체 API 키와 엔드포인트 테스트
 */
export const debugProviderApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 요청 바디에서 필요한 정보 추출
    const { id, type, apiKey, endpointUrl, name } = req.body;
    
    // 필수 파라미터 검증
    if (!type || !apiKey) {
      throw new ApiError(400, '제공업체 유형과 API 키는 필수입니다.');
    }
    
    console.log(`제공업체 연결 테스트: ${name || '테스트 제공업체'}, 타입: ${type}`);
    
    // 테스트용 임시 Provider 객체 생성
    const testProvider = new Provider({
      id: id || 'test-provider',
      name: name || '테스트 제공업체',
      type,
      apiKey,
      endpointUrl: endpointUrl || null,
      active: true,
      settings: {}
    });
    
    // API 키 암호화
    testProvider.apiKey = encrypt(apiKey);
    
    // 테스트용 Provider 인스턴스 생성
    let providerInstance;
    
    try {
      // 필요한 서비스 모듈 임포트
      const { OpenAIProvider } = require('../services/providers/openai.provider');
      const { AnthropicProvider } = require('../services/providers/anthropic.provider');
      const { GoogleAIProvider } = require('../services/providers/googleai.provider');
      
      // 복호화된 API 키
      const decryptedApiKey = decrypt(testProvider.apiKey);
      
      // 유형에 따라 적절한 Provider 인스턴스 생성
      switch (type) {
        case 'openai':
          providerInstance = new OpenAIProvider(decryptedApiKey, endpointUrl, {});
          break;
        case 'anthropic':
          providerInstance = new AnthropicProvider(decryptedApiKey, {});
          break;
        case 'google':
          providerInstance = new GoogleAIProvider(decryptedApiKey, {});
          break;
        default:
          throw new ApiError(400, '지원되지 않는 제공업체 유형입니다.');
      }
    } catch (error: any) {
      console.error('Provider 인스턴스 생성 오류:', error);
      throw new ApiError(500, `Provider 인스턴스 생성 실패: ${error.message}`);
    }
    
    // 사용 가능한 모델 목록 가져오기 시도
    try {
      const models = await providerInstance.getModels();
      
      // 응답
      res.status(200).json({
        success: true,
        message: '제공업체 API 연결이 성공적으로 테스트되었습니다.',
        data: {
          modelsCount: models.length,
          models: models.slice(0, 10).map(m => ({ id: m.id, name: m.name })), // 처음 10개 모델만 반환
          providerType: type
        }
      });
    } catch (error: any) {
      console.error('API 연결 테스트 오류:', error);
      
      // 오류 유형 분석
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      
      if (error.response && error.response.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'API 키 인증 실패: 유효하지 않은 API 키입니다.';
      } else if (error.code === 'ENOTFOUND') {
        errorCode = 'ENOTFOUND';
        errorMessage = '엔드포인트 URL을 찾을 수 없습니다. URL이 올바른지 확인하세요.';
      } else if (error.code === 'ECONNREFUSED') {
        errorCode = 'ECONNREFUSED';
        errorMessage = '엔드포인트 서버가 연결을 거부했습니다.';
      }
      
      // 실패 응답
      res.status(200).json({
        success: false,
        message: errorMessage,
        error: errorCode,
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
  } catch (error) {
    next(error);
  }
}; 