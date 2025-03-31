import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// 로그 속성 인터페이스
export interface LogAttributes {
  id: string;
  userId: string;
  providerId: string;
  timestamp: Date;
  requestBody: any;
  responseBody: any;
  tokensUsed: number | null;
  statusCode: number;
  modelName?: string;
  endpoint?: string;
  executionTime?: number; // 응답 시간(ms)
  createdAt?: Date;
  updatedAt?: Date;
}

// 로그 생성 시 선택적 속성
export interface LogCreationAttributes extends Optional<LogAttributes, 'id' | 'createdAt' | 'updatedAt' | 'tokensUsed' | 'modelName' | 'endpoint' | 'executionTime'> {}

// 로그 모델 클래스
class Log extends Model<LogAttributes, LogCreationAttributes> implements LogAttributes {
  public id!: string;
  public userId!: string;
  public providerId!: string;
  public timestamp!: Date;
  public requestBody!: any;
  public responseBody!: any;
  public tokensUsed!: number | null;
  public statusCode!: number;
  public modelName!: string | undefined;
  public endpoint!: string | undefined;
  public executionTime!: number | undefined;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Log.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'providers',
        key: 'id',
      },
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    requestBody: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    responseBody: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    tokensUsed: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    modelName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    endpoint: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    executionTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Log',
    tableName: 'logs',
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['providerId'],
      },
      {
        fields: ['timestamp'],
      },
    ],
  }
);

export default Log; 