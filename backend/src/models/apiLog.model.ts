import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { User } from './user.model';

// API 로그 속성 인터페이스
export interface ApiLogAttributes {
  id: string;
  userId: number | null;
  email: string | null;
  apiKeyId: string | null;
  apiKeyName: string | null;
  apiKey: string | null;
  model: string | null;
  input: Record<string, any>;
  output: Record<string, any> | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  configuration: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// API 로그 모델 클래스
export class ApiLog extends Model<ApiLogAttributes> implements ApiLogAttributes {
  public id!: string;
  public userId!: number | null;
  public email!: string | null;
  public apiKeyId!: string | null;
  public apiKeyName!: string | null;
  public apiKey!: string | null;
  public model!: string | null;
  public input!: Record<string, any>;
  public output!: Record<string, any> | null;
  public promptTokens!: number | null;
  public completionTokens!: number | null;
  public totalTokens!: number | null;
  public configuration!: Record<string, any> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ApiLog.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    apiKeyId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    apiKeyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    input: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    output: {
      type: DataTypes.JSONB,
      allowNull: true,
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
    configuration: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'api_logs',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['apiKeyId'],
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['model'],
      },
    ],
  }
);

// 사용자 관계 설정
ApiLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export default ApiLog; 