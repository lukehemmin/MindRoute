import { Request, Response } from 'express';
import { User, UserRole } from '../models/user.model';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import logger from '../utils/logger';

// 사용자 등록
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
      return;
    }

    // 새 사용자 생성 (기본 역할: 'user')
    const user = await User.create({
      email,
      password, // 모델의 훅에서 해싱됨
      firstName,
      lastName,
      role: UserRole.USER,
    });

    // 토큰 생성
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 응답 (민감한 정보 제외)
    res.status(201).json({
      message: '사용자가 성공적으로 등록되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    logger.error(`회원가입 오류: ${error}`);
    res.status(500).json({ message: '회원가입 처리 중 오류가 발생했습니다.' });
  }
};

// 사용자 로그인
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 사용자 조회
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    // 비밀번호 검증
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    // 계정이 활성화되어 있는지 확인
    if (!user.active) {
      res.status(403).json({ message: '비활성화된 계정입니다. 관리자에게 문의하세요.' });
      return;
    }

    // 토큰 생성
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 응답
    res.status(200).json({
      message: '로그인 성공',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    logger.error(`로그인 오류: ${error}`);
    res.status(500).json({ message: '로그인 처리 중 오류가 발생했습니다.' });
  }
};

// 토큰 갱신
export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: '리프레시 토큰이 제공되지 않았습니다.' });
      return;
    }

    // 리프레시 토큰 검증 및 새 액세스 토큰 생성
    try {
      const payload = verifyToken(refreshToken);
      const newToken = generateToken(payload);

      res.status(200).json({
        message: '토큰이 성공적으로 갱신되었습니다.',
        token: newToken,
      });
    } catch (error) {
      res.status(401).json({ message: '리프레시 토큰이 유효하지 않거나 만료되었습니다.' });
    }
  } catch (error) {
    logger.error(`토큰 갱신 오류: ${error}`);
    res.status(500).json({ message: '토큰 갱신 중 오류가 발생했습니다.' });
  }
}; 