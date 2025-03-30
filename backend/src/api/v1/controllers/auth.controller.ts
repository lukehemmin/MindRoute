import { Request, Response } from 'express';
import { prisma } from '../../../index';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { logger } from '../../../utils/logger';

export class AuthController {
  /**
   * @swagger
   * /api/v1/auth/register:
   *   post:
   *     summary: 회원가입
   *     description: 새로운 사용자 계정을 생성합니다
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - password
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *     responses:
   *       201:
   *         description: 회원가입 성공
   *       400:
   *         description: 잘못된 요청
   *       409:
   *         description: 이메일 중복
   *       500:
   *         description: 서버 오류
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      // 필수 필드 검증
      if (!name || !email || !password) {
        res.status(400).json({ error: '모든 필드를 입력해주세요' });
        return;
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: '유효한 이메일 주소를 입력해주세요' });
        return;
      }

      // 비밀번호 길이 검증
      if (password.length < 8) {
        res.status(400).json({ error: '비밀번호는 최소 8자 이상이어야 합니다' });
        return;
      }

      // 이메일 중복 검사
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        res.status(409).json({ error: '이미 사용 중인 이메일입니다' });
        return;
      }

      // 기본 사용자 역할 가져오기
      const userRole = await prisma.role.findFirst({
        where: { name: 'user' }
      });

      if (!userRole) {
        logger.error('기본 사용자 역할을 찾을 수 없습니다');
        res.status(500).json({ error: '사용자 등록 중 오류가 발생했습니다' });
        return;
      }

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 10);

      // 사용자 생성
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId: userRole.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date()
        },
        include: {
          role: true
        }
      });

      // JWT 생성
      const token = jwt.sign(
        { id: user.id, email: user.email, roleId: user.roleId },
        process.env.JWT_SECRET || 'mindroute-default-jwt-secret',
        { expiresIn: process.env.JWT_EXPIRATION || '24h' }
      );

      // 응답에서 비밀번호 제외
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        message: '회원가입이 완료되었습니다',
        token,
        user: {
          ...userWithoutPassword,
          isAdmin: user.role.name === 'admin'
        }
      });
    } catch (error) {
      logger.error('Register error:', error);
      res.status(500).json({ error: '사용자 등록 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: 로그인
   *     description: 이메일과 비밀번호로 로그인합니다
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: 로그인 성공
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증 실패
   *       500:
   *         description: 서버 오류
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // 필수 필드 검증
      if (!email || !password) {
        res.status(400).json({ error: '이메일과 비밀번호를 모두 입력해주세요' });
        return;
      }

      // 사용자 조회
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          role: true
        }
      });

      // 사용자가 없거나 비활성화된 경우
      if (!user || !user.isActive) {
        res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
        return;
      }

      // 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
        return;
      }

      // 마지막 로그인 시간 업데이트
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // JWT 생성
      const token = jwt.sign(
        { id: user.id, email: user.email, roleId: user.roleId },
        process.env.JWT_SECRET || 'mindroute-default-jwt-secret',
        { expiresIn: process.env.JWT_EXPIRATION || '24h' }
      );

      // 응답에서 비밀번호 제외
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        message: '로그인 성공',
        token,
        user: {
          ...userWithoutPassword,
          isAdmin: user.role.name === 'admin'
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: '로그인 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/auth/profile:
   *   get:
   *     summary: 내 프로필 조회
   *     description: 현재 로그인한 사용자의 프로필 정보를 조회합니다
   *     tags: [Auth]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 프로필 조회 성공
   *       401:
   *         description: 인증되지 않음
   *       500:
   *         description: 서버 오류
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: '인증되지 않았습니다' });
        return;
      }

      const userId = req.user.id;

      // 사용자 정보 조회
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          roleId: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true
        }
      });

      if (!user) {
        res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
        return;
      }

      // 관리자 여부 추가
      const userData = {
        ...user,
        isAdmin: user.role.name === 'admin'
      };

      res.status(200).json(userData);
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: '프로필 조회 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/auth/change-password:
   *   post:
   *     summary: 비밀번호 변경
   *     description: 현재 비밀번호를 확인하고 새 비밀번호로 변경합니다
   *     tags: [Auth]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 format: password
   *               newPassword:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: 비밀번호 변경 성공
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증 실패
   *       500:
   *         description: 서버 오류
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: '인증되지 않았습니다' });
        return;
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // 필수 필드 검증
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요' });
        return;
      }

      // 새 비밀번호 길이 검증
      if (newPassword.length < 8) {
        res.status(400).json({ error: '비밀번호는 최소 8자 이상이어야 합니다' });
        return;
      }

      // 사용자 조회
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
        return;
      }

      // 현재 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다' });
        return;
      }

      // 새 비밀번호 해싱
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // 비밀번호 업데이트
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      });

      res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다' });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({ error: '비밀번호 변경 중 오류가 발생했습니다' });
    }
  }
}
