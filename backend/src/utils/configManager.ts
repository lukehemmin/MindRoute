import crypto from 'crypto';
import { SystemConfig } from '../models/systemConfig.model';
import logger from './logger';

/**
 * 시스템 설정 값을 관리하는 클래스
 * - DB에서 설정 값을 가져오거나 생성
 * - 메모리에 캐싱하여 성능 최적화
 */
class ConfigManager {
  private static instance: ConfigManager;
  private cache: Map<string, string> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 시스템 설정 초기화 (앱 시작 시 실행)
   * - 중요 시스템 키가 없으면 생성
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 핵심 시스템 키 생성 또는 조회
      await this.getOrCreateSystemKey(
        SystemConfig.KEYS.JWT_SECRET,
        '인증 토큰 생성 및 검증용 비밀 키'
      );
      
      await this.getOrCreateSystemKey(
        SystemConfig.KEYS.ENCRYPTION_KEY,
        '민감 데이터 암호화용 키'
      );

      this.initialized = true;
      logger.info('시스템 설정 관리자가 초기화되었습니다.');
    } catch (error) {
      logger.error('시스템 설정 초기화 중 오류:', error);
      throw error;
    }
  }

  /**
   * 시스템 키 조회 또는 생성
   * @param keyName 설정 키 이름
   * @param description 설정 설명 (선택)
   * @returns 설정 값
   */
  public async getOrCreateSystemKey(keyName: string, description?: string): Promise<string> {
    // 캐시에서 먼저 확인
    if (this.cache.has(keyName)) {
      return this.cache.get(keyName)!;
    }

    try {
      // DB에서 키 조회
      let config = await SystemConfig.findOne({ where: { key: keyName } });
      
      // 키가 없거나 빈 값이면 생성
      if (!config || !config.value) {
        // 강력한 랜덤 키 생성 (32바이트 = 256비트)
        const newKey = crypto.randomBytes(32).toString('base64');
        
        // DB에 저장
        if (!config) {
          config = await SystemConfig.create({
            key: keyName,
            value: newKey,
            description: description || `자동 생성된 ${keyName}`,
          });
          logger.info(`새 시스템 키 생성됨: ${keyName}`);
        } else {
          await config.update({ value: newKey });
          logger.info(`기존 시스템 키 업데이트됨: ${keyName}`);
        }
      }
      
      // 캐시에 저장
      this.cache.set(keyName, config.value);
      return config.value;
    } catch (error) {
      logger.error(`시스템 키 가져오기 실패 (${keyName}):`, error);
      
      // 개발 환경이고 DB 접근 실패 시 임시 키 반환
      if (process.env.NODE_ENV !== 'production') {
        const tempKey = 'dev_temp_key_' + keyName;
        logger.warn(`개발용 임시 키 사용: ${keyName}`);
        return tempKey;
      }
      
      throw error;
    }
  }

  /**
   * 설정 값 가져오기
   * @param keyName 설정 키 이름
   * @returns 설정 값 또는 undefined
   */
  public async getConfig(keyName: string): Promise<string | undefined> {
    // 캐시에서 먼저 확인
    if (this.cache.has(keyName)) {
      return this.cache.get(keyName);
    }

    try {
      // DB에서 키 조회
      const config = await SystemConfig.findOne({ where: { key: keyName } });
      
      if (config && config.value) {
        // 캐시에 저장
        this.cache.set(keyName, config.value);
        return config.value;
      }
      
      return undefined;
    } catch (error) {
      logger.error(`설정 값 가져오기 실패 (${keyName}):`, error);
      return undefined;
    }
  }

  /**
   * 설정 값 설정하기
   * @param keyName 설정 키 이름
   * @param value 설정 값
   * @param description 설정 설명 (선택)
   */
  public async setConfig(keyName: string, value: string, description?: string): Promise<void> {
    try {
      // DB에 저장 (upsert)
      await SystemConfig.upsert({
        key: keyName,
        value,
        description: description || undefined,
      });
      
      // 캐시 업데이트
      this.cache.set(keyName, value);
      logger.info(`설정 값 업데이트: ${keyName}`);
    } catch (error) {
      logger.error(`설정 값 설정 실패 (${keyName}):`, error);
      throw error;
    }
  }

  /**
   * 캐시에서 설정 값 제거 (다음 조회 시 DB에서 새로 가져옴)
   * @param keyName 설정 키 이름
   */
  public clearCache(keyName?: string): void {
    if (keyName) {
      this.cache.delete(keyName);
    } else {
      this.cache.clear();
    }
  }
}

export default ConfigManager; 