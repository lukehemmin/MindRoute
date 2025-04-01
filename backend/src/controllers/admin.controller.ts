import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/error.middleware';
import { User } from '../models/user.model';
import { Provider } from '../models/provider.model';
import { Log } from '../models/log.model';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { encrypt } from '../utils/encryption';

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
        { username: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // 사용자 목록 조회
    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      attributes: ['id', 'email', 'username', 'role', 'createdAt'],
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
      attributes: ['id', 'email', 'username', 'role', 'createdAt', 'updatedAt'],
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
    const { email, username, role, isActive } = req.body;

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
    user.username = username || user.username;
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
        username: user.username,
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
        'id', 'name', 'endpointUrl', 'allowImages', 'allowVideos', 
        'allowFiles', 'maxTokens', 'isActive', 'createdAt'
      ],
      order: [['createdAt', 'DESC']],
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
 * 새 제공업체 추가
 */
export const createProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      id, name, apiKey, endpointUrl, 
      allowImages, allowVideos, allowFiles, 
      maxTokens, settings 
    } = req.body;

    // ID 중복 확인
    const existingProvider = await Provider.findByPk(id);
    if (existingProvider) {
      throw ApiError.conflict('이미 존재하는 제공업체 ID입니다.');
    }

    // API 키 암호화
    const encryptedApiKey = await encrypt(apiKey);

    // 제공업체 생성
    const provider = await Provider.create({
      id,
      name,
      apiKey: encryptedApiKey,
      endpointUrl,
      allowImages: allowImages !== undefined ? allowImages : false,
      allowVideos: allowVideos !== undefined ? allowVideos : false,
      allowFiles: allowFiles !== undefined ? allowFiles : false,
      maxTokens: maxTokens || null,
      settings: settings || {},
      isActive: true,
    });

    logger.info(`새 제공업체가 추가되었습니다: ${id} (${name})`);

    res.status(201).json({
      success: true,
      message: '제공업체가 성공적으로 추가되었습니다.',
      data: {
        id: provider.id,
        name: provider.name,
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
      allowImages, allowVideos, allowFiles, 
      maxTokens, settings, isActive 
    } = req.body;

    const provider = await Provider.findByPk(providerId);

    if (!provider) {
      throw ApiError.notFound('제공업체를 찾을 수 없습니다.');
    }

    // 필드 업데이트
    if (name) provider.name = name;
    if (endpointUrl) provider.endpointUrl = endpointUrl;
    if (allowImages !== undefined) provider.allowImages = allowImages;
    if (allowVideos !== undefined) provider.allowVideos = allowVideos;
    if (allowFiles !== undefined) provider.allowFiles = allowFiles;
    if (maxTokens !== undefined) provider.maxTokens = maxTokens;
    if (settings) provider.settings = settings;
    if (isActive !== undefined) provider.isActive = isActive;

    // API 키가 제공된 경우 암호화
    if (apiKey) {
      provider.apiKey = await encrypt(apiKey);
    }

    await provider.save();

    logger.info(`제공업체 정보가 업데이트되었습니다: ${providerId}`);

    res.status(200).json({
      success: true,
      message: '제공업체 정보가 업데이트되었습니다.',
      data: {
        id: provider.id,
        name: provider.name,
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
          attributes: ['id', 'email', 'username'],
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
          attributes: ['id', 'email', 'username'],
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