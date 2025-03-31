import CryptoJS from 'crypto-js';
import config from '../config/config';

/**
 * API 키를 암호화합니다
 * @param apiKey 암호화할 API 키
 * @returns 암호화된 API 키
 */
export function encryptApiKey(apiKey: string): string {
  const { key, iv } = config.encryption;
  
  // 키와 IV가 제대로 설정되었는지 확인
  if (!key || !iv) {
    throw new Error('암호화 키 또는 IV가 설정되지 않았습니다.');
  }

  const encrypted = CryptoJS.AES.encrypt(
    apiKey,
    CryptoJS.enc.Utf8.parse(key),
    {
      iv: CryptoJS.enc.Utf8.parse(iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    }
  );

  return encrypted.toString();
}

/**
 * 암호화된 API 키를 복호화합니다
 * @param encryptedApiKey 복호화할 암호화된 API 키
 * @returns 복호화된 API 키
 */
export function decryptApiKey(encryptedApiKey: string): string {
  const { key, iv } = config.encryption;
  
  // 키와 IV가 제대로 설정되었는지 확인
  if (!key || !iv) {
    throw new Error('암호화 키 또는 IV가 설정되지 않았습니다.');
  }
  
  const decrypted = CryptoJS.AES.decrypt(
    encryptedApiKey,
    CryptoJS.enc.Utf8.parse(key),
    {
      iv: CryptoJS.enc.Utf8.parse(iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    }
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
}
