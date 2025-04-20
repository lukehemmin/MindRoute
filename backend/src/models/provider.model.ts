import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { ProviderType } from '../utils/providerManager';
import { encrypt, decrypt } from '../utils/encryption';

// 제공업체 속성 인터페이스
export interface ProviderAttributes {
  id: string;
  name: string;
  type: string;
  apiKey: string;
  endpointUrl: string | null;
  settings: Record<string, any>;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 제공업체 모델 클래스
export class Provider extends Model<ProviderAttributes> implements ProviderAttributes {
  public id!: string;
  public name!: string;
  public type!: string;
  public apiKey!: string;
  public endpointUrl!: string | null;
  public settings!: Record<string, any>;
  public active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // API 키 복호화 메서드
  public getDecryptedApiKey(): string {
    return decrypt(this.apiKey);
  }
}

Provider.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [Object.values(ProviderType)],
      },
    },
    apiKey: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    endpointUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'providers',
    timestamps: true,
    hooks: {
      // API 키 암호화 훅
      beforeCreate: async (provider: Provider) => {
        if (provider.apiKey) {
          console.log(`[beforeCreate 훅] 제공업체 ${provider.name}(${provider.id}) API 키 암호화 시작`);
          provider.apiKey = encrypt(provider.apiKey);
          console.log(`[beforeCreate 훅] 제공업체 API 키 암호화 완료, 암호화된 키 길이: ${provider.apiKey.length}`);
        }
      },
      beforeUpdate: async (provider: Provider) => {
        // API 키 변경 감지 및 암호화
        if (provider.changed('apiKey')) {
          console.log(`[beforeUpdate 훅] 제공업체 ${provider.name}(${provider.id}) API 키 변경 감지됨`);
          
          // 변경된 API 키 값 가져오기
          const newApiKey = provider.getDataValue('apiKey');
          
          // 이미 암호화된 형식인지 확인 (: 포함 여부로 판단)
          if (newApiKey && !newApiKey.includes(':')) {
            console.log(`[beforeUpdate 훅] 일반 텍스트 API 키 감지, 암호화 진행, 키 길이: ${newApiKey.length}`);
            provider.setDataValue('apiKey', encrypt(newApiKey));
            console.log(`[beforeUpdate 훅] API 키 암호화 완료, 암호화된 키 길이: ${provider.getDataValue('apiKey').length}`);
          } else {
            console.log(`[beforeUpdate 훅] API 키가 이미 암호화된 형식이거나 비어있음, 추가 암호화 건너뜀`);
          }
        } else {
          console.log(`[beforeUpdate 훅] 제공업체 ${provider.name}(${provider.id}) API 키 변경되지 않음`);
        }
        
        // active 필드 변경사항 로깅
        if (provider.changed('active')) {
          console.log(`[beforeUpdate 훅] Provider 활성화 상태 변경: ${provider.id}, 새 상태: ${provider.active}`);
        }
      },
    },
  }
);

export default Provider; 