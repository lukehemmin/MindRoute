import { Request, Response } from 'express';
import { prisma } from '../../../index';
import { logger } from '../../../utils/logger';
import { ApiKeyService } from '../../../services/ApiKeyService';

export class UserController {
  private apiKeyService: ApiKeyService;

  constructor() {
    this.apiKeyService = new ApiKeyService();
  }

  /**
   * @swagger
   * /api/v1/users/me:
   *   get:
   *     summary: 현재 사용자 정보 조회
   *     description: 현재 로그인한 사용자의 정보를 조회합니다
   *     tags: [Users]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 사용자 정보 조회 성공
   *       401:
   *         description: 인증되지 않음
   *       500:
   *         description: 서버 오류
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: '인증되지 않았습니다' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { role: true }
      });

      if (!user) {
        res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
        return;
      }

      // 비밀번호 제외하고 응답
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        ...userWithoutPassword,
        isAdmin: user.role.name === 'admin'
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/users/me:
   *   put:
   *     summary: 현재 사용자 정보 수정
   *     description: 현재 로그인한 사용자의 정보를 수정합니다
   *     tags: [Users]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *     responses:
   *       200:
   *         description: 사용자 정보 수정 성공
   *       401:
   *         description: 인증되지 않음
   *       500:
   *         description: 서버 오류
   */
  async updateCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: '인증되지 않았습니다' });
        return;
      }

      const { name } = req.body;

      if (!name) {
        res.status(400).json({ error: '이름은 필수입니다' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name,
          updatedAt: new Date()
        },
        include: { role: true }
      });

      // 비밀번호 제외하고 응답
      const { password, ...userWithoutPassword } = updatedUser;

      res.status(200).json({
        ...userWithoutPassword,
        isAdmin: updatedUser.role.name === 'admin'
      });
    } catch (error) {
      logger.error('Update current user error:', error);
      res.status(500).json({ error: '사용자 정보 수정 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/users/api-keys:
   *   get:
   *     summary: API 키 목록 조회
   *     description: 현재 사용자의 API 키 목록을 조회합니다
   *     tags: [API Keys]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: API 키 목록 조회 성공
   *       401:
   *         description: 인증되지 않음
   *       500:
   *         description: 서버 오류
   */
  async getApiKeys(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: '인증되지 않았습니다' });
        return;
      }

      const apiKeys = await this.apiKeyService.getUserApiKeys(req.user.id);
      res.status(200).json(apiKeys);
    } catch (error) {
      logger.error('Get API keys error:', error);
      res.status(500).json({ error: 'API 키 목록 조회 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/users/api-keys:
   *   post:
   *     summary: API 키 생성
   *     description: 새로운 API 키를 생성합니다
   *     tags: [API Keys]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *               expiresAt:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       201:
   *         description: API 키 생성 성공
   *       401:
   *         description: 인증되지 않음
   *       500:
   *         description: 서버 오류
   */
  async createApiKey(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: '인증되지 않았습니다' });
        return;
      }

      const { name, expiresAt } = req.body;

      if (!name) {
        res.status(400).json({ error: 'API 키 이름은 필수입니다' });
        return;
      }

      // 만료일 파싱 (제공된 경우)
      let parsedExpiresAt: Date | undefined;
      if (expiresAt) {
        parsedExpiresAt = new Date(expiresAt);
        if (isNaN(parsedExpiresAt.getTime())) {
          res.status(400).json({ error: '유효하지 않은 만료일 형식입니다' });
          return;
        }
      }

      const apiKey = await this.apiKeyService.createApiKey(req.user.id, name, parsedExpiresAt);
      res.status(201).json(apiKey);
    } catch (error) {
      logger.error('Create API key error:', error);
      res.status(500).json({ error: 'API 키 생성 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/users/api-keys/{keyId}:
   *   put:
   *     summary: API 키 수정
   *     description: API 키 상태(활성화/비활성화)를 수정합니다
   *     tags: [API Keys]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: keyId
   *         required: true
   *         schema:
   *           type: string
   *         description: API 키 ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - isActive
   *             properties:
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: API 키 수정 성공
   *       401:
   *         description: 인증되지 않음
   *       404:
   *         description: API 키를 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  async updateApiKey(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: '인증되지 않았습니다' });
        return;
      }

      const { keyId } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        res.status(400).json({ error: 'isActive 필드는 필수입니다' });
        return;
      }

      // API 키 소유권 확인
      const apiKey = await this.apiKeyService.getApiKeyById(keyId, req.user.id);
      if (!apiKey) {
        res.status(404).json({ error: 'API 키를 찾을 수 없습니다' });
        return;
      }

      // API 키 상태 업데이트
      let result: boolean;
      if (isActive) {
        result = await this.apiKeyService.activateApiKey(keyId, req.user.id);
      } else {
        result = await this.apiKeyService.deactivateApiKey(keyId, req.user.id);
      }

      if (!result) {
        res.status(404).json({ error: 'API 키를 찾을 수 없거나 업데이트할 수 없습니다' });
        return;
      }

      // 업데이트된 API 키 반환
      const updatedApiKey = await this.apiKeyService.getApiKeyById(keyId, req.user.id);
      res.status(200).json(updatedApiKey);
    } catch (error) {
      logger.error('Update API key error:', error);
      res.status(500).json({ error: 'API 키 업데이트 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/users/api-keys/{keyId}:
   *   delete:
   *     summary: API 키 삭제
   *     description: API 키를 삭제합니다
   *     tags: [API Keys]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: keyId
   *         required: true
   *         schema:
   *           type: string
   *         description: API 키 ID
   *     responses:
   *       200:
   *         description: API 키 삭제 성공
   *       401:
   *         description: 인증되지 않음
   *       404:
   *         description: API 키를 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  async deleteApiKey(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: '인증되지 않았습니다' });
        return;
      }

      const { keyId } = req.params;

      // API 키 소유권 확인
      const apiKey = await this.apiKeyService.getApiKeyById(keyId, req.user.id);
      if (!apiKey) {
        res.status(404).json({ error: 'API 키를 찾을 수 없습니다' });
        return;
      }

      // API 키 삭제 (소프트 딜리트)
      const result = await this.apiKeyService.deleteApiKey(keyId, req.user.id);
      if (!result) {
        res.status(404).json({ error: 'API 키를 찾을 수 없거나 삭제할 수 없습니다' });
        return;
      }

      res.status(200).json({ message: 'API 키가 성공적으로 삭제되었습니다' });
    } catch (error) {
      logger.error('Delete API key error:', error);
      res.status(500).json({ error: 'API 키 삭제 중 오류가 발생했습니다' });
    }
  }
}
