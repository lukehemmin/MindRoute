import crypto from 'crypto';
import { logger } from '../utils/logger';

export class CryptoService {
  private algorithm = 'aes-256-cbc';
  private secretKey: Buffer;
  private iv: Buffer;

  constructor() {
    // 환경변수에서 키를 가져오거나 기본값 사용
    const encryptionKey = process.env.ENCRYPTION_KEY || 'mindroute-default-encryption-key-32ch';
    const encryptionIV = process.env.ENCRYPTION_IV || 'mindroute-iv-16ch';

    // 키와 IV 생성 (AES-256-CBC: 키 32바이트, IV 16바이트 필요)
    this.secretKey = crypto.createHash('sha256').update(encryptionKey).digest().slice(0, 32);
    this.iv = Buffer.alloc(16, 0);
    encryptionIV.split('').forEach((char, i) => {
      if (i < 16) this.iv[i] = char.charCodeAt(0);
    });
  }

  async encrypt(text: string): Promise<string> {
    try {
      if (!text) return '';
      
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, this.iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      logger.error('암호화 중 오류 발생:', error);
      throw new Error('암호화 작업 중 오류가 발생했습니다');
    }
  }

  async decrypt(encryptedText: string): Promise<string> {
    try {
      if (!encryptedText) return '';
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, this.iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('복호화 중 오류 발생:', error);
      throw new Error('복호화 작업 중 오류가 발생했습니다');
    }
  }
}
