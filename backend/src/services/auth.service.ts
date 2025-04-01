import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import User, { UserRole } from '../models/user.model';
import RefreshToken from '../models/refreshtoken.model';
import { generateAccessToken, generateRefreshToken, revokeRefreshToken } from '../utils/jwt';
import logger from '../utils/logger';
import authConfig from '../config/auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number | string;
}

class AuthService {
  /**
   * 사용자 로그인 처리 및 토큰 발급
   */
  public async login(
    credentials: LoginCredentials,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    try {
      const { email, password } = credentials;
      
      // 이메일로 사용자 찾기
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
      
      // 비밀번호 검증
      const isPasswordValid = await user.validatePassword(password);
      
      if (!isPasswordValid) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
      
      // 계정 활성화 여부 확인
      if (!user.active) {
        throw new Error('비활성화된 계정입니다. 관리자에게 문의하세요.');
      }
      
      // 로그인 시간 업데이트
      await user.update({ lastLogin: new Date() });
      
      // 토큰 발급
      const accessToken = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user, userAgent, ipAddress);
      
      return {
        accessToken,
        refreshToken,
        expiresIn: authConfig.jwt.accessTokenExpiration,
      };
    } catch (error) {
      logger.error('로그인 오류:', error);
      throw error;
    }
  }
  
  /**
   * 사용자 회원가입 및 토큰 발급
   */
  public async register(
    userData: RegisterData,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    try {
      const { email, password, name, role } = userData;
      
      // 이메일 중복 확인
      const existingUser = await User.findOne({ where: { email } });
      
      if (existingUser) {
        throw new Error('이미 사용 중인 이메일입니다.');
      }
      
      // 비밀번호 유효성 검사
      if (password.length < authConfig.password.minLength) {
        throw new Error(`비밀번호는 최소 ${authConfig.password.minLength}자 이상이어야 합니다.`);
      }
      
      // 새 사용자 생성
      const user = await User.create({
        id: uuidv4(),
        email,
        name,
        passwordHash: await bcrypt.hash(password, authConfig.password.saltRounds),
        role: role || 'user',
        active: true,
        lastLogin: new Date(),
      });
      
      // 토큰 발급
      const accessToken = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user, userAgent, ipAddress);
      
      return {
        accessToken,
        refreshToken,
        expiresIn: authConfig.jwt.accessTokenExpiration,
      };
    } catch (error) {
      logger.error('회원가입 오류:', error);
      throw error;
    }
  }
  
  /**
   * 로그아웃 처리 (리프레시 토큰 취소)
   */
  public async logout(refreshToken: string): Promise<boolean> {
    try {
      // 토큰 정보 찾기
      const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken, revoked: false },
      });
      
      if (!tokenRecord) {
        throw new Error('유효하지 않은 리프레시 토큰입니다.');
      }
      
      // 토큰 취소
      return await revokeRefreshToken(tokenRecord.id, '로그아웃으로 인한 취소');
    } catch (error) {
      logger.error('로그아웃 오류:', error);
      throw error;
    }
  }
  
  /**
   * 초기 관리자 계정 생성
   */
  public async createInitialAdmin(): Promise<void> {
    try {
      const { email, password, name } = authConfig.admin;
      
      // 관리자 계정이 이미 존재하는지 확인
      const existingAdmin = await User.findOne({
        where: { role: 'admin' },
      });
      
      if (existingAdmin) {
        logger.info('관리자 계정이 이미 존재합니다.');
        return;
      }
      
      // 관리자 계정 생성
      await User.create({
        id: uuidv4(),
        email,
        name,
        passwordHash: await bcrypt.hash(password, authConfig.password.saltRounds),
        role: 'admin',
        active: true,
      });
      
      logger.info('초기 관리자 계정이 생성되었습니다.');
    } catch (error) {
      logger.error('초기 관리자 계정 생성 오류:', error);
      throw error;
    }
  }
  
  /**
   * 비밀번호 검증 유틸리티 함수
   */
  public async validatePassword(
    userId: string,
    password: string
  ): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return false;
      }
      
      return await user.validatePassword(password);
    } catch (error) {
      logger.error('비밀번호 검증 오류:', error);
      return false;
    }
  }
  
  /**
   * 비밀번호 변경
   */
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      
      // 현재 비밀번호 검증
      const isPasswordValid = await user.validatePassword(currentPassword);
      
      if (!isPasswordValid) {
        throw new Error('현재 비밀번호가 올바르지 않습니다.');
      }
      
      // 새 비밀번호 유효성 검사
      if (newPassword.length < authConfig.password.minLength) {
        throw new Error(`비밀번호는 최소 ${authConfig.password.minLength}자 이상이어야 합니다.`);
      }
      
      // 비밀번호 업데이트
      user.passwordHash = await bcrypt.hash(newPassword, authConfig.password.saltRounds);
      await user.save();
      
      return true;
    } catch (error) {
      logger.error('비밀번호 변경 오류:', error);
      throw error;
    }
  }
}

export default new AuthService(); 