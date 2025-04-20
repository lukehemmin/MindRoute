import crypto from 'crypto';
import config from '../config/config';

// 암호화 알고리즘
const ALGORITHM = 'aes-256-cbc';
// 암호화 키 (실제 프로덕션에서는 환경 변수에서 가져와야 함)
const ENCRYPTION_KEY = config.encryptionKey || 'your-encryption-key-must-be-32-chars';

// 암호화 함수
export const encrypt = (text: string): string => {
  try {
    console.log(`암호화 시작, 텍스트 길이: ${text.length}, 첫 몇 글자: ${text.substring(0, 5)}...`);
    
    // 초기화 벡터 생성
    const iv = crypto.randomBytes(16);
    
    // 키가 32바이트(256비트)인지 확인
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').slice(0, 32);
    console.log(`암호화 키 길이: ${key.length}바이트, 암호화 키 해시: ${crypto.createHash('md5').update(key).digest('hex')}`);
    
    // 암호화
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // IV와 암호화된 텍스트를 합쳐서 반환
    const result = iv.toString('hex') + ':' + encrypted;
    console.log(`암호화 완료, 결과 길이: ${result.length}, 형식: ${result.substring(0, 16)}..., IV 길이: ${iv.length}바이트`);
    
    return result;
  } catch (error) {
    console.error('암호화 오류:', error);
    throw new Error('암호화 실패: ' + (error instanceof Error ? error.message : String(error)));
  }
};

// 복호화 함수
export const decrypt = (encryptedText: string): string => {
  try {
    console.log(`복호화 시작, 암호화된 텍스트 길이: ${encryptedText.length}`);
    
    // IV와 암호화된 텍스트 분리
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error(`잘못된 암호화 형식: ${encryptedText.substring(0, 10)}...`);
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    console.log(`IV 길이: ${iv.length}바이트, IV 데이터: ${parts[0].substring(0, 10)}..., 암호화된 데이터 길이: ${encrypted.length}`);
    
    // 키가 32바이트(256비트)인지 확인
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').slice(0, 32);
    console.log(`복호화 키 길이: ${key.length}바이트, 암호화 키 해시: ${crypto.createHash('md5').update(key).digest('hex')}`);
    
    // 복호화
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log(`복호화 완료, 결과 길이: ${decrypted.length}, 첫 몇 글자: ${decrypted.substring(0, 5)}...`);
    
    return decrypted;
  } catch (error) {
    console.error('복호화 오류:', error);
    throw new Error('복호화 실패: ' + (error instanceof Error ? error.message : String(error)));
  }
}; 