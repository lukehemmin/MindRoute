import { v4 as uuidv4 } from 'uuid';
import providerManager from '../utils/providerManager';
import logger from '../utils/logger';
import { Provider } from '../models/provider.model';
import { Log } from '../models/log.model';
import { 
  IChatRequest, 
  ICompletionRequest,
  IMessage, 
  IFile 
} from '../utils/providerManager';

interface ChatOptions {
  userId: number;
  providerId: string;
  messages: IMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  files?: any[];
}

interface CompletionOptions {
  userId: number;
  providerId: string;
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

class AIService {
  /**
   * 사용 가능한 모든 프로바이더 목록 조회
   */
  public async getProviders(): Promise<any[]> {
    try {
      return await providerManager.getProviders();
    } catch (error: any) {
      logger.error('프로바이더 목록 조회 오류:', error);
      throw new Error('프로바이더 정보를 가져오는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 특정 프로바이더의 모델 목록 조회
   */
  public async getModels(providerId: string): Promise<any[]> {
    try {
      const provider = await providerManager.getProvider(providerId);
      
      if (!provider) {
        throw new Error(`프로바이더를 찾을 수 없습니다: ${providerId}`);
      }
      
      return await provider.getModels();
    } catch (error: any) {
      logger.error(`모델 목록 조회 오류 (${providerId}):`, error);
      throw new Error('모델 정보를 가져오는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 채팅 요청 처리
   */
  public async chat(options: ChatOptions): Promise<any> {
    const startTime = Date.now();
    let logId: string | null = null;
    
    try {
      const { userId, providerId, messages, model, temperature, maxTokens, files = [] } = options;
      
      // 프로바이더 가져오기
      const provider = await providerManager.getProvider(providerId);
      const providerDb = await providerManager.getProviderDb(providerId);
      
      if (!provider || !providerDb) {
        throw new Error(`프로바이더를 찾을 수 없습니다: ${providerId}`);
      }
      
      // 이미지 처리
      const updatedMessages = [...messages];
      const imageFiles = files.filter((file: any) => file.mimetype?.startsWith('image/'));
      
      if (imageFiles.length > 0 && !providerDb.allowImages) {
        throw new Error('이 프로바이더는 이미지를 지원하지 않습니다.');
      }
      
      // 비디오 처리
      const videoFiles = files.filter((file: any) => file.mimetype?.startsWith('video/'));
      
      if (videoFiles.length > 0 && !providerDb.allowVideos) {
        throw new Error('이 프로바이더는 비디오를 지원하지 않습니다.');
      }
      
      // 기타 파일 처리
      const otherFiles = files.filter((file: any) => 
        !file.mimetype?.startsWith('image/') && !file.mimetype?.startsWith('video/')
      );
      
      if (otherFiles.length > 0 && !providerDb.allowFiles) {
        throw new Error('이 프로바이더는 파일 첨부를 지원하지 않습니다.');
      }
      
      // 파일 변환 및 메시지에 추가
      const processedFiles: IFile[] = [];
      
      for (const file of files) {
        processedFiles.push({
          name: file.name,
          type: file.mimetype,
          content: file.data,
          encoding: 'base64',
        });
      }
      
      // 요청 로깅 시작
      logId = await this.logRequest({
        userId,
        providerId,
        requestType: 'chat',
        requestBody: {
          messages: updatedMessages,
          model,
          temperature,
          maxTokens,
          files: files.map((f: any) => ({ name: f.name, type: f.mimetype, size: f.size })),
        },
      });
      
      // 프로바이더에 요청
      const chatRequest: IChatRequest = {
        messages: updatedMessages,
        model,
        temperature,
        maxTokens,
        files: processedFiles,
      };
      
      const response = await provider.chat(chatRequest);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // 응답 로깅 완료
      await this.updateLog(logId, {
        status: 'success',
        responseBody: response,
        executionTime,
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
        totalTokens: response.usage?.totalTokens,
      });
      
      return response;
    } catch (error: any) {
      // 오류 로깅
      if (logId) {
        await this.updateLog(logId, {
          status: 'error',
          error: error.message || '알 수 없는 오류',
          executionTime: Date.now() - startTime,
        });
      }
      
      logger.error('채팅 요청 처리 오류:', error);
      throw error;
    }
  }

  /**
   * 텍스트 완성 요청 처리
   */
  public async completion(options: CompletionOptions): Promise<any> {
    const startTime = Date.now();
    let logId: string | null = null;
    
    try {
      const { userId, providerId, prompt, model, temperature, maxTokens } = options;
      
      // 프로바이더 가져오기
      const provider = await providerManager.getProvider(providerId);
      
      if (!provider) {
        throw new Error(`프로바이더를 찾을 수 없습니다: ${providerId}`);
      }
      
      // 요청 로깅 시작
      logId = await this.logRequest({
        userId,
        providerId,
        requestType: 'completion',
        requestBody: {
          prompt,
          model,
          temperature,
          maxTokens,
        },
      });
      
      // 프로바이더에 요청
      const completionRequest: ICompletionRequest = {
        prompt,
        model,
        temperature,
        maxTokens,
      };
      
      const response = await provider.completion(completionRequest);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // 응답 로깅 완료
      await this.updateLog(logId, {
        status: 'success',
        responseBody: response,
        executionTime,
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
        totalTokens: response.usage?.totalTokens,
      });
      
      return response;
    } catch (error: any) {
      // 오류 로깅
      if (logId) {
        await this.updateLog(logId, {
          status: 'error',
          error: error.message || '알 수 없는 오류',
          executionTime: Date.now() - startTime,
        });
      }
      
      logger.error('텍스트 완성 요청 처리 오류:', error);
      throw error;
    }
  }

  /**
   * 요청 로깅
   */
  private async logRequest(data: {
    userId: number | null;
    providerId: string;
    requestType: string;
    requestBody: any;
  }): Promise<string> {
    try {
      const log = await Log.create({
        id: uuidv4(),
        userId: data.userId,
        providerId: data.providerId,
        requestType: data.requestType,
        requestBody: data.requestBody,
        responseBody: null,
        status: 'pending',
        executionTime: null,
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
        error: null,
      });
      
      return log.id;
    } catch (error: any) {
      logger.error('요청 로깅 오류:', error);
      return '';
    }
  }

  /**
   * 로그 업데이트
   */
  private async updateLog(
    logId: string,
    data: {
      status: string;
      responseBody?: any;
      executionTime?: number;
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      error?: string;
    }
  ): Promise<void> {
    try {
      if (!logId) return;
      
      await Log.update(data, { where: { id: logId } });
    } catch (error: any) {
      logger.error('로그 업데이트 오류:', error);
    }
  }
}

export default new AIService(); 