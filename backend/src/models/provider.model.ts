import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ProviderType } from '../utils/providerManager';
import { encrypt, decrypt } from '../utils/encryption';

// 제공업체 속성 인터페이스
export interface ProviderAttributes {
  id: string;
  name: string;
  type: ProviderType;
  apiKey: string;
  endpointUrl?: string;
  allowImages: boolean;
  allowVideos: boolean;
  allowFiles: boolean;
  maxTokens: number | null;
  settings?: any;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 제공업체 생성 시 선택적 속성
export interface ProviderCreationAttributes extends Optional<ProviderAttributes, 'id' | 'createdAt' | 'updatedAt' | 'endpointUrl' | 'settings' | 'active'> {}

// 제공업체 모델 클래스
class Provider extends Model<ProviderAttributes, ProviderCreationAttributes> implements ProviderAttributes {
  public id!: string;
  public name!: string;
  public type!: ProviderType;
  public apiKey!: string;
  public endpointUrl!: string | undefined;
  public allowImages!: boolean;
  public allowVideos!: boolean;
  public allowFiles!: boolean;
  public maxTokens!: number | null;
  public settings!: any;
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
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ProviderType)),
      allowNull: false,
    },
    apiKey: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    endpointUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    allowImages: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    allowVideos: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    allowFiles: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    maxTokens: {
      type: DataTypes.INTEGER,
      allowNull: true, // null은 무제한을 의미
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Provider',
    tableName: 'providers',
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
      },
    },
  }
);

export default Provider; 