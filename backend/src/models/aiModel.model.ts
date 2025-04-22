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
  /**
   * 모델의 설정 값을 저장하는 JSON 필드
   * 
   * 사용 가능한 설정:
   * - temperature: number - 생성 다양성 조절 (기본값: 0.7)
   * - topP: number - 토큰 샘플링 확률 (기본값: 1)
   * - frequencyPenalty: number - 반복 패널티 (기본값: 0)
   * - presencePenalty: number - 주제 패널티 (기본값: 0)
   * - stopSequences: string[] - 생성 중단 시퀀스
   * - seed: number - 랜덤 시드 값
   * - responseFormat: string - 응답 포맷 (json, text 등)
   * - systemPrompt: string - 기본 시스템 프롬프트
   * - streaming: boolean - 스트리밍 응답 활성화 (기본값: true)
   */
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
      field: 'providerid',
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
      field: 'modelid',
    },
    allowImages: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'allowimages',
    },
    allowVideos: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'allowvideos',
    },
    allowFiles: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'allowfiles',
    },
    maxTokens: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'maxtokens',
    },
    contextWindow: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'contextwindow',
    },
    inputPrice: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      field: 'inputprice',
    },
    outputPrice: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      field: 'outputprice',
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0
      },
    },
  },
  {
    sequelize,
    tableName: 'ai_models',
    timestamps: true,
    underscored: true,
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