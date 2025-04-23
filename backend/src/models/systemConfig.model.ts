import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SystemConfigAttributes {
  id: number;
  key: string;
  value: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SystemConfigCreationAttributes extends Optional<SystemConfigAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

export class SystemConfig extends Model<SystemConfigAttributes, SystemConfigCreationAttributes> implements SystemConfigAttributes {
  public id!: number;
  public key!: string;
  public value!: string;
  public description!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // 시스템 설정 키 상수 정의
  public static readonly KEYS = {
    JWT_SECRET: 'JWT_SECRET',
    ENCRYPTION_KEY: 'ENCRYPTION_KEY'
  };
}

SystemConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '설정 키 이름',
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '설정 값',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '설정에 대한 설명',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'SystemConfig',
    tableName: 'system_configs',
    timestamps: true,
  }
);

export default SystemConfig; 