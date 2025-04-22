import { Request, Response, NextFunction } from 'express';
import apiLogService from '../services/apiLogService';
import logger from '../utils/logger';

/**
 * API 요청 로그를 기록하는 미들웨어
 */
export const logApiRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // 원본 응답 메서드를 저장
  const originalSend = res.send;
  const originalJson = res.json;
  
  // 요청 시작 시간
  const requestStartTime = Date.now();
  
  // 응답 데이터 캡처를 위한 변수
  let responseBody: any = null;
  
  // 응답 데이터를 캡처하기 위해 json 메서드 오버라이드
  res.json = function (body: any): Response {
    responseBody = body;
    return originalJson.call(this, body);
  };
  
  // 응답 데이터를 캡처하기 위해 send 메서드 오버라이드
  res.send = function (body: any): Response {
    // 문자열이 아닌 경우 직접적으로 할당
    if (typeof body !== 'string') {
      responseBody = body;
    }
    // JSON 문자열인 경우 파싱 시도
    else {
      try {
        responseBody = JSON.parse(body);
      } catch (e) {
        // 파싱 실패 시 원본 문자열 할당
        responseBody = body;
      }
    }
    
    return originalSend.call(this, body);
  };
  
  // 응답 완료 이벤트 리스너
  res.on('finish', async () => {
    try {
      // API 로그 기록에 필요한 정보 추출
      const userId = req.user?.id;
      const apiKeyId = req.body?.userApiKeyId || req.query?.apiKeyId;
      const model = req.body?.model || req.params?.model;
      
      // 요청 완료 시간
      const requestEndTime = Date.now();
      
      // 응답 상태 코드가 성공인 경우에만 로그 기록
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // API 로그 기록
        await apiLogService.logApiRequest({
          userId: userId,
          apiKeyId: apiKeyId,
          model: model,
          input: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body,
            params: req.params,
          },
          output: responseBody,
          promptTokens: responseBody?.data?.usage?.promptTokens,
          completionTokens: responseBody?.data?.usage?.completionTokens,
          totalTokens: responseBody?.data?.usage?.totalTokens,
          configuration: {
            temperature: req.body?.temperature,
            maxTokens: req.body?.maxTokens,
            requestTime: requestEndTime - requestStartTime,
          },
        });
      }
    } catch (error) {
      logger.error('API 로그 기록 미들웨어 오류:', error);
    }
  });
  
  // 다음 미들웨어로 이동
  next();
}; 