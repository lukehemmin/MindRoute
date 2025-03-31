import crypto from 'crypto';
import config from '../config/config';

// 암호화 알고리즘
const ALGORITHM = 'aes-256-cbc';
// 암호화 키 (실제 프로덕션에서는 환경 변수에서 가져와야 함)
const ENCRYPTION_KEY = config.encryptionKey || 'your-encryption-key-must-be-32-chars';

// 암호화 함수
export const encrypt = (text: string): string => {
  try {
    // 초기화 벡터 생성
    const iv = crypto.randomBytes(16);
    
    // 키가 32바이트(256비트)인지 확인
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').slice(0, 32);
    
    // 암호화
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // IV와 암호화된 텍스트를 합쳐서 반환
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('암호화 오류:', error);
    throw new Error('암호화 실패');
  }
};

// 복호화 함수
export const decrypt = (encryptedText: string): string => {
  try {
    // IV와 암호화된 텍스트 분리
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // 키가 32바이트(256비트)인지 확인
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').slice(0, 32);
    
    // 복호화
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('복호화 오류:', error);
    throw new Error('복호화 실패');
  }
}; 