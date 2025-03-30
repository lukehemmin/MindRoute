import { Request, Response } from 'express';
import { ProviderManager } from '../../../services/providers/ProviderManager';
import { prisma } from '../../../index';
import { logger } from '../../../utils/logger';
import { CryptoService } from '../../../services/CryptoService';

export class ProviderController {
  private providerManager: ProviderManager;
  private cryptoService: CryptoService;

  constructor() {
    this.providerManager = ProviderManager.getInstance();
    this.cryptoService = new CryptoService();
  }

  /**
   * @swagger
   * /api/v1/providers:
   *   get:
   *     summary: 모든 AI 제공자 목록 조회
   *     description: 활성화된 모든 AI 제공자 목록을 조회합니다
   *     tags: [Providers]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 제공자 목록 조회 성공
   *       401:
   *         description: 인증되지 않음
   *       500:
   *         description: 서버 오류
   */
  async getAllProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = this.providerManager.getAllProviders().map(provider => ({
        name: provider.name,
        displayName: provider.displayName,
        isConfigured: provider.isConfigured(),
        isActive: true
      }));

      res.status(200).json(providers);
    } catch (error) {
      logger.error('Failed to get provider list:', error);
      res.status(500).json({ error: 'Failed to get provider list' });
    }
  }

  /**
   * @swagger
   * /api/v1/providers/{name}:
   *   get:
   *     summary: 특정 AI 제공자 상세 정보 조회
   *     description: 특정 AI 제공자에 대한 상세 정보를 조회합니다
   *     tags: [Providers]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: name
   *         required: true
   *         schema:
   *           type: string
   *         description: 제공자 이름
   *     responses:
   *       200:
   *         description: 제공자 정보 조회 성공
   *       401:
   *         description: 인증되지 않음
   *       404:
   *         description: 제공자를 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  async getProvider(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;

      // 관리자 권한 확인
      if (!req.user?.isAdmin) {
        res.status(403).json({ error: '관리자만 접근할 수 있습니다' });
        return;
      }

      const provider = this.providerManager.getProvider(name);

      if (!provider) {
        res.status(404).json({ error: `Provider ${name} not found` });
        return;
      }

      const config = provider.getConfig();
      const models = await provider.listModels();

      res.status(200).json({
        name: provider.name,
        displayName: provider.displayName,
        isConfigured: provider.isConfigured(),
        config,
        availableModels: models,
        isActive: true
      });
    } catch (error) {
      logger.error(`Failed to get provider ${req.params.name}:`, error);
      res.status(500).json({ error: 'Failed to get provider information' });
    }
  }

  /**
   * @swagger
   * /api/v1/providers/{name}/models:
   *   get:
   *     summary: 특정 AI 제공자의 사용 가능한 모델 목록 조회
   *     description: 특정 AI 제공자에서 사용할 수 있는 모델 목록을 조회합니다
   *     tags: [Providers]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: name
   *         required: true
   *         schema:
   *           type: string
   *         description: 제공자 이름
   *     responses:
   *       200:
   *         description: 모델 목록 조회 성공
   *       401:
   *         description: 인증되지 않음
   *       404:
   *         description: 제공자를 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  async getProviderModels(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const provider = this.providerManager.getProvider(name);

      if (!provider) {
        res.status(404).json({ error: `Provider ${name} not found` });
        return;
      }

      if (!provider.isConfigured()) {
        res.status(400).json({ error: `Provider ${name} is not properly configured` });
        return;
      }

      const models = await provider.listModels();
      res.status(200).json({ models });
    } catch (error) {
      logger.error(`Failed to get models for provider ${req.params.name}:`, error);
      res.status(500).json({ error: 'Failed to get provider models' });
    }
  }

  /**
   * @swagger
   * /api/v1/providers/{name}:
   *   put:
   *     summary: AI 제공자 설정 업데이트
   *     description: 특정 AI 제공자의 설정을 업데이트합니다 (관리자 전용)
   *     tags: [Providers]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: name
   *         required: true
   *         schema:
   *           type: string
   *         description: 제공자 이름
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               apiKey:
   *                 type: string
   *                 description: API 키
   *               baseUrl:
   *                 type: string
   *                 description: API 베이스 URL
   *               organization:
   *                 type: string
   *                 description: 조직 ID (OpenAI 전용)
   *               isActive:
   *                 type: boolean
   *                 description: 활성화 여부
   *               modelOptions:
   *                 type: object
   *                 description: 모델별 옵션
   *     responses:
   *       200:
   *         description: 제공자 설정 업데이트 성공
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증되지 않음
   *       403:
   *         description: 권한 없음
   *       500:
   *         description: 서버 오류
   */
  async updateProvider(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const config = req.body;

      // 관리자 권한 확인
      if (!req.user?.isAdmin) {
        res.status(403).json({ error: '관리자만 접근할 수 있습니다' });
        return;
      }

      // API 키가 제공된 경우 암호화
      if (config.apiKey) {
        const encryptedApiKey = await this.cryptoService.encrypt(config.apiKey);
        
        // DB에 저장
        await prisma.provider.upsert({
          where: { name },
          update: {
            apiKey: encryptedApiKey,
            baseUrl: config.baseUrl,
            organization: config.organization,
            isActive: config.isActive !== undefined ? config.isActive : true,
            modelOptions: config.modelOptions || {}
          },
          create: {
            name,
            displayName: this.getDisplayName(name),
            apiKey: encryptedApiKey,
            baseUrl: config.baseUrl,
            organization: config.organization,
            isActive: config.isActive !== undefined ? config.isActive : true,
            modelOptions: config.modelOptions || {}
          }
        });
      }

      // 프로바이더 매니저 업데이트
      const provider = await this.providerManager.updateProvider(name, config);

      if (!provider) {
        res.status(400).json({ error: `Failed to update provider ${name}` });
        return;
      }

      res.status(200).json({
        name: provider.name,
        displayName: provider.displayName,
        isConfigured: provider.isConfigured(),
        isActive: true
      });
    } catch (error) {
      logger.error(`Failed to update provider ${req.params.name}:`, error);
      res.status(500).json({ error: 'Failed to update provider' });
    }
  }

  /**
   * @swagger
   * /api/v1/providers/{name}:
   *   delete:
   *     summary: AI 제공자 비활성화
   *     description: 특정 AI 제공자를 비활성화합니다 (관리자 전용)
   *     tags: [Providers]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: name
   *         required: true
   *         schema:
   *           type: string
   *         description: 제공자 이름
   *     responses:
   *       200:
   *         description: 제공자 비활성화 성공
   *       401:
   *         description: 인증되지 않음
   *       403:
   *         description: 권한 없음
   *       404:
   *         description: 제공자를 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  async deactivateProvider(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;

      // 관리자 권한 확인
      if (!req.user?.isAdmin) {
        res.status(403).json({ error: '관리자만 접근할 수 있습니다' });
        return;
      }

      // DB에서 비활성화
      const provider = await prisma.provider.update({
        where: { name },
        data: { isActive: false }
      });

      if (!provider) {
        res.status(404).json({ error: `Provider ${name} not found` });
        return;
      }

      // 프로바이더 제거
      this.providerManager.removeProvider(name);

      res.status(200).json({ message: `Provider ${name} deactivated successfully` });
    } catch (error) {
      logger.error(`Failed to deactivate provider ${req.params.name}:`, error);
      res.status(500).json({ error: 'Failed to deactivate provider' });
    }
  }

  private getDisplayName(name: string): string {
    switch (name.toLowerCase()) {
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic Claude';
      case 'google':
        return 'Google Gemini';
      default:
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
  }
}
