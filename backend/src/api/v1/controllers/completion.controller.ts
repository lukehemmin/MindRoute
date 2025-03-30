import { Request, Response } from 'express';
import { ProviderManager } from '../../../services/providers/ProviderManager';
import { prisma } from '../../../index';
import { logger } from '../../../utils/logger';
import { CompletionOptions } from '../../../services/providers/ProviderInterface';
import { ApiKeyService } from '../../../services/ApiKeyService';

export class CompletionController {
  private providerManager: ProviderManager;
  private apiKeyService: ApiKeyService;

  constructor() {
    this.providerManager = ProviderManager.getInstance();
    this.apiKeyService = new ApiKeyService();
  }

  /**
   * @swagger
   * /api/v1/completions:
   *   post:
   *     summary: AI 텍스트 완성 생성
   *     description: 지정된 프로바이더와 모델을 사용하여 텍스트 완성을 생성합니다
   *     tags: [Completions]
   *     security:
   *       - ApiKeyAuth: []
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - provider
   *               - model
   *             properties:
   *               provider:
   *                 type: string
   *                 description: AI 제공자 (예: openai, anthropic, google)
   *               model:
   *                 type: string
   *                 description: 모델 이름 (예: gpt-4, claude-3-opus-20240229)
   *               messages:
   *                 type: array
   *                 description: 메시지 배열
   *                 items:
   *                   type: object
   *                   properties:
   *                     role:
   *                       type: string
   *                       enum: [system, user, assistant]
   *                     content:
   *                       type: string
   *               prompt:
   *                 type: string
   *                 description: 직접 프롬프트 입력
   *               systemPrompt:
   *                 type: string
   *                 description: 시스템 프롬프트
   *               temperature:
   *                 type: number
   *                 description: 생성 온도 (0.0 ~ 1.0)
   *               maxTokens:
   *                 type: integer
   *                 description: 최대 토큰 수
   *     responses:
   *       200:
   *         description: 텍스트 완성 생성 성공
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증되지 않음
   *       500:
   *         description: 서버 오류
   */
  async createCompletion(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { provider: providerName, model, messages, prompt, systemPrompt, temperature, maxTokens } = req.body;

      // 필요한 파라미터 검증
      if (!providerName || !model) {
        res.status(400).json({ error: 'provider와 model은 필수입니다' });
        return;
      }

      // 메시지나 프롬프트 중 하나는 필수
      if (!messages?.length && !prompt) {
        res.status(400).json({ error: 'messages 배열 또는 prompt 텍스트가 필요합니다' });
        return;
      }

      // 프로바이더 가져오기
      const provider = this.providerManager.getProvider(providerName);
      if (!provider) {
        res.status(400).json({ error: `지원하지 않는 프로바이더: ${providerName}` });
        return;
      }

      if (!provider.isConfigured()) {
        res.status(400).json({ error: `프로바이더 ${providerName}가 올바르게 구성되지 않았습니다` });
        return;
      }

      const options: CompletionOptions = {
        model,
        messages,
        prompt,
        systemPrompt,
        temperature,
        maxTokens
      };

      // AI 완성 요청
      const completionResult = await provider.getCompletion(options);

      // 사용 로그 저장
      const userId = req.user?.id;
      const apiKeyId = req.headers['x-api-key'] ? await this.getApiKeyId(req.headers['x-api-key'] as string) : null;

      await prisma.completionLog.create({
        data: {
          userId,
          apiKeyId,
          provider: providerName,
          model,
          prompt: prompt || (messages?.[0]?.content || ''),
          systemPrompt: systemPrompt || '',
          messages: messages || [],
          temperature,
          maxTokens,
          response: completionResult.content,
          promptTokens: completionResult.promptTokens,
          completionTokens: completionResult.completionTokens,
          totalTokens: completionResult.totalTokens,
          processingTimeMs: Date.now() - startTime,
          isStream: false,
          createdAt: new Date(),
          metadata: {
            rawInfo: completionResult.object
          }
        }
      });

      // 응답
      res.status(200).json({
        id: completionResult.id,
        object: completionResult.object,
        created: completionResult.created,
        model: completionResult.model,
        content: completionResult.content,
        usage: {
          prompt_tokens: completionResult.promptTokens,
          completion_tokens: completionResult.completionTokens,
          total_tokens: completionResult.totalTokens
        }
      });
    } catch (error) {
      logger.error('Completion error:', error);
      res.status(500).json({ error: '텍스트 완성 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/completions/stream:
   *   post:
   *     summary: AI 텍스트 완성 스트리밍 생성
   *     description: 지정된 프로바이더와 모델을 사용하여 스트리밍 방식으로 텍스트 완성을 생성합니다
   *     tags: [Completions]
   *     security:
   *       - ApiKeyAuth: []
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - provider
   *               - model
   *             properties:
   *               provider:
   *                 type: string
   *                 description: AI 제공자 (예: openai, anthropic, google)
   *               model:
   *                 type: string
   *                 description: 모델 이름 (예: gpt-4, claude-3-opus-20240229)
   *               messages:
   *                 type: array
   *                 description: 메시지 배열
   *                 items:
   *                   type: object
   *                   properties:
   *                     role:
   *                       type: string
   *                       enum: [system, user, assistant]
   *                     content:
   *                       type: string
   *               prompt:
   *                 type: string
   *                 description: 직접 프롬프트 입력
   *               systemPrompt:
   *                 type: string
   *                 description: 시스템 프롬프트
   *               temperature:
   *                 type: number
   *                 description: 생성 온도 (0.0 ~ 1.0)
   *               maxTokens:
   *                 type: integer
   *                 description: 최대 토큰 수
   *     responses:
   *       200:
   *         description: 스트리밍 텍스트 완성 생성 성공
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증되지 않음
   *       500:
   *         description: 서버 오류
   */
  async streamCompletion(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { provider: providerName, model, messages, prompt, systemPrompt, temperature, maxTokens } = req.body;

      // 필요한 파라미터 검증
      if (!providerName || !model) {
        res.status(400).json({ error: 'provider와 model은 필수입니다' });
        return;
      }

      // 메시지나 프롬프트 중 하나는 필수
      if (!messages?.length && !prompt) {
        res.status(400).json({ error: 'messages 배열 또는 prompt 텍스트가 필요합니다' });
        return;
      }

      // 프로바이더 가져오기
      const provider = this.providerManager.getProvider(providerName);
      if (!provider) {
        res.status(400).json({ error: `지원하지 않는 프로바이더: ${providerName}` });
        return;
      }

      if (!provider.isConfigured()) {
        res.status(400).json({ error: `프로바이더 ${providerName}가 올바르게 구성되지 않았습니다` });
        return;
      }

      const options: CompletionOptions = {
        model,
        messages,
        prompt,
        systemPrompt,
        temperature,
        maxTokens
      };

      // 스트림 응답 헤더 설정
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // 응답 내용 저장용 변수
      let fullContent = '';
      let promptTokens = 0;
      let completionTokens = 0;

      // 스트리밍 완성 요청 및 응답
      for await (const chunk of provider.streamCompletion(options)) {
        if (chunk.content) {
          fullContent += chunk.content;
          res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
        }
        
        if (chunk.done) {
          res.write('data: [DONE]\n\n');
        }

        // 토큰 정보가 있으면 저장
        if (chunk.tokens) {
          promptTokens = chunk.tokens.promptTokens || 0;
          completionTokens = chunk.tokens.completionTokens || 0;
        }
      }

      // 토큰 계산 (프로바이더가 제공하지 않을 경우 대략적으로 추정)
      const totalPromptTokens = promptTokens || Math.ceil(JSON.stringify(messages || prompt).length / 4);
      const totalCompletionTokens = completionTokens || Math.ceil(fullContent.length / 4);
      const totalTokens = totalPromptTokens + totalCompletionTokens;

      // 사용 로그 저장
      const userId = req.user?.id;
      const apiKeyId = req.headers['x-api-key'] ? await this.getApiKeyId(req.headers['x-api-key'] as string) : null;

      await prisma.completionLog.create({
        data: {
          userId,
          apiKeyId,
          provider: providerName,
          model,
          prompt: prompt || (messages?.[0]?.content || ''),
          systemPrompt: systemPrompt || '',
          messages: messages || [],
          temperature,
          maxTokens,
          response: fullContent,
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
          totalTokens,
          processingTimeMs: Date.now() - startTime,
          isStream: true,
          createdAt: new Date(),
          metadata: {}
        }
      });

      // 스트리밍 종료
      res.end();
    } catch (error) {
      logger.error('Stream completion error:', error);
      // 스트리밍 중 오류가 발생하면 에러 메시지로 응답
      if (!res.headersSent) {
        res.status(500).json({ error: '스트리밍 완성 중 오류가 발생했습니다' });
      } else {
        res.write(`data: ${JSON.stringify({ error: '스트리밍 완성 중 오류가 발생했습니다' })}\n\n`);
        res.end();
      }
    }
  }

  // API 키로 키 ID 조회 헬퍼 메서드
  private async getApiKeyId(apiKey: string): Promise<string | null> {
    try {
      const keyInfo = await this.apiKeyService.getApiKeyByToken(apiKey);
      return keyInfo?.id || null;
    } catch (error) {
      logger.error('Failed to get API key ID:', error);
      return null;
    }
  }
}