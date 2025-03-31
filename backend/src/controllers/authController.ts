import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import authService from '../services/authService';
import { ApiError } from '../services/providers/baseProvider';
import Joi from 'joi';

// 사용자 등록 검증 스키마
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().required(),
});

// 로그인 검증 스키마
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export class AuthController {
  /**
   * 사용자 등록
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // 요청 데이터 검증
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        throw new ApiError(`유효하지 않은 요청: ${error.message}`, 400);
      }

      // 사용자 등록
      const user = await authService.register({
        email: value.email,
        password: value.password,
        name: value.name,
      });

      // 비밀번호를 제외한 사용자 정보 반환
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json({
        message: '회원가입이 완료되었습니다.',
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 관리자 등록 (기존 관리자만 접근 가능)
   */
  async registerAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      // 요청 데이터 검증
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        throw new ApiError(`유효하지 않은 요청: ${error.message}`, 400);
      }

      // 관리자 등록
      const user = await authService.register({
        email: value.email,
        password: value.password,
        name: value.name,
        role: UserRole.ADMIN,
      });

      // 비밀번호를 제외한 사용자 정보 반환
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json({
        message: '관리자 계정이 생성되었습니다.',
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 로그인
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // 요청 데이터 검증
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        throw new ApiError(`유효하지 않은 요청: ${error.message}`, 400);
      }

      // 로그인 시도
      const { token, user } = await authService.login({
        email: value.email,
        password: value.password,
      });

      return res.status(200).json({
        message: '로그인에 성공했습니다.',
        token,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 프로필 조회
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError('인증되지 않은 요청입니다.', 401);
      }

      return res.status(200).json({
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError('인증되지 않은 요청입니다.', 401);
      }

      const updateSchema = Joi.object({
        name: Joi.string(),
        password: Joi.string().min(8),
      });

      // 요청 데이터 검증
      const { error, value } = updateSchema.validate(req.body);
      if (error) {
        throw new ApiError(`유효하지 않은 요청: ${error.message}`, 400);
      }

      // 사용자 정보 업데이트
      const updatedUser = await authService.updateUser(req.user.id, value);

      // 비밀번호를 제외한 사용자 정보 반환
      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json({
        message: '프로필이 업데이트되었습니다.',
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
