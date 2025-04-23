import crypto from 'crypto';
import authConfig from '../config/auth.config';
import logger from './logger';

/**
 * 데이터 암호화/복호화 유틸리티
 * - AES-256-CBC 알고리즘 사용
 * - DB에 저장된 암호화 키 활용
 */
class Encryption {
  private static instance: Encryption;
  
  private constructor() {}
  
  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): Encryption {
    if (!Encryption.instance) {
      Encryption.instance = new Encryption();
    }
    return Encryption.instance;
  }
  
  /**
   * 키 문자열을 AES-256 호환 32바이트 키로 변환
   * @param keyString 원본 키 문자열
   * @returns 32바이트 Buffer
   */
  private deriveKey(keyString: string): Buffer {
    try {
      // 키 문자열을 SHA-256으로 해싱하여 정확히 32바이트(256비트) 길이로 만듦
      return crypto.createHash('sha256').update(String(keyString)).digest();
    } catch (error) {
      logger.error('키 파생 오류:', error);
      // 대체 키 생성 (개발 환경에서만 사용됨)
      const fallbackKey = 'dev_temp_encryption_key_dev_temp_encryption_key';
      return crypto.createHash('sha256').update(fallbackKey).digest();
    }
  }
  
  /**
   * 데이터 암호화
   * @param data 암호화할 데이터
   * @returns 암호화된 문자열 (hex 형식)
   */
  public encrypt(data: string): string {
    try {
      if (!data) return '';
      
      // 원본 키 문자열에서 32바이트 키 도출
      const key = this.deriveKey(authConfig.encryption.key);
      
      // 랜덤 IV(초기화 벡터) 생성
      const iv = crypto.randomBytes(16);
      
      // 암호화
      const cipher = crypto.createCipheriv(
        authConfig.encryption.algorithm, 
        key, 
        iv
      );
      
      // 암호화 및 인코딩
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // IV와 암호화된 데이터 결합 (IV가 앞에 위치)
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      logger.error('데이터 암호화 오류:', error);
      throw new Error('데이터 암호화 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 데이터 복호화
   * @param encryptedData 암호화된 데이터 (hex 형식)
   * @returns 복호화된 원본 데이터
   */
  public decrypt(encryptedData: string): string {
    try {
      if (!encryptedData) return '';
      
      // IV와 암호화된 데이터 분리
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('잘못된 암호화 형식입니다.');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      // 원본 키 문자열에서 32바이트 키 도출
      const key = this.deriveKey(authConfig.encryption.key);
      
      // 복호화
      const decipher = crypto.createDecipheriv(
        authConfig.encryption.algorithm, 
        key, 
        iv
      );
      
      // 복호화 및 디코딩
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('데이터 복호화 오류:', error);
      throw new Error('데이터 복호화 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 문자열 자체 암호화 여부 확인
   * @param text 확인할 문자열
   * @returns 암호화 여부
   */
  public isEncrypted(text: string): boolean {
    if (!text) return false;
    // 암호화된 문자열 형식 확인 (hex IV + ':' + hex data)
    const pattern = /^[0-9a-f]{32}:[0-9a-f]+$/i;
    return pattern.test(text);
  }
  
  /**
   * 데이터 필요시 암호화
   * - 이미 암호화된 경우 그대로 반환
   * @param data 데이터
   * @returns 암호화된 데이터
   */
  public ensureEncrypted(data: string): string {
    if (!data) return '';
    return this.isEncrypted(data) ? data : this.encrypt(data);
  }
  
  /**
   * 데이터 필요시 복호화
   * - 암호화되지 않은 경우 그대로 반환
   * @param data 데이터
   * @returns 복호화된 데이터
   */
  public ensureDecrypted(data: string): string {
    if (!data) return '';
    return this.isEncrypted(data) ? this.decrypt(data) : data;
  }
}

// 기존 코드와의 호환성을 위한 함수 export
export const encrypt = (data: string): string => {
  return Encryption.getInstance().encrypt(data);
};

export const decrypt = (data: string): string => {
  return Encryption.getInstance().decrypt(data);
};

export default Encryption; 