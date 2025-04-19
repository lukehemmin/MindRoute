/**
 * API 오류 클래스
 * 
 * 특정 HTTP 상태 코드와 오류 메시지를 포함하는 사용자 정의 오류 클래스.
 * API 응답에서 일관된 오류 형식을 제공하기 위해 사용됩니다.
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  /**
   * ApiError 생성자
   * @param statusCode HTTP 상태 코드
   * @param message 오류 메시지
   * @param isOperational 운영 가능한 오류인지 여부 (기본값: true)
   */
  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // 스택 추적이 이 생성자가 아닌 오류가 발생한 위치를 가리키도록 설정
    Error.captureStackTrace(this, this.constructor);
    
    // 클래스 이름 설정
    Object.setPrototypeOf(this, ApiError.prototype);
  }
} 