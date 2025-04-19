import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Provider from './provider.model';

// AI 모델 속성 인터페이스
export interface AiModelAttributes {
  id: string;
  providerId: string;
  name: string;
  modelId: string;
  allowImages: boolean;
  allowVideos: boolean;
  allowFiles: boolean;
  maxTokens: number | null;
  contextWindow: number | null;
  inputPrice: number | null;
  outputPrice: number | null;
  active: boolean;
  settings: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

// AI 모델 생성 시 필수 속성
export interface AiModelCreationAttributes 
  extends Omit<AiModelAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// AI 모델 클래스
export class AiModel extends Model<AiModelAttributes, AiModelCreationAttributes> 
  implements AiModelAttributes {
  public id!: string;
  public providerId!: string;
  public name!: string;
  public modelId!: string;
  public allowImages!: boolean;
  public allowVideos!: boolean;
  public allowFiles!: boolean;
  public maxTokens!: number | null;
  public contextWindow!: number | null;
  public inputPrice!: number | null;
  public outputPrice!: number | null;
  public active!: boolean;
  public settings!: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 관계 메서드 (타입 정의용)
  public readonly provider?: Provider;
}

AiModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'providers',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modelId: {
      type: DataTypes.STRING,
      allowNull: false,
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
    maxTokens: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    contextWindow: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    inputPrice: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
    },
    outputPrice: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'ai_models',
    timestamps: true,
    indexes: [
      {
        fields: ['providerId'],
      },
      {
        fields: ['active'],
      },
      {
        unique: true,
        fields: ['providerId', 'modelId'],
      },
    ],
  }
);

export default AiModel; 