import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../models/user.model';
import { generateToken, generateRefreshToken, verifyToken, refreshAccessToken } from '../utils/jwt';
import logger from '../utils/logger';
import authService from '../services/auth.service';

/**
 * 사용자 로그인 및 토큰 발급
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // 필수 입력값 검증
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 모두 입력해주세요.',
      });
      return;
    }
    
    // 사용자 에이전트 및 IP 주소 추출
    const userAgent = req.headers['user-agent'];
    const ipAddress = (
      req.headers['x-forwarded-for'] || 
      req.connection.remoteAddress
    ) as string;
    
    // 로그인 처리
    const tokens = await authService.login(
      { email, password },
      userAgent,
      ipAddress
    );
    
    res.json({
      success: true,
      message: '로그인되었습니다.',
      data: tokens,
    });
  } catch (error: any) {
    logger.error('로그인 컨트롤러 오류:', error);
    
    // 인증 관련 오류는 401로 응답
    if (error.message.includes('이메일 또는 비밀번호')) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    } else if (error.message.includes('비활성화')) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: '로그인 처리 중 오류가 발생했습니다.',
        error: error.message,
      });
    }
  }
};

/**
 * 사용자 회원가입 및 토큰 발급
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    
    // 필수 입력값 검증
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: '이메일, 비밀번호, 이름을 모두 입력해주세요.',
      });
      return;
    }
    
    // 사용자 에이전트 및 IP 주소 추출
    const userAgent = req.headers['user-agent'];
    const ipAddress = (
      req.headers['x-forwarded-for'] || 
      req.connection.remoteAddress
    ) as string;
    
    // 회원가입 처리
    const tokens = await authService.register(
      { email, password, name },
      userAgent,
      ipAddress
    );
    
    res.status(201).json({
      success: true,
      message: '회원가입되었습니다.',
      data: tokens,
    });
  } catch (error: any) {
    logger.error('회원가입 컨트롤러 오류:', error);
    
    // 이메일 중복 오류는 409로 응답
    if (error.message.includes('이미 사용 중인 이메일')) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
    } else if (error.message.includes('비밀번호는 최소')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: '회원가입 처리 중 오류가 발생했습니다.',
        error: error.message,
      });
    }
  }
};

/**
 * 로그아웃 처리
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: '리프레시 토큰이 제공되지 않았습니다.',
      });
      return;
    }
    
    // 토큰 취소 처리
    await authService.logout(refreshToken);
    
    res.json({
      success: true,
      message: '로그아웃되었습니다.',
    });
  } catch (error: any) {
    logger.error('로그아웃 컨트롤러 오류:', error);
    
    res.status(500).json({
      success: false,
      message: '로그아웃 처리 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 액세스 토큰 갱신
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: '리프레시 토큰이 제공되지 않았습니다.',
      });
      return;
    }
    
    // 새 액세스 토큰 발급
    const accessToken = await refreshAccessToken(refreshToken);
    
    res.json({
      success: true,
      message: '토큰이 갱신되었습니다.',
      data: {
        accessToken,
      },
    });
  } catch (error: any) {
    logger.error('토큰 갱신 컨트롤러 오류:', error);
    
    // 토큰 오류는 401로 응답
    if (
      error.message.includes('만료') || 
      error.message.includes('유효하지 않은') || 
      error.message.includes('찾을 수 없')
    ) {
      res.status(401).json({
        success: false,
        message: error.message,
        code: 'INVALID_REFRESH_TOKEN',
      });
    } else {
      res.status(500).json({
        success: false,
        message: '토큰 갱신 처리 중 오류가 발생했습니다.',
        error: error.message,
      });
    }
  }
};

/**
 * 현재 인증된 사용자 정보 조회
 */
export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // authenticate 미들웨어에서 req.user에 사용자 정보를 추가함
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error: any) {
    logger.error('사용자 정보 조회 컨트롤러 오류:', error);
    
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 비밀번호 변경
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '인증되지 않은 요청입니다.',
      });
      return;
    }
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
      });
      return;
    }
    
    // 비밀번호 변경
    await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    
    res.json({
      success: true,
      message: '비밀번호가 변경되었습니다.',
    });
  } catch (error: any) {
    logger.error('비밀번호 변경 컨트롤러 오류:', error);
    
    if (error.message.includes('현재 비밀번호가 올바르지 않')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } else if (error.message.includes('비밀번호는 최소')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: '비밀번호 변경 중 오류가 발생했습니다.',
        error: error.message,
      });
    }
  }
}; 