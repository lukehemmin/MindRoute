import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

// 로그 속성 인터페이스
export interface LogAttributes {
  id: string;
  userId: number | null;
  providerId: string | null;
  requestType: string;
  requestBody: Record<string, any>;
  responseBody: Record<string, any> | null;
  status: string;
  executionTime: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  error: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// 로그 모델 클래스
export class Log extends Model<LogAttributes> implements LogAttributes {
  public id!: string;
  public userId!: number | null;
  public providerId!: string | null;
  public requestType!: string;
  public requestBody!: Record<string, any>;
  public responseBody!: Record<string, any> | null;
  public status!: string;
  public executionTime!: number | null;
  public promptTokens!: number | null;
  public completionTokens!: number | null;
  public totalTokens!: number | null;
  public error!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Log.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'providers',
        key: 'id',
      },
    },
    requestType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requestBody: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    responseBody: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    executionTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '실행 시간 (밀리초 단위)',
    },
    promptTokens: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    completionTokens: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalTokens: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'logs',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['providerId'],
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default Log; 