import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

export interface RefreshTokenAttributes {
  id: string;
  userId: number;
  token: string;
  expires: Date;
  userAgent?: string;
  ipAddress?: string;
  revoked: boolean;
  revokedReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RefreshToken extends Model<RefreshTokenAttributes> implements RefreshTokenAttributes {
  public id!: string;
  public userId!: number;
  public token!: string;
  public expires!: Date;
  public userAgent!: string | undefined;
  public ipAddress!: string | undefined;
  public revoked!: boolean;
  public revokedReason!: string | undefined;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 만료 여부 확인
  public isExpired(): boolean {
    return new Date() > this.expires;
  }

  // 활성 여부 확인 (만료되지 않고 취소되지 않은 경우)
  public isActive(): boolean {
    return !this.revoked && !this.isExpired();
  }
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    token: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    revokedReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'refreshTokens',
    timestamps: true,
  }
);

// 관계 설정
RefreshToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export default RefreshToken; 