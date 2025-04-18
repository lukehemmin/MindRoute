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
  allowImages: boolean;
  allowVideos: boolean;
  allowFiles: boolean;
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
  public allowImages!: boolean;
  public allowVideos!: boolean;
  public allowFiles!: boolean;
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
    allowImages: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    allowVideos: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    allowFiles: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
          provider.apiKey = encrypt(provider.apiKey);
        }
      },
      beforeUpdate: async (provider: Provider) => {
        if (provider.changed('apiKey')) {
          provider.apiKey = encrypt(provider.apiKey);
        }
        
        // active 필드 변경사항 로깅
        if (provider.changed('active')) {
          console.log(`Provider 활성화 상태 변경: ${provider.id}, 새 상태: ${provider.active}`);
        }
      },
    },
  }
);

export default Provider; 