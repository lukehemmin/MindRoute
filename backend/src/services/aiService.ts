import { PrismaClient, ProviderType } from '@prisma/client';
import { ProviderManager } from './providerManager';
import { ChatCompletionOptions, CompletionResponse, ApiError } from './providers/baseProvider';
import { recordAIRequest } from '../utils/monitoring';

const prisma = new PrismaClient();
const providerManager = ProviderManager.getInstance();

export class AiService {
  /**
   * 채팅 완성 요청 처리
   */
  async getChatCompletion(
    userId: string,
    providerType: ProviderType,
    options: ChatCompletionOptions
  ): Promise<CompletionResponse> {
    try {
      // 사용자의 AI 제공자 가져오기
      const provider = await providerManager.getProviderForUser(userId, providerType);
      
      // 요청 시작 시간
      const startTime = Date.now();
      
      // AI 제공자에 요청
      const response = await provider.getChatCompletion(options);
      
      // 요청 종료 시간 및 지연 시간 계산
      const endTime = Date.now();
      const latency = endTime - startTime;

      // 제공자 정보 가져오기
      const providerInfo = await prisma.apiProvider.findFirst({
        where: { userId, providerType }
      });

      if (!providerInfo) {
        throw new ApiError(`${providerType} 제공자 정보를 찾을 수 없습니다.`, 404);
      }

      // AI 모델 정보 가져오기 (또는 생성)
      let modelInfo = await prisma.aiModel.findFirst({
        where: {
          name: options.model || provider.getDefaultModel(),
          providerType
        }
      });

      if (!modelInfo) {
        // 모델 정보가 없으면 새로 생성
        modelInfo = await prisma.aiModel.create({
          data: {
            name: options.model || provider.getDefaultModel(),
            providerType,
            description: `${providerType} 모델: ${options.model || provider.getDefaultModel()}`,
            maxTokens: 8192 // 기본값 설정
          }
        });
      }

      // API 사용 로그 저장
      await prisma.apiUsageLog.create({
        data: {
          userId,
          providerId: providerInfo.id,
          modelId: modelInfo.id,
          requestType: 'chat.completion',
          prompt: JSON.stringify(options.messages),
          response: response.content,
          tokensUsed: response.usage.totalTokens,
          status: 'success',
          latency,
          metadata: {
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            topP: options.topP
          },
          // 비용 산정 (추후 확장 가능)
          cost: this.calculateCost(providerType, modelInfo.name, response.usage.totalTokens)
        }
      });

      // 모니터링 기록
      recordAIRequest(
        provider.getName(),
        options.model || provider.getDefaultModel(),
        'success',
        response.usage.totalTokens
      );

      return response;
    } catch (error: any) {
      // 오류 모니터링 기록
      recordAIRequest(
        providerType,
        options.model || 'unknown',
        'error'
      );
      
      throw new ApiError(`AI 요청 처리 중 오류: ${error.message}`, 500);
    }
  }

  /**
   * 사용자별 제공업체 모델 목록 조회
   */
  async listModels(userId: string, providerType: ProviderType): Promise<string[]> {
    try {
      const provider = await providerManager.getProviderForUser(userId, providerType);
      return await provider.listModels();
    } catch (error: any) {
      throw new ApiError(`모델 목록 조회 실패: ${error.message}`, 500);
    }
  }

  /**
   * 비용 계산 (토큰 기반 추정)
   * 참고: 실제 구현에서는 각 모델별 정확한 비용 정보를 데이터베이스에서 관리해야 합니다.
   */
  private calculateCost(providerType: ProviderType, model: string, tokens: number): number {
    // 간단한 예시 비용 계산 (실제 가격은 다를 수 있음)
    if (providerType === ProviderType.OPENAI) {
      if (model.includes('gpt-4')) {
        return tokens * 0.00003; // 예시: GPT-4 토큰당 $0.00003
      } else {
        return tokens * 0.000002; // 예시: GPT-3.5 토큰당 $0.000002
      }
    } else if (providerType === ProviderType.ANTHROPIC) {
      if (model.includes('claude-3-opus')) {
        return tokens * 0.00004; // 예시 가격
      } else {
        return tokens * 0.000025; // 예시 가격
      }
    } else if (providerType === ProviderType.GOOGLE) {
      return tokens * 0.000001; // 예시 가격
    }
    
    return 0; // 기본값
  }

  /**
   * 사용자 API 사용 로그 조회
   */
  async getUserLogs(userId: string, limit: number = 100, offset: number = 0) {
    return prisma.apiUsageLog.findMany({
      where: { userId },
      include: {
        provider: true,
        model: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });
  }

  /**
   * 관리자용 모든 사용자 로그 조회
   */
  async getAllLogs(limit: number = 100, offset: number = 0) {
    return prisma.apiUsageLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        provider: true,
        model: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });
  }
}

export default new AiService();
